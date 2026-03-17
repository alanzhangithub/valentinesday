// Email utilities - stubbed out for now (install resend package to enable)

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
 * send an email - stubbed out for now
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  console.log('[email] stubbed - would send:', options.subject);
  return { success: true, data: { id: 'stub' } };
}

/**
 * send email to admin
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendAdminEmail(subject: string, _html: string): Promise<SendEmailResult> {
  console.log('[email] stubbed admin email:', subject);
  return { success: true, data: { id: 'stub' } };
}

/**
 * helper to build simple html email with meedobeedo branding
 */
export function buildEmailHtml(content: string): string {
  return content;
}

// Wish-specific email functions

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

export async function sendWishNotification(data: WishEmailData): Promise<boolean> {
  console.log('[email] stubbed wish notification:', data.wishText);
  return true;
}

export async function sendWishStatusEmail(data: WishGrantedEmailData): Promise<boolean> {
  console.log('[email] stubbed wish status:', data.status);
  return true;
}

// Shop email functions
export async function sendPurchaseConfirmation(purchase: unknown, item: unknown, user: string): Promise<boolean> {
  console.log('[email] stubbed purchase confirmation for:', user);
  return true;
}

export async function sendAdminNotification(purchase: unknown, item: unknown, user: string): Promise<boolean> {
  console.log('[email] stubbed admin notification for purchase by:', user);
  return true;
}

export async function sendFulfillmentNotification(purchase: unknown, item: unknown, user: string): Promise<boolean> {
  console.log('[email] stubbed fulfillment notification for:', user);
  return true;
}
