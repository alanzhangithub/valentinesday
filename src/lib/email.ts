// Email utility for sending wish notifications
// Uses Resend API - configure RESEND_API_KEY in env

interface WishEmailData {
  wishText: string;
  wishedBy: 'meedo' | 'beedo';
  wishedAt: string;
}

interface WishGrantedEmailData {
  wishText: string;
  wishedBy: 'meedo' | 'beedo';
  status: 'granted' | 'denied';
  statusNote?: string;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@meedobeedo.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'mod@meedobeedo.com';

export async function sendWishNotification(data: WishEmailData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email notification');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New Wish from ${data.wishedBy === 'meedo' ? 'Meedo' : 'Beedo'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">A New Wish Has Been Cast</h1>
            <p style="font-size: 18px; color: #666;">
              <strong>${data.wishedBy === 'meedo' ? 'Meedo' : 'Beedo'}</strong> has dropped a wish into the well...
            </p>
            <div style="background: #f9f9f9; border: 2px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="font-size: 20px; color: #333; font-style: italic;">
                "${data.wishText}"
              </p>
            </div>
            <p style="color: #999; font-size: 14px;">
              Wished at: ${new Date(data.wishedAt).toLocaleString()}
            </p>
            <p style="color: #666; margin-top: 20px;">
              Head to the Wishing Well to grant or deny this wish.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 40px;">
              - Mod (the benevolent deity of Meedobeedo)
            </p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send wish notification:', error);
    return false;
  }
}

export async function sendWishStatusEmail(data: WishGrantedEmailData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email notification');
    return false;
  }

  const recipientEmail = process.env[`${data.wishedBy.toUpperCase()}_EMAIL`] || ADMIN_EMAIL;
  const statusEmoji = data.status === 'granted' ? '✨' : '😢';
  const statusText = data.status === 'granted' ? 'GRANTED' : 'denied';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: `${statusEmoji} Your Wish Has Been ${statusText}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">${statusEmoji} Mod Has Spoken ${statusEmoji}</h1>
            <p style="font-size: 18px; color: #666;">
              Your wish has been <strong>${statusText}</strong>!
            </p>
            <div style="background: #f9f9f9; border: 2px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="font-size: 18px; color: #333; font-style: italic;">
                "${data.wishText}"
              </p>
            </div>
            ${data.statusNote ? `
              <p style="color: #666;">
                <strong>Mod says:</strong> ${data.statusNote}
              </p>
            ` : ''}
            <p style="color: #999; font-size: 12px; margin-top: 40px;">
              - Mod (the benevolent deity of Meedobeedo)
            </p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send wish status email:', error);
    return false;
  }
}
