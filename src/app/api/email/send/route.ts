import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendAdminEmail } from '@/lib/email';
import {
  WishSubmittedEmail,
  getWishSubmittedSubject,
  WishGrantedEmail,
  getWishGrantedSubject,
  CouponRedeemedEmail,
  getCouponRedeemedSubject,
  RewardPurchasedEmail,
  getRewardPurchasedSubject,
  MissYouEmail,
  getMissYouSubject,
} from '@/emails';

// email template types
type EmailType =
  | 'wish-submitted'
  | 'wish-granted'
  | 'coupon-redeemed'
  | 'reward-purchased'
  | 'miss-you';

interface EmailPayload {
  type: EmailType;
  to?: string; // optional - some emails go to admin by default
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmailPayload;
    const { type, to, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'missing email type' },
        { status: 400 }
      );
    }

    let html: string;
    let subject: string;
    let recipient = to;

    // generate email content based on type
    switch (type) {
      case 'wish-submitted': {
        const { wisherName, wishTitle, wishDescription } = data as {
          wisherName: string;
          wishTitle: string;
          wishDescription?: string;
        };

        if (!wisherName || !wishTitle) {
          return NextResponse.json(
            { error: 'missing required fields for wish-submitted' },
            { status: 400 }
          );
        }

        html = WishSubmittedEmail({
          wisherName,
          wishTitle,
          wishDescription,
          submittedAt: new Date(),
        });
        subject = getWishSubmittedSubject(wisherName);

        // wish submissions always go to admin
        const result = await sendAdminEmail(subject, html);
        return NextResponse.json(result);
      }

      case 'wish-granted': {
        const { recipientName, wishTitle, grantedMessage } = data as {
          recipientName: string;
          wishTitle: string;
          grantedMessage?: string;
        };

        if (!recipientName || !wishTitle || !recipient) {
          return NextResponse.json(
            { error: 'missing required fields for wish-granted' },
            { status: 400 }
          );
        }

        html = WishGrantedEmail({
          recipientName,
          wishTitle,
          grantedMessage,
          grantedAt: new Date(),
        });
        subject = getWishGrantedSubject();
        break;
      }

      case 'coupon-redeemed': {
        const { creatorName, redeemerName, couponTitle, couponDescription } =
          data as {
            creatorName: string;
            redeemerName: string;
            couponTitle: string;
            couponDescription?: string;
          };

        if (!creatorName || !redeemerName || !couponTitle || !recipient) {
          return NextResponse.json(
            { error: 'missing required fields for coupon-redeemed' },
            { status: 400 }
          );
        }

        html = CouponRedeemedEmail({
          creatorName,
          redeemerName,
          couponTitle,
          couponDescription,
          redeemedAt: new Date(),
        });
        subject = getCouponRedeemedSubject(redeemerName);
        break;
      }

      case 'reward-purchased': {
        const {
          buyerName,
          rewardTitle,
          rewardDescription,
          coinsCost,
          coinsRemaining,
        } = data as {
          buyerName: string;
          rewardTitle: string;
          rewardDescription?: string;
          coinsCost: number;
          coinsRemaining: number;
        };

        if (
          !buyerName ||
          !rewardTitle ||
          coinsCost === undefined ||
          coinsRemaining === undefined ||
          !recipient
        ) {
          return NextResponse.json(
            { error: 'missing required fields for reward-purchased' },
            { status: 400 }
          );
        }

        html = RewardPurchasedEmail({
          buyerName,
          rewardTitle,
          rewardDescription,
          coinsCost,
          coinsRemaining,
          purchasedAt: new Date(),
        });
        subject = getRewardPurchasedSubject(rewardTitle);
        break;
      }

      case 'miss-you': {
        const { recipientName, daysSinceVisit, lastVisitDate } = data as {
          recipientName: string;
          daysSinceVisit: number;
          lastVisitDate: string;
        };

        if (!recipientName || !daysSinceVisit || !lastVisitDate || !recipient) {
          return NextResponse.json(
            { error: 'missing required fields for miss-you' },
            { status: 400 }
          );
        }

        html = MissYouEmail({
          recipientName,
          daysSinceVisit,
          lastVisitDate: new Date(lastVisitDate),
        });
        subject = getMissYouSubject(daysSinceVisit);
        break;
      }

      default:
        return NextResponse.json(
          { error: `unknown email type: ${type}` },
          { status: 400 }
        );
    }

    // send the email
    if (!recipient) {
      return NextResponse.json(
        { error: 'no recipient specified' },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: recipient,
      subject,
      html,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/email/send] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 }
    );
  }
}

// health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'meedobeedo email service is running',
    templates: [
      'wish-submitted',
      'wish-granted',
      'coupon-redeemed',
      'reward-purchased',
      'miss-you',
    ],
  });
}
