import { Resend } from 'resend';

// initialize resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// default sender
const FROM_EMAIL = process.env.EMAIL_FROM || 'Meedobeedo <noreply@meedobeedo.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export type EmailTemplate =
  | 'wish-submitted'
  | 'wish-granted'
  | 'coupon-redeemed'
  | 'reward-purchased'
  | 'miss-you';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * send an email using resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('[email] send failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[email] sent successfully:', data?.id);
    return { success: true, data: { id: data?.id || '' } };
  } catch (err) {
    console.error('[email] unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'unknown error'
    };
  }
}

/**
 * send email to admin (for wish notifications etc)
 */
export async function sendAdminEmail(subject: string, html: string): Promise<SendEmailResult> {
  if (!ADMIN_EMAIL) {
    console.warn('[email] no admin email configured');
    return { success: false, error: 'no admin email configured' };
  }

  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
  });
}

/**
 * helper to build simple html email with meedobeedo branding
 */
export function buildEmailHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px dashed #e5e5e5;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: -1px;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px dashed #e5e5e5;
      text-align: center;
      font-size: 14px;
      color: #888;
    }
    .button {
      display: inline-block;
      background: #000;
      color: #fff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      margin: 16px 0;
    }
    .highlight {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">meedobeedo</div>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    sent with love from the meedobeedo universe<br>
    (this is a private email, pls no reply)
  </div>
</body>
</html>
`.trim();
}

export { resend };
