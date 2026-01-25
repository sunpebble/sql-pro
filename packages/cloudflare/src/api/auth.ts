import type {
  Env,
  GitHubEmail,
  GitHubUser,
  Session,
  SsoToken,
  User,
} from './types';
import { nanoid } from 'nanoid';

// ============ User Operations ============

export async function createUser(
  env: Env,
  user: Omit<User, 'created_at' | 'updated_at'>
): Promise<User> {
  const now = new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO users (id, email, name, avatar_url, provider, provider_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      user.id,
      user.email,
      user.name,
      user.avatar_url,
      user.provider,
      user.provider_id,
      now,
      now
    )
    .run();

  return { ...user, created_at: now, updated_at: now };
}

export async function getUserById(env: Env, id: string): Promise<User | null> {
  const result = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!result) return null;
  return result as unknown as User;
}

export async function getUserByEmail(
  env: Env,
  email: string
): Promise<User | null> {
  const result = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!result) return null;
  return result as unknown as User;
}

export async function getUserByProvider(
  env: Env,
  provider: string,
  providerId: string
): Promise<User | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
  )
    .bind(provider, providerId)
    .first();

  if (!result) return null;
  return result as unknown as User;
}

export async function updateUser(
  env: Env,
  id: string,
  updates: Partial<Pick<User, 'name' | 'avatar_url' | 'email'>>
): Promise<void> {
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?'];
  const values: (string | null)[] = [now];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatar_url);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  values.push(id);
  await env.DB.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

// ============ Session Operations ============

export async function createSession(
  env: Env,
  userId: string,
  expiresInDays: number = 30
): Promise<Session> {
  const id = nanoid();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + expiresInDays * 24 * 60 * 60 * 1000
  );

  await env.DB.prepare(
    `
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `
  )
    .bind(id, userId, expiresAt.toISOString(), now.toISOString())
    .run();

  return {
    id,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
  };
}

export async function getSession(
  env: Env,
  id: string
): Promise<Session | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  )
    .bind(id)
    .first();

  if (!result) return null;
  return result as unknown as Session;
}

export async function deleteSession(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export async function deleteUserSessions(
  env: Env,
  userId: string
): Promise<void> {
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?')
    .bind(userId)
    .run();
}

export async function cleanExpiredSessions(env: Env): Promise<void> {
  await env.DB.prepare(
    'DELETE FROM sessions WHERE expires_at < datetime("now")'
  ).run();
}

// ============ SSO Token Operations ============

export async function createSsoToken(
  env: Env,
  userId: string,
  expiresInMinutes: number = 5
): Promise<SsoToken> {
  const id = nanoid();
  const token = nanoid(32); // Longer token for security
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  await env.DB.prepare(
    `
    INSERT INTO sso_tokens (id, user_id, token, used, expires_at, created_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `
  )
    .bind(id, userId, token, expiresAt.toISOString(), now.toISOString())
    .run();

  return {
    id,
    user_id: userId,
    token,
    used: false,
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
  };
}

export async function validateAndConsumeSsoToken(
  env: Env,
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const result = await env.DB.prepare(
    `
    SELECT * FROM sso_tokens 
    WHERE token = ? AND used = 0 AND expires_at > datetime("now")
  `
  )
    .bind(token)
    .first();

  if (!result) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  // Mark token as used
  await env.DB.prepare('UPDATE sso_tokens SET used = 1 WHERE id = ?')
    .bind((result as { id: string }).id)
    .run();

  return { valid: true, userId: (result as { user_id: string }).user_id };
}

export async function cleanExpiredSsoTokens(env: Env): Promise<void> {
  await env.DB.prepare(
    'DELETE FROM sso_tokens WHERE expires_at < datetime("now") OR used = 1'
  ).run();
}

// ============ GitHub OAuth ============

export async function exchangeGitHubCode(
  env: Env,
  code: string
): Promise<{ accessToken: string } | { error: string }> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (data.error || !data.access_token) {
    return { error: data.error || 'Failed to exchange code' };
  }

  return { accessToken: data.access_token };
}

export async function getGitHubUser(
  accessToken: string
): Promise<GitHubUser | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SQL-Pro-App',
      },
    });

    if (!response.ok) {
      console.error(
        'GitHub user API error:',
        response.status,
        await response.text()
      );
      return null;
    }

    const user = (await response.json()) as GitHubUser;
    console.log('GitHub user:', user.login, 'email:', user.email);
    return user;
  } catch (error) {
    console.error('GitHub user fetch error:', error);
    return null;
  }
}

export async function getGitHubEmails(
  accessToken: string
): Promise<{ emails: GitHubEmail[]; error?: string; status?: number }> {
  try {
    // Try with token format (older OAuth apps) first
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SQL-Pro-App',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub emails API error:', response.status, errorText);
      return { emails: [], error: errorText, status: response.status };
    }

    const emails = (await response.json()) as GitHubEmail[];
    console.log('GitHub emails response:', JSON.stringify(emails));
    return { emails };
  } catch (error) {
    console.error('GitHub emails fetch error:', error);
    return { emails: [], error: String(error) };
  }
}

export async function getGitHubPrimaryEmail(
  accessToken: string
): Promise<string | null> {
  const result = await getGitHubEmails(accessToken);
  const emails = result.emails;
  console.log(
    'Finding primary email from:',
    emails.length,
    'emails',
    'error:',
    result.error,
    'status:',
    result.status
  );
  const primary = emails.find((e) => e.primary && e.verified);
  if (primary) {
    console.log('Found primary verified email:', primary.email);
    return primary.email;
  }
  const verified = emails.find((e) => e.verified);
  if (verified) {
    console.log('Found verified email:', verified.email);
    return verified.email;
  }
  // Fallback: return any email
  if (emails.length > 0) {
    console.log('Fallback to first email:', emails[0].email);
    return emails[0].email;
  }
  console.log('No email found');
  return null;
}

// ============ License-User Linking ============

export async function linkLicenseToUser(
  env: Env,
  licenseId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE licenses SET user_id = ?, updated_at = ? WHERE id = ?'
  )
    .bind(userId, now, licenseId)
    .run();
}

export async function getUserLicenses(
  env: Env,
  userId: string
): Promise<unknown[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM licenses WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(userId)
    .all();

  return result.results || [];
}

export async function linkLicensesByEmail(
  env: Env,
  userId: string,
  email: string
): Promise<number> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    'UPDATE licenses SET user_id = ?, updated_at = ? WHERE email = ? AND user_id IS NULL'
  )
    .bind(userId, now, email)
    .run();

  return result.meta.changes || 0;
}
