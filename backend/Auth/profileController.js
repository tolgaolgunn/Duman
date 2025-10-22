import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = payload.userId;
    const user = await User.findById(userId).select('username email interests');
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    return res.status(200).json({ username: user.username, email: user.email, interests: user.interests });
  } catch (error) {
    console.error('getProfile error', error);
    return res.status(500).json({ error: 'Bir hata oluştu' });
  }
};
