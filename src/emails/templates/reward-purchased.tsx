import { buildEmailHtml } from '@/lib/email';

interface RewardPurchasedProps {
  buyerName: string;
  rewardTitle: string;
  rewardDescription?: string;
  coinsCost: number;
  coinsRemaining: number;
  purchasedAt: Date;
}

/**
 * confirmation email when someone purchases a reward from the shop
 */
export function RewardPurchasedEmail({
  buyerName,
  rewardTitle,
  rewardDescription,
  coinsCost,
  coinsRemaining,
  purchasedAt,
}: RewardPurchasedProps) {
  const formattedDate = purchasedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h2>purchase confirmed!</h2>
    <p>
      nice one ${buyerName}! your meedo coins have been well spent.
    </p>

    <div class="highlight">
      <strong>you got:</strong> ${rewardTitle}
      ${rewardDescription ? `<p style="margin-top: 8px; color: #666;">${rewardDescription}</p>` : ''}
      <p style="margin-top: 12px;">
        <strong style="color: #f59e0b;">${coinsCost} meedo coins</strong> spent
      </p>
    </div>

    <p>
      you still have <strong>${coinsRemaining} meedo coins</strong> left to spend.
      ${coinsRemaining < 50 ? 'might be time to play some games!' : 'ballin!'}
    </p>

    <p style="color: #888; font-size: 14px;">
      purchased on ${formattedDate}
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/shop" class="button">
      back to the shop
    </a>

    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      thanks for shopping at the meedobeedo store. come again!
    </p>
  `;

  return buildEmailHtml(content);
}

export function getRewardPurchasedSubject(rewardTitle: string): string {
  return `you got "${rewardTitle}"!`;
}
