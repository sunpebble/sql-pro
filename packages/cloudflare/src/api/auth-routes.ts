import type { Env } from './types';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { nanoid } from 'nanoid';
import {
  createSession,
  createSsoToken,
  createUser,
  deleteSession,
  exchangeGitHubCode,
  getGitHubEmails,
  getGitHubPrimaryEmail,
  getGitHubUser,
  getSession,
  getUserById,
  getUserByProvider,
  getUserLicenses,
  linkLicensesByEmail,
  updateUser,
  validateAndConsumeSsoToken,
} from './auth';
import { getErrorMessage } from './error-utils';

const SESSION_COOKIE = 'quarry_session';

const auth = new Hono<{ Bindings: Env }>();

// ============================================
// GitHub OAuth
// ============================================

// Start GitHub OAuth flow
auth.get('/github', (c) => {
  const debug = c.req.query('debug') === '1';
  const clientId = c.env.GITHUB_CLIENT_ID;
  const redirectUri = new URL(
    '/api/auth/github/callback',
    c.req.url
  ).toString();
  const state = nanoid();

  // Store state in cookie for CSRF protection
  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Store debug flag
  if (debug) {
    setCookie(c, 'oauth_debug', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 10,
      path: '/',
    });
  }

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', state);

  return c.redirect(authUrl.toString());
});

// GitHub OAuth callback
auth.get('/github/callback', async (c) => {
  // Check for debug mode
  const debug =
    c.req.query('debug') === '1' || getCookie(c, 'oauth_debug') === '1';

  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const storedState = getCookie(c, 'oauth_state');

    // Clear state cookie
    deleteCookie(c, 'oauth_state');

    if (!code || !state || state !== storedState) {
      console.error('OAuth state mismatch:', {
        code: !!code,
        state,
        storedState,
      });
      if (debug)
        return c.json({
          error: 'invalid_state',
          code: !!code,
          state,
          storedState,
        });
      return c.redirect('/?error=invalid_state');
    }

    // Exchange code for access token
    const tokenResult = await exchangeGitHubCode(c.env, code);
    if ('error' in tokenResult) {
      console.error('GitHub OAuth error:', tokenResult.error);
      if (debug)
        return c.json({ error: 'oauth_failed', details: tokenResult.error });
      return c.redirect('/?error=oauth_failed');
    }

    // Get user info from GitHub
    const githubUser = await getGitHubUser(tokenResult.accessToken);
    if (!githubUser) {
      console.error('Failed to get GitHub user');
      if (debug) return c.json({ error: 'github_user_failed' });
      return c.redirect('/?error=github_user_failed');
    }

    // Get primary email
    let email = githubUser.email;
    if (!email) {
      email = await getGitHubPrimaryEmail(tokenResult.accessToken);
    }

    // Debug: also fetch all emails to show what we got
    const emailsResult = await getGitHubEmails(tokenResult.accessToken);

    if (!email) {
      console.error(
        'No email found for user:',
        githubUser.login,
        'emails:',
        emailsResult
      );
      if (debug) {
        return c.json({
          error: 'no_email',
          user: githubUser.login,
          publicEmail: githubUser.email,
          emailsFromApi: emailsResult.emails,
          emailsError: emailsResult.error,
          emailsStatus: emailsResult.status,
        });
      }
      return c.redirect(
        `/?error=no_email&user=${encodeURIComponent(githubUser.login)}`
      );
    }

    // Find or create user
    let user = await getUserByProvider(c.env, 'github', String(githubUser.id));

    if (user) {
      // Update user info if changed
      await updateUser(c.env, user.id, {
        name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url,
        email,
      });
    } else {
      // Create new user
      user = await createUser(c.env, {
        id: nanoid(),
        email,
        name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url,
        provider: 'github',
        provider_id: String(githubUser.id),
      });

      // Link any existing licenses to this user
      await linkLicensesByEmail(c.env, user.id, email);
    }

    // Create session
    const session = await createSession(c.env, user.id);

    // Set session cookie
    setCookie(c, SESSION_COOKIE, session.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return c.redirect('/?login=success');
  } catch (error) {
    console.error('GitHub callback error:', error);
    return c.redirect('/?error=callback_failed');
  }
});

// ============================================
// Session Management
// ============================================

// Get current user
auth.get('/me', async (c) => {
  try {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (!sessionId) {
      return c.json({ authenticated: false });
    }

    const session = await getSession(c.env, sessionId);
    if (!session) {
      deleteCookie(c, SESSION_COOKIE);
      return c.json({ authenticated: false });
    }

    const user = await getUserById(c.env, session.user_id);
    if (!user) {
      await deleteSession(c.env, sessionId);
      deleteCookie(c, SESSION_COOKIE);
      return c.json({ authenticated: false });
    }

    // Get user's licenses
    const licenses = await getUserLicenses(c.env, user.id);

    return c.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        provider: user.provider,
      },
      licenses: licenses.map((l: unknown) => {
        const license = l as {
          id: string;
          license_key: string;
          plan: string;
          status: string;
          current_period_end: string;
          max_machines: number;
        };
        return {
          id: license.id,
          licenseKey: license.license_key,
          plan: license.plan,
          status: license.status,
          expiresAt: license.current_period_end,
          maxMachines: license.max_machines,
        };
      }),
    });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json({ authenticated: false, error: getErrorMessage(error) }, 500);
  }
});

// Logout
auth.post('/logout', async (c) => {
  try {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (sessionId) {
      await deleteSession(c.env, sessionId);
      deleteCookie(c, SESSION_COOKIE);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// ============================================
// SSO for Desktop App
// ============================================

// Generate SSO token for app login
auth.post('/sso/token', async (c) => {
  try {
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const session = await getSession(c.env, sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session expired' }, 401);
    }

    // Create SSO token (valid for 5 minutes)
    const ssoToken = await createSsoToken(c.env, session.user_id, 5);

    // Return token and deep link URL
    const appUrl = c.env.APP_URL || 'quarry://';
    const deepLink = `${appUrl}auth/sso?token=${ssoToken.token}`;

    return c.json({
      success: true,
      token: ssoToken.token,
      deepLink,
      expiresAt: ssoToken.expires_at,
    });
  } catch (error) {
    console.error('SSO token error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Validate SSO token (called by desktop app)
auth.post('/sso/validate', async (c) => {
  try {
    const { token } = await c.req.json<{ token: string }>();

    if (!token) {
      return c.json({ success: false, error: 'Token is required' }, 400);
    }

    const result = await validateAndConsumeSsoToken(c.env, token);

    if (!result.valid || !result.userId) {
      return c.json(
        { success: false, error: result.error || 'Invalid token' },
        401
      );
    }

    const user = await getUserById(c.env, result.userId);
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get user's licenses
    const licenses = await getUserLicenses(c.env, user.id);

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
      licenses: licenses.map((l: unknown) => {
        const license = l as {
          id: string;
          license_key: string;
          plan: string;
          status: string;
          current_period_end: string;
          max_machines: number;
        };
        return {
          id: license.id,
          licenseKey: license.license_key,
          plan: license.plan,
          status: license.status,
          expiresAt: license.current_period_end,
          maxMachines: license.max_machines,
        };
      }),
    });
  } catch (error) {
    console.error('SSO validate error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

export default auth;
