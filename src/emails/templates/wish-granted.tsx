import { buildEmailHtml } from '@/lib/email';

interface WishGrantedProps {
  recipientName: string;
  wishTitle: string;
  grantedMessage?: string;
  grantedAt: Date;
}

/**
 * email sent to the wisher when their wish is granted
 */
export function WishGrantedEmail({
  recipientName,
  wishTitle,
  grantedMessage,
  grantedAt,
}: WishGrantedProps) {
  const formattedDate = grantedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h2>your wish has been granted!</h2>
    <p>
      hey ${recipientName}!
    </p>
    <p>
      Mod has heard your prayers. your wish has been reviewed and...
      <strong>GRANTED</strong>!
    </p>

    <div class="highlight">
      <strong>your wish:</strong> ${wishTitle}
      ${grantedMessage ? `<p style="margin-top: 12px;"><em>"${grantedMessage}"</em> - Mod</p>` : ''}
    </div>

    <p style="color: #888; font-size: 14px;">
      granted on ${formattedDate}
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/wishes" class="button">
      see your wishes
    </a>

    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      Mod works in mysterious ways... but mostly just loves you
    </p>
  `;

  return buildEmailHtml(content);
}

export function getWishGrantedSubject(): string {
  return `your wish has been granted!`;
}
