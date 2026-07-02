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
  listingTitle: string
) => {
  const subject = `[PassNow] New Request for ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - New Request</h2>
      <p>Hello,</p>
      <p>Great news! <strong>${buyerName || 'A user'}</strong> has requested to buy your item: <strong>${listingTitle}</strong>.</p>
      <p>Please check your Transactions page to review and confirm this request.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Transaction</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(sellerId, subject, htmlContent);
};

export const sendSellerConfirmedEmail = async (
  buyerId: string, 
  sellerName: string, 
  listingTitle: string
) => {
  const subject = `[PassNow] Request Accepted: ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - Request Accepted</h2>
      <p>Hello,</p>
      <p><strong>${sellerName || 'The seller'}</strong> has confirmed your request for: <strong>${listingTitle}</strong>.</p>
      <p>If you haven't already, please go to your Transactions page and confirm the transaction on your end to complete the process.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Transaction</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(buyerId, subject, htmlContent);
};

export const sendBuyerConfirmedEmail = async (
  sellerId: string, 
  buyerName: string, 
  listingTitle: string
) => {
  const subject = `[PassNow] Buyer Confirmed: ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - Buyer Confirmed</h2>
      <p>Hello,</p>
      <p><strong>${buyerName || 'The buyer'}</strong> has confirmed their end of the transaction for: <strong>${listingTitle}</strong>.</p>
      <p>If you haven't already, please go to your Transactions page and confirm the transaction on your end to mark it as fully completed.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Transaction</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(sellerId, subject, htmlContent);
};

export const sendTransactionCompletedEmail = async (
  userId: string,
  listingTitle: string
) => {
  const subject = `[PassNow] Transaction Completed: ${listingTitle}`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #00A67E;">PassNow - Transaction Complete! 🎉</h2>
      <p>Hello,</p>
      <p>The transaction for <strong>${listingTitle}</strong> has been successfully completed by both parties!</p>
      <p>You can now leave a review for the other party to help build trust in our community.</p>
      <div style="margin: 30px 0;">
        <a href="${getAppBaseUrl()}/transactions" style="background-color: #00A67E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
      </div>
      <p style="color: #666; font-size: 12px;">Thank you for using PassNow!</p>
    </div>
  `;
  return sendEmailNotification(userId, subject, htmlContent);
};
