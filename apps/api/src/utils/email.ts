import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@flowraze.com';

  // If SMTP is not configured, we'll log the email (development fallback)
  if (!host || !user || !pass) {
    console.log('\n[Email Delivery Fallback]');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('-------------------------\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(email: string, name: string, token: string, url: string): Promise<void> {
  const html = `
    <h2>Welcome to FlowRaze, ${name}!</h2>
    <p>Please verify your email address to get the most out of your account.</p>
    <p><a href="${url}">Click here to verify your email</a></p>
    <p>If the link doesn't work, you can enter this token manually: <strong>${token}</strong></p>
  `;
  await sendEmail({
    to: email,
    subject: 'Verify your FlowRaze account',
    html,
  });
}

export async function sendInviteEmail(email: string, name: string, inviterName: string, token: string, url: string): Promise<void> {
  const html = `
    <h2>You've been invited to FlowRaze!</h2>
    <p>${inviterName} has invited you to join FlowRaze as <strong>${name}</strong>.</p>
    <p>Click the link below to accept your invitation and set your password:</p>
    <p><a href="${url}">Accept Invitation</a></p>
    <p>If the link doesn't work, you can enter this token manually: <strong>${token}</strong></p>
    <p>This invitation will expire in 7 days.</p>
  `;
  await sendEmail({
    to: email,
    subject: `You've been invited to FlowRaze`,
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, url: string): Promise<void> {
  const html = `
    <h2>Reset Your FlowRaze Password</h2>
    <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
    <p><a href="${url}">Click here to reset your password</a></p>
    <p>If the link doesn't work, you can enter this token manually: <strong>${token}</strong></p>
    <p>This link will expire in 30 minutes.</p>
  `;
  await sendEmail({
    to: email,
    subject: 'Reset your FlowRaze password',
    html,
  });
}
