import type { Env } from './types';
import { Resend } from 'resend';

interface LicenseEmailParams {
  email: string;
  licenseKey: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
}

const PLAN_NAMES: Record<string, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

/**
 * Send license key email to the customer after purchase
 */
export async function sendLicenseEmail(
  env: Env,
  params: LicenseEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { email, licenseKey, plan } = params;

  const resend = new Resend(env.RESEND_API_KEY);

  const planName = PLAN_NAMES[plan] || plan;

  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || 'SQL Pro <noreply@sqlpro.app>',
    to: email,
    subject: 'Your SQL Pro License Key',
    html: generateLicenseEmailHtml({ email, licenseKey, planName }),
    text: generateLicenseEmailText({ email, licenseKey, planName }),
  });

  if (error) {
    console.error('Failed to send license email:', error);
    return { success: false, error: error.message };
  }

  console.log('License email sent successfully:', data?.id);
  return { success: true };
}

interface EmailContent {
  email: string;
  licenseKey: string;
  planName: string;
}

function generateLicenseEmailHtml({
  email,
  licenseKey,
  planName,
}: EmailContent): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SQL Pro License Key</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">SQL Pro</h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Thank you for your purchase!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for purchasing <strong>SQL Pro ${planName}</strong>! Your license key is ready to use.
              </p>
              
              <!-- License Key Box -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your License Key</p>
                <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; color: #333333; word-break: break-all;">
                  ${licenseKey}
                </p>
              </div>
              
              <!-- Instructions -->
              <h2 style="margin: 30px 0 15px; color: #333333; font-size: 18px; font-weight: 600;">How to Activate</h2>
              <ol style="margin: 0 0 20px; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                <li>Open SQL Pro on your computer</li>
                <li>Go to <strong>Settings</strong> &rarr; <strong>License</strong></li>
                <li>Enter your email: <strong>${email}</strong></li>
                <li>Paste your license key</li>
                <li>Click <strong>Activate</strong></li>
              </ol>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If you have any questions, please don't hesitate to contact us at <a href="mailto:support@sqlpro.app" style="color: #667eea; text-decoration: none;">support@sqlpro.app</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #999999; font-size: 13px;">
                &copy; ${new Date().getFullYear()} SQL Pro. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateLicenseEmailText({
  email,
  licenseKey,
  planName,
}: EmailContent): string {
  return `
SQL Pro - Your License Key
===========================

Thank you for purchasing SQL Pro ${planName}!

Your License Key:
${licenseKey}

How to Activate:
1. Open SQL Pro on your computer
2. Go to Settings > License
3. Enter your email: ${email}
4. Paste your license key
5. Click Activate

If you have any questions, please contact us at support@sqlpro.app

---
(c) ${new Date().getFullYear()} SQL Pro. All rights reserved.
`.trim();
}
