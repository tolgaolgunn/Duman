import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Email transporter oluştur
const transporter = nodemailer.createTransport({
  service: 'gmail', // veya başka bir servis
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const resetMailService = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Şifre Sıfırlama',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Şifre Sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
          Şifremi Sıfırla
        </a>
        <p style="margin-top: 20px; color: #666;">
          Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
        </p>
        <p style="color: #666;">
          Link çalışmıyorsa, tarayıcınıza şu adresi kopyalayın:<br>
          ${resetUrl}
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};