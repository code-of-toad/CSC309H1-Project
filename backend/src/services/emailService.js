const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

async function sendPasswordResetEmail(email, resetLink) {
    const mailOptions = {
        from: `"Pepe Da Goat" <${SMTP_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <p>Hello,</p>
            <p>A request was made to reset your password. Click the link below:</p>
            <p><a href="${resetLink}" target="_blank">Reset Your Password</a></p>
            <br/>
            <p>If you did not request this, ignore this email.</p>
        `,
    };
    await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
