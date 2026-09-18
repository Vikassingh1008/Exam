const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  // For production, you should use real SMTP credentials in your .env file
  // e.g. SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=your_email, SMTP_PASS=your_app_password
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Fallback for development using Ethereal (creates a test account automatically)
    console.warn('⚠️ Using Ethereal Email for testing because SMTP credentials are not set in .env');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@examsetu.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
