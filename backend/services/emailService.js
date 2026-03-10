const nodemailer = require('nodemailer');

const allowSelfSignedEmailTls = process.env.EMAIL_ALLOW_SELF_SIGNED_TLS === 'true';

/**
 * Check whether the email environment variables are configured.
 * Returns true only when both EMAIL_USER and EMAIL_PASS have real values.
 */
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) return false;
  if (user === 'your-gmail@gmail.com' || pass === 'your-16-char-app-password') return false;

  return true;
};

// Create reusable transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error(
      'Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env'
    );
  }

  const transportConfig = {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password
    },
  };

  if (allowSelfSignedEmailTls) {
    transportConfig.tls = {
      rejectUnauthorized: false,
    };
  }

  return nodemailer.createTransport(transportConfig);
};

/**
 * Build the styled HTML email content
 */
const buildEmailHTML = (userName, deadline, daysLeft) => {
  const urgencyLabel =
    daysLeft === 0 ? '🔴 Due TODAY' :
      daysLeft === 1 ? '🟠 Due Tomorrow' :
        daysLeft <= 3 ? `🟡 Due in ${daysLeft} days` :
          `🟢 Due in ${daysLeft} days`;

  const priorityColor =
    deadline.priority === 'high' ? '#ef4444' :
      deadline.priority === 'medium' ? '#f59e0b' : '#10b981';

  const dueDateStr = new Date(deadline.deadlineDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return {
    urgencyLabel,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
            <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">⏰</div>
            <span style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">DeadlinePro</span>
          </div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
            Deadline Reminder
          </h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
            Hi ${userName}, don't miss this one!
          </p>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">

          <!-- Urgency Badge -->
          <div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;margin-bottom:20px;letter-spacing:0.5px;">
            ${urgencyLabel}
          </div>

          <!-- Deadline Card -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid ${priorityColor};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:700;">${deadline.title}</h2>
            ${deadline.description ? `<p style="margin:0 0 12px;color:#6b7280;font-size:14px;line-height:1.6;">${deadline.description}</p>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
              <span style="background:#ede9fe;color:#5b21b6;font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;">📁 ${deadline.category.charAt(0).toUpperCase() + deadline.category.slice(1)}</span>
              <span style="background:${priorityColor}1a;color:${priorityColor};font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;">🚦 ${deadline.priority.charAt(0).toUpperCase() + deadline.priority.slice(1)} Priority</span>
              <span style="background:#dbeafe;color:#1e40af;font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;">📅 ${dueDateStr}</span>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin:24px 0 8px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}"
               style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;letter-spacing:0.3px;">
              View Dashboard →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            You're receiving this because reminders are enabled for this deadline.<br/>
            © ${new Date().getFullYear()} DeadlinePro
          </p>
        </div>
      </div>
    </body>
    </html>
    `
  };
};

/**
 * Send a deadline reminder email
 * @param {string} toEmail   - recipient email
 * @param {string} userName  - recipient's name
 * @param {object} deadline  - deadline document
 * @param {number} daysLeft  - days until due (0 = today, negative = overdue)
 */
const sendReminderEmail = async (toEmail, userName, deadline, daysLeft) => {
  const transporter = createTransporter();
  const { urgencyLabel, html } = buildEmailHTML(userName, deadline, daysLeft);

  await transporter.sendMail({
    from: `"DeadlinePro ⏰" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${urgencyLabel} — "${deadline.title}"`,
    html,
  });

  console.log(`✉️  Reminder sent to ${toEmail} for "${deadline.title}"`);
};

/**
 * Send a test email to verify configuration
 * @param {string} toEmail - recipient email
 */
const sendTestEmail = async (toEmail) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"DeadlinePro ⏰" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ DeadlinePro — Email Reminders Working!',
    html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 32px 24px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">✅ Email Configuration Verified</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Your DeadlinePro email reminders are working correctly!
              </p>
            </div>
            <div style="padding:28px 32px;">
              <p style="color:#374151;font-size:14px;line-height:1.7;">
                This is a test email from <strong>DeadlinePro</strong>. If you're reading this, your email reminder system is configured and working perfectly.
              </p>
              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-top:16px;">
                <strong>Reminder schedule:</strong><br/>
                📬 7 days before deadline<br/>
                📬 3 days before deadline<br/>
                📬 1 day before deadline<br/>
                📬 On the day of the deadline
              </p>
            </div>
          </div>
        </body>
        </html>
        `,
  });

  console.log(`✅ Test email sent to ${toEmail}`);
};

/**
 * Send a welcome email to a newly registered user
 * @param {string} toEmail - recipient email
 * @param {string} userName - recipient's name
 */
const sendWelcomeEmail = async (toEmail, userName) => {
  if (!isEmailConfigured()) {
    console.log('⚠️  Email not configured – skipping welcome email');
    return;
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"DeadlinePro ⏰" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Welcome to DeadlinePro, ${userName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">⏰</div>
                <span style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">DeadlinePro</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Welcome aboard! 🚀</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                We're thrilled to have you here, ${userName}.
              </p>
            </div>

            <!-- Body -->
            <div style="padding:28px 32px;">
              <p style="color:#374151;font-size:15px;line-height:1.7;">
                You've successfully created your <strong>DeadlinePro</strong> account! Here's what you can do:
              </p>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin:20px 0;">
                <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.8;">
                  📋 <strong>Track deadlines</strong> for assignments, jobs, internships & more<br/>
                  🔔 <strong>Get email reminders</strong> at 7, 3, and 1 day before due dates<br/>
                  📊 <strong>View analytics</strong> to understand your productivity<br/>
                  🏆 <strong>Earn achievements</strong> as you stay on top of your tasks
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0 12px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}"
                   style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;letter-spacing:0.3px;">
                  Go to Dashboard →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} DeadlinePro — Never miss a deadline again.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✉️  Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`, err.message);
  }
};

/**
 * Send a collaboration invite email
 * @param {string} toEmail - recipient email
 * @param {string} toName - recipient name
 * @param {string} fromName - sharer's name
 * @param {string} deadlineTitle - title of the shared deadline
 */
const sendCollaborationInviteEmail = async (toEmail, toName, fromName, deadlineTitle) => {
  if (!isEmailConfigured()) {
    console.log('⚠️  Email not configured – skipping collaboration invite');
    return;
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"DeadlinePro ⏰" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${fromName} shared a deadline with you — "${deadlineTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
        <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🤝</div>
                <span style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">DeadlinePro</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">You've been invited!</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                ${fromName} shared a deadline with you.
              </p>
            </div>
            <div style="padding:28px 32px;">
              <p style="color:#374151;font-size:15px;line-height:1.7;">
                Hi ${toName}, <strong>${fromName}</strong> has shared the deadline <strong>"${deadlineTitle}"</strong> with you on DeadlinePro.
              </p>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-top:12px;">
                You can now view this deadline, check off sub-tasks, and add notes. Log in to your dashboard to get started.
              </p>
              <div style="text-align:center;margin:28px 0 12px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}"
                   style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;">
                  View Deadline →
                </a>
              </div>
            </div>
            <div style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} DeadlinePro — Never miss a deadline again.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✉️  Collaboration invite sent to ${toEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send collaboration invite to ${toEmail}:`, err.message);
  }
};

const sendVerificationEmail = async (toEmail, toName, otp) => {
  if (!isEmailConfigured()) {
    console.log(`⚠️  Email not configured – skipping OTP for ${toEmail}`);
    return;
  }

  try {
    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"DeadlinePro" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${otp} is your DeadlinePro verification code`,
      text: `Your DeadlinePro verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Email Verification</h2>
          <p>Hello,</p>
          <p>You are receiving this email because you requested to change your email address on DeadlinePro.</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} DeadlinePro</p>
        </div>
      `,
    });

    console.log(`✉️  OTP email sent to ${toEmail}. ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${toEmail}:`, err.message);
    throw err;
  }
};

const sendPasswordResetEmail = async (toEmail, toName, otp) => {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env');
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"DeadlinePro" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your DeadlinePro password reset code`,
    text: `Your DeadlinePro password reset code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
        <p>Hello${toName ? ` ${toName}` : ''},</p>
        <p>Use the verification code below to reset your password.</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; margin: 20px 0; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendReminderEmail,
  sendTestEmail,
  sendWelcomeEmail,
  sendCollaborationInviteEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured
};
