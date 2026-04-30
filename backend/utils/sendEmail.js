const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Note: If using Gmail, you MUST use an "App Password" 
    // generated in your Google Account security settings.
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"HO SOCIAL" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error(`Nodemailer Error: ${error.message}`);
    }
};

module.exports = sendEmail;
