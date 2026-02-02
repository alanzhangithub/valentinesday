import { buildEmailHtml } from '@/lib/email';

interface CouponRedeemedProps {
  creatorName: string;
  redeemerName: string;
  couponTitle: string;
  couponDescription?: string;
  redeemedAt: Date;
}

/**
 * email sent to the coupon creator when someone redeems their coupon
 */
export function CouponRedeemedEmail({
  creatorName,
  redeemerName,
  couponTitle,
  couponDescription,
  redeemedAt,
}: CouponRedeemedProps) {
  const formattedDate = redeemedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h2>coupon alert!</h2>
    <p>
      heads up ${creatorName}!
    </p>
    <p>
      <strong>${redeemerName}</strong> just pulled out one of your coupons and is cashing it in.
      time to deliver on your promise!
    </p>

    <div class="highlight">
      <strong>coupon:</strong> ${couponTitle}
      ${couponDescription ? `<p style="margin-top: 8px; color: #666;">${couponDescription}</p>` : ''}
    </div>

    <p style="color: #888; font-size: 14px;">
      redeemed on ${formattedDate}
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/coupons" class="button">
      view your coupons
    </a>

    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      no takebacks! a coupon is a sacred bond in the meedobeedo universe
    </p>
  `;

  return buildEmailHtml(content);
}

export function getCouponRedeemedSubject(redeemerName: string): string {
  return `${redeemerName} just redeemed your coupon!`;
}
