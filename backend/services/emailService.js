const nodemailer = require("nodemailer");

let transporter;

async function initializeTransporter() {
  if (process.env.EMAIL_SERVICE === "ethereal") {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("📧 Using Ethereal Email (Test Mode)");
  } else {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log("📧 Using Gmail Email Service");
  }
}

const sendWelcomeEmail = async (email, name) => {
  if (!transporter) await initializeTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Welcome to BrinX! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 16px;">
        <div style="background: white; padding: 40px; border-radius: 12px;">
          <h1 style="color: #667eea; margin: 0 0 20px 0;">Welcome to Brin<span style="color: #764ba2;">X</span>! 🚀</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Thank you for joining BrinX - your college task exchange platform!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">🎯 Get Started:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Post tasks you need help with</li>
              <li>Browse and accept tasks from others</li>
              <li>Complete tasks and earn points ⭐</li>
              <li>Build your reputation in the community</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">"Get your task done — smarter, faster, together."</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999; margin: 0;">BrinX Team</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (process.env.EMAIL_SERVICE === "ethereal") {
      console.log(
        "📧 Welcome Email Preview: " + nodemailer.getTestMessageUrl(info)
      );
    }
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  if (!transporter) await initializeTransporter();

  const resetUrl = `http://localhost:${
    process.env.PORT || 5000
  }/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "BrinX - Password Reset Request 🔐",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">You requested to reset your BrinX account password. Click the button below to continue:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
              Reset Password 🔐
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">⏰ <strong>Important:</strong> This link expires in <strong>15 minutes</strong></p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">BrinX - Get your task done — smarter, faster, together.</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (process.env.EMAIL_SERVICE === "ethereal") {
      console.log(
        "📧 Reset Email Preview: " + nodemailer.getTestMessageUrl(info)
      );
    }
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  initializeTransporter,
};
