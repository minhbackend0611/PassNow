import emailjs from '@emailjs/browser';
import { getUserById } from './userService';

export const sendEmailNotification = async (
  userId: string,
  subject: string,
  htmlContent: string
): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    if (!user || !user.email) {
      console.warn(`User ${userId} not found or has no email address`);
      return false;
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS credentials are not configured in environment variables. Email will not be sent in reality.");
      console.log(`[Mock Email] To: ${user.email} | Subject: ${subject}`);
      return true; // Don't fail the transaction just because email is not configured
    }

    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: user.email,
        subject: subject,
        message: htmlContent
      },
      publicKey
    );

    return true;
  } catch (error) {
    console.error("Error sending email via EmailJS:", error);
    return false;
  }
};

// --- Pre-defined Email Templates --- //

const getAppBaseUrl = () => {
  return window.location.origin;
};

export const sendTransactionRequestedEmail = async (
  sellerId: string, 
  buyerName: string, 
  listingTitle: string,
  transactionId: string
) => {
  const subject = `[PassNow] New Request for ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - New Request</h2>
      <p>Hello,</p>
      <p>Great news! <strong>${buyerName || 'A user'}</strong> has requested to buy your item: <strong>${listingTitle}</strong>.</p>
      <p>Please coordinate the handover with the buyer. Confirm delivery only after the item has actually been handed over; that confirmation completes the transaction.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions?id=${transactionId}" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Transaction</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(sellerId, subject, htmlContent);
};

export const sendSellerConfirmedEmail = async (
  buyerId: string, 
  sellerName: string, 
  listingTitle: string,
  transactionId: string
) => {
  const subject = `[PassNow] Transaction Completed: ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - Transaction Completed</h2>
      <p>Hello,</p>
      <p><strong>${sellerName || 'The seller'}</strong> has confirmed the handover for: <strong>${listingTitle}</strong>.</p>
      <p>The transaction is now complete. You can review the seller and record whether you received the item.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions?id=${transactionId}" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Transaction</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(buyerId, subject, htmlContent);
};

export const sendTransactionCompletedEmail = async (
  userId: string,
  listingTitle: string,
  transactionId: string
) => {
  const subject = `[PassNow] Transaction Completed: ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - Transaction Complete! 🎉</h2>
      <p>Hello,</p>
      <p>The transaction for <strong>${listingTitle}</strong> was completed when the seller confirmed the handover.</p>
      <p>No further confirmation is required from the buyer.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions?id=${transactionId}" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(userId, subject, htmlContent);
};

export const sendTransactionCancelledEmail = async (
  sellerId: string,
  buyerName: string,
  listingTitle: string
) => {
  const subject = `[PassNow] Request Cancelled: ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #E53935;">PassNow - Request Cancelled</h2>
      <p>Hello,</p>
      <p>We wanted to let you know that <strong>${buyerName || 'The buyer'}</strong> has cancelled their request to buy your item: <strong>${listingTitle}</strong>.</p>
      <p>You don't need to take any action. Your item is still listed and available for other buyers.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions" style="background-color: #E53935; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Transactions</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(sellerId, subject, htmlContent);
};
