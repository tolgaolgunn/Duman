import mongoose from 'mongoose';
import User from '../../models/userModel.js';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration - lazy initialization
let cloudinaryConfigured = false;

const configureCloudinary = () => {
  if (cloudinaryConfigured) {
    return; // Already configured
  }

  const requiredConfigs = [
    'CLOUD_NAME',
    'CLOUD_API_KEY',
    'CLOUD_API_SECRET'
  ];

  for (const config of requiredConfigs) {
    if (!process.env[config]) {
      throw new Error(`Missing required environment variable: ${config}`);
    }
  }

  cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });

  cloudinaryConfigured = true;
};

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // authMiddleware'den geliyor

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or missing authentication' 
      });
    }

    const user = await User.findById(userId)
      .select('username email interests avatar cover bio avatarPublicId coverPublicId createdAt updatedAt isPremium');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Return flat response (frontend expects top-level fields)
    return res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      interests: user.interests || [],
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isPremium: user.isPremium
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or missing authentication' 
      });
    }

    const { username, email, interests, bio } = req.body;
    const validationErrors = [];

    // Username validation
    if (username !== undefined) {
      if (!username.trim() || username.length < 2) {
        validationErrors.push('Username must be at least 2 characters long');
      } else if (username.length > 30) {
        validationErrors.push('Username cannot exceed 30 characters');
      }
    }

    // Email validation
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push('Invalid email format');
      }
    }

    // Bio validation
    if (bio !== undefined && bio.length > 500) {
      validationErrors.push('Bio cannot exceed 500 characters');
    }

    // Interests validation
    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        validationErrors.push('Interests must be an array');
      } else if (interests.length > 10) {
        validationErrors.push('Cannot have more than 10 interests');
      } else if (interests.some(interest => interest.length > 20)) {
        validationErrors.push('Each interest cannot exceed 20 characters');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Check for duplicate username if changing
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        username: username.trim(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    // Check for duplicate email if changing
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.trim(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }
    }

    // Update fields
    const updates = {};
    if (username !== undefined) updates.username = username.trim();
    if (email !== undefined) updates.email = email.trim();
    if (interests !== undefined) updates.interests = interests;
    if (bio !== undefined) updates.bio = bio.trim();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { 
        new: true,
        runValidators: true 
      }
    ).select('username email interests avatar cover bio createdAt updatedAt isPremium');

    // Return flat response so frontend can read fields directly
    return res.status(200).json({
      username: updatedUser.username,
      email: updatedUser.email,
      interests: updatedUser.interests || [],
      avatar: updatedUser.avatar,
      cover: updatedUser.cover,
      bio: updatedUser.bio,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      isPremium: updatedUser.isPremium
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Upload profile photo (avatar or cover)
 */
export const uploadPhoto = async (req, res) => {
  try {
    // Configure Cloudinary only when needed
    configureCloudinary();

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const userId = req.user.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or missing authentication' 
      });
    }

    const { type } = req.body;

    // Validate type
    if (!type || !['avatar', 'cover'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Type must be either "avatar" or "cover"' 
      });
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false,
        error: 'Only JPEG, PNG, WEBP, and GIF images are allowed' 
      });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        success: false,
        error: 'File size must be less than 5MB' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Configure upload options based on type
    const uploadOptions = {
      folder: 'Duman/profiles',
      resource_type: 'image',
      overwrite: true
    };

    // Add transformations based on type
    if (type === 'avatar') {
      uploadOptions.transformation = [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' },
        { format: 'webp' }
      ];
      uploadOptions.public_id = `Duman/${userId}/avatar`;
    } else {
      uploadOptions.transformation = [
        { width: 1200, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { format: 'webp' }
      ];
      uploadOptions.public_id = `Duman/${userId}/cover`;
    }

    // Delete previous asset if exists
    try {
      const previousPublicId = type === 'cover' ? user.coverPublicId : user.avatarPublicId;
      if (previousPublicId) {
        await cloudinary.v2.uploader.destroy(previousPublicId, { invalidate: true });
      }
    } catch (deleteError) {
      console.warn('Failed to delete previous Cloudinary asset:', deleteError);
      // Continue with upload even if deletion fails
    }

    // Upload buffer to Cloudinary
    const uploadFromBuffer = (buffer, options = {}) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    };

    const uploadResult = await uploadFromBuffer(req.file.buffer, uploadOptions);

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error('Cloudinary upload failed');
    }

    // Update user document
    const updateData = type === 'cover' 
      ? { cover: uploadResult.secure_url, coverPublicId: uploadResult.public_id }
      : { avatar: uploadResult.secure_url, avatarPublicId: uploadResult.public_id };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('username email avatar cover bio');

    // Return flat response with avatar/cover at top-level
    return res.status(200).json({
      avatar: updatedUser.avatar,
      cover: updatedUser.cover,
      message: `${type === 'avatar' ? 'Avatar' : 'Cover'} uploaded successfully`
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    
    if (error.message.includes('File size too large')) {
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB'
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Failed to upload photo' 
    });
  }
};


export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const user = await User.findById(userId).select('username interests avatar cover bio createdAt updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      username: user.username,
      interests: user.interests || [],
      avatar: user.avatar,
      cover: user.cover,
      bio: user.bio,
      id: user._id
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};