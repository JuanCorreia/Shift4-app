import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@banyanpayments.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://banyanpayments.com";

export async function sendDealStatusEmail(
  to: string,
  name: string,
  dealName: string,
  oldStatus: string,
  newStatus: string,
  dealId: string
) {
  const dealUrl = `${APP_URL}/deals/${dealId}`;
  const statusLabels: Record<string, string> = {
    draft: "Draft",
    review: "In Review",
    approved: "Approved",
    sent: "Sent",
    archived: "Archived",
  };

  await transporter.sendMail({
    from: `"Banyan Payment Gateway" <${FROM_ADDRESS}>`,
    to,
    subject: `Deal "${dealName}" moved to ${statusLabels[newStatus] || newStatus}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #395542; font-size: 24px; margin: 0;">Banyan</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Payment Gateway</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
          <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">Hi ${name},</p>
          <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">
            The deal <strong>${dealName}</strong> has been updated:
          </p>
          <div style="display: flex; align-items: center; gap: 12px; margin: 0 0 24px;">
            <span style="background: #e2e8f0; color: #475569; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">
              ${statusLabels[oldStatus] || oldStatus}
            </span>
            <span style="color: #94a3b8;">&rarr;</span>
            <span style="background: #395542; color: white; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">
              ${statusLabels[newStatus] || newStatus}
            </span>
          </div>
          <a href="${dealUrl}" style="display: inline-block; background: #395542; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
            View Deal
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
          You received this because you have email notifications enabled.
        </p>
      </div>
    `,
  });
}

export async function sendOtpEmail(to: string, code: string, name: string) {
  await transporter.sendMail({
    from: `"Banyan Payment Gateway" <${FROM_ADDRESS}>`,
    to,
    subject: `Your verification code: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #395542; font-size: 24px; margin: 0;">Banyan</h1>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Payment Gateway</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #334155; font-size: 16px; margin: 0 0 8px;">Hi ${name},</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">Enter this code to complete your sign-in:</p>
          <div style="background: #395542; color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
            ${code}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">This code expires in 10 minutes.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
