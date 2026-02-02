import { buildEmailHtml } from '@/lib/email';

interface MissYouProps {
  recipientName: string;
  daysSinceVisit: number;
  lastVisitDate: Date;
}

/**
 * engagement email sent when someone hasn't visited in a while
 */
export function MissYouEmail({
  recipientName,
  daysSinceVisit,
  lastVisitDate,
}: MissYouProps) {
  const formattedLastVisit = lastVisitDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // different messages based on how long they've been gone
  let message: string;
  let emoji: string;

  if (daysSinceVisit <= 3) {
    message = `it's been ${daysSinceVisit} days and beedo is already getting lonely...`;
    emoji = '(._.)';
  } else if (daysSinceVisit <= 7) {
    message = `${daysSinceVisit} whole days without you? beedo has been staring out the window waiting...`;
    emoji = '(T_T)';
  } else {
    message = `it's been ${daysSinceVisit} days. beedo forgot what you look like. meedo is inconsolable.`;
    emoji = '(;_;)';
  }

  const content = `
    <h2>beedo is getting lonely... ${emoji}</h2>
    <p>
      hey ${recipientName},
    </p>
    <p>
      ${message}
    </p>

    <div class="highlight">
      <p style="margin: 0;">
        <strong>last seen:</strong> ${formattedLastVisit}
      </p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
        that's like ${daysSinceVisit * 7} beedo days (they age faster)
      </p>
    </div>

    <p>
      the sticker board misses your chaos. the wishing well is gathering dust.
      even the slot machine hasn't been the same.
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}" class="button">
      come back home
    </a>

    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      sent with slightly desperate love,<br>
      meedo & beedo
    </p>
  `;

  return buildEmailHtml(content);
}

export function getMissYouSubject(daysSinceVisit: number): string {
  if (daysSinceVisit <= 3) {
    return `beedo misses you already...`;
  } else if (daysSinceVisit <= 7) {
    return `beedo is getting lonely (._.)`;
  } else {
    return `please come back, beedo is sad (;_;)`;
  }
}
