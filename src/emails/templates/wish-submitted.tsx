import { buildEmailHtml } from '@/lib/email';

interface WishSubmittedProps {
  wisherName: string;
  wishTitle: string;
  wishDescription?: string;
  submittedAt: Date;
}

/**
 * email sent to admin when someone submits a wish to mod
 */
export function WishSubmittedEmail({
  wisherName,
  wishTitle,
  wishDescription,
  submittedAt,
}: WishSubmittedProps) {
  const formattedDate = submittedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h2>psst... someone made a wish to Mod</h2>
    <p>
      <strong>${wisherName}</strong> just dropped a wish into the wishing well.
      you know what to do.
    </p>

    <div class="highlight">
      <strong>the wish:</strong> ${wishTitle}
      ${wishDescription ? `<p style="margin-top: 8px; color: #666;">${wishDescription}</p>` : ''}
    </div>

    <p style="color: #888; font-size: 14px;">
      wished on ${formattedDate}
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/wishes" class="button">
      review the wish
    </a>

    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      remember: with great Mod power comes great Mod responsibility
    </p>
  `;

  return buildEmailHtml(content);
}

export function getWishSubmittedSubject(wisherName: string): string {
  return `psst... ${wisherName} made a wish to Mod`;
}
