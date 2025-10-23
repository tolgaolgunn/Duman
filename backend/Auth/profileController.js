import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

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
  const user = await User.findById(userId).select('username email interests avatar cover bio');
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });


  return res.status(200).json({ username: user.username, email: user.email, interests: user.interests, avatar: user.avatar, cover: user.cover, bio: user.bio });
  } catch (error) {
    console.error('getProfile error', error);
    return res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

export const updateProfile = async (req, res) => {
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
  const { username, email, interests, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });


  user.username = username || user.username;
  user.email = email || user.email;
  user.interests = interests || user.interests;
  user.bio = typeof bio === 'string' ? bio : user.bio;

  await user.save();


  return res.status(200).json({ username: user.username, email: user.email, interests: user.interests, avatar: user.avatar, cover: user.cover, bio: user.bio });
  } catch (error) {
    console.error('updateProfile error', error);
    return res.status(500).json({ error: 'Bir hata oluştu' });
  }
};

export const uploadPhoto = async (req, res) => {
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

    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file uploaded' });

    const userId = payload.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    // Expect a field 'type' = 'avatar' | 'cover'
    const { type } = req.body;

    // Validate MIME type
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Sadece JPEG, PNG veya WEBP dosyaları yükleyebilirsiniz' });
    }

    // Configure cloudinary
    cloudinary.v2.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });

    // Use deterministic public_id: Duman/<userId>/<type>
    const publicId = `Duman/${userId}/${type}`;

    // Delete previous asset if exists
    try {
      const prevId = type === 'cover' ? user.coverPublicId : user.avatarPublicId;
      if (prevId) {
        await cloudinary.v2.uploader.destroy(prevId, { invalidate: true });
      }
    } catch (e) {
      console.warn('Failed to delete previous cloudinary asset', e);
    }

    // Upload buffer to Cloudinary with given public_id
    const uploadFromBuffer = (buffer, options = {}) => {
      return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.v2.uploader.upload_stream(options, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
      });
    };

    const result = await uploadFromBuffer(req.file.buffer, { public_id: publicId, folder: 'Duman', overwrite: true });

    if (!result || !result.secure_url) throw new Error('Cloudinary upload failed');

    if (type === 'cover') {
      user.cover = result.secure_url;
      user.coverPublicId = result.public_id;
    } else {
      user.avatar = result.secure_url;
      user.avatarPublicId = result.public_id;
    }

    await user.save();

    return res.status(200).json({ avatar: user.avatar, cover: user.cover });
  } catch (error) {
    console.error('uploadPhoto error', error);
    return res.status(500).json({ error: 'Bir hata oluştu' });
  }
};