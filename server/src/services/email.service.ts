import nodemailer from 'nodemailer';
import { logger } from '@utils/logger.js';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'SmartHostel <noreply@smarthostel.com>';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  logger.info({ host: SMTP_HOST, port: SMTP_PORT }, 'Email transporter configured');
} else {
  logger.warn('SMTP environment variables not set — email sending is disabled');
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    logger.warn({ to, subject }, 'Skipping email — transporter not configured');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info({ to, subject, messageId: info.messageId }, 'Email sent');

    return info;
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    throw error;
  }
}

export async function sendLeaveApprovalEmail(
  student: { name: string; email: string },
  leaveData: { startDate: string; endDate: string; status: string; reason?: string },
) {
  const subject = `Leave Request ${leaveData.status}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">SmartHostel — Leave Update</h2>
      <p>Dear <strong>${student.name}</strong>,</p>
      <p>Your leave request has been <strong>${leaveData.status.toLowerCase()}</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${leaveData.startDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">To</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${leaveData.endDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${leaveData.status}</td>
        </tr>
        ${leaveData.reason ? `<tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Reason</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${leaveData.reason}</td>
        </tr>` : ''}
      </table>
      <p style="color: #666; font-size: 12px;">This is an automated message from SmartHostel.</p>
    </div>
  `;

  return sendEmail(student.email, subject, html);
}

export async function sendEmergencyAlertEmail(
  recipients: string[],
  alertData: { type: string; severity: string; title: string; description: string },
) {
  const severityColor =
    alertData.severity === 'CRITICAL' ? '#dc2626' :
    alertData.severity === 'HIGH' ? '#ea580c' :
    alertData.severity === 'MEDIUM' ? '#ca8a04' : '#16a34a';

  const subject = `[${alertData.severity}] Emergency Alert: ${alertData.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Emergency Alert</h2>
        <p style="margin: 4px 0 0;">${alertData.type} — ${alertData.severity}</p>
      </div>
      <div style="padding: 16px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <h3>${alertData.title}</h3>
        <p>${alertData.description}</p>
        <p style="color: #666; font-size: 12px;">This is an automated emergency notification from SmartHostel.</p>
      </div>
    </div>
  `;

  const results = await Promise.allSettled(
    recipients.map((email) => sendEmail(email, subject, html)),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  logger.info({ sent, failed, totalRecipients: recipients.length }, 'Emergency alert emails sent');

  return { sent, failed };
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const subject = 'SmartHostel — Password Reset';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Password Reset Request</h2>
      <p>You requested a password reset for your SmartHostel account.</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background: #1a56db; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">If you did not request this reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const subject = 'Welcome to SmartHostel!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Welcome to SmartHostel!</h2>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Your SmartHostel account has been created successfully. You can now access all the hostel management features:</p>
      <ul>
        <li>View and manage your room</li>
        <li>Submit and track complaints</li>
        <li>Book laundry slots</li>
        <li>View mess menus</li>
        <li>Apply for leaves</li>
        <li>Register visitors</li>
      </ul>
      <p>If you have any questions, feel free to reach out to the hostel administration.</p>
      <p style="color: #666; font-size: 12px;">This is an automated message from SmartHostel.</p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
}
