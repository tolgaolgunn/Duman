import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/userModel.js";

export const login = async (req, res) => {
  
  // Log incoming request body for debugging (will show identifier/email/username)
  console.log('Incoming login request body:', req.body);

  const { email, username, password } = req.body;
  const identifier = email || username;

  try {
    if (!identifier) {
      return res.status(400).json({ error: 'Email veya kullanıcı adı gerekli' });
    }


    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }

    const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    return res.status(200).json({
  token,
  user: {
    username: user.username,
    email: user.email,
  }
});
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Bir hata oluştu' });
  }
};
