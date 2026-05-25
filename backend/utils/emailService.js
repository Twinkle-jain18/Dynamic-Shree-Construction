const nodemailer = require('nodemailer');

/**
 * Configure SMTP Transport
 * In production, ensure these ENV variables are set in .env
 */
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred service
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App Password if using Gmail
  },
});

/**
 * Send Acceptance Email to Client
 * @param {string} to - Client Email 
 * @param {string} clientName - Client Name
 * @param {string} service - Service Interested In
 */
const sendAcceptanceEmail = async (to, clientName, service) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials missing. Email not sent.');
    return;
  }

  const mailOptions = {
    from: `"Shree Constructions" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Update Regarding Your Inquiry - Shree Constructions',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #c9a227;">Hello ${clientName},</h2>
        <p>Great news! Your inquiry for <strong>${service}</strong> has been reviewed and accepted by our admin team.</p>
        <p>We are excited to discuss your project in detail. Please contact us personally to take the next steps:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Phone:</strong> +91 9620085363</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> projects@shreeconstructions.com</p>
          <p style="margin: 5px 0;"><strong>Address:</strong> Shree Constructions, Bangalore, India</p>
        </div>

        <p>We look forward to building your dreams together!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Regards,<br>Team Shree Constructions</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Success: Acceptance email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send Discussion Email
 */
const sendDiscussionEmail = async (to, clientName, service) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const mailOptions = {
    from: `"Shree Constructions" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Project Discussion - Shree Constructions',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6a1b9a;">Hello ${clientName},</h2>
        <p>Thank you for your inquiry regarding <strong>${service}</strong>.</p>
        <p>Our expert team is currently reviewing your project details. We would like to discuss some aspects with you to provide the best possible solution.</p>
        <p>One of our consultants will reach out to you shortly on your provided contact number.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Regards,<br>Team Shree Constructions</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Success: Discussion email sent to ${to}`);
  } catch (error) {
    console.error('Error:', error);
  }
};

/**
 * Send Rejection Email
 */
const sendRejectionEmail = async (to, clientName) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const mailOptions = {
    from: `"Shree Constructions" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Update on Your Inquiry - Shree Constructions',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #c62828;">Hello ${clientName},</h2>
        <p>Thank you for your interest in Shree Constructions.</p>
        <p>We have carefully reviewed your inquiry. Unfortunately, we are unable to proceed with your request at this specific time due to our current project schedule and resource allocation.</p>
        <p>We appreciate your time and wish you the best with your project. We would be happy to assist you in the future.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Regards,<br>Team Shree Constructions</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Success: Rejection email sent to ${to}`);
  } catch (error) {
    console.error('Error:', error);
  }
};

module.exports = {
  sendAcceptanceEmail,
  sendDiscussionEmail,
  sendRejectionEmail,
};
