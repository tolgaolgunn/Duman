import postModel from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();


const configureCloudinary = () => {
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

  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });
};

configureCloudinary();

export const createPost = async (req, res) => {
  try {
    // userId is provided by auth middleware
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: 'Invalid or missing authentication' });
    }
    // Debug: log who is creating post (avoid logging large image data)
    try {
      const { title, content } = req.body || {};
      console.log(`createPost called by user=${userId} title="${String(title).slice(0,100)}" contentLength=${String(content || '').length}`);
    } catch (e) {
      console.warn('createPost debug log failed', e);
    }
    const { title, content, image } = req.body;
    // accept tags or interests from client
    let tags = [];
    if (Array.isArray(req.body.tags)) tags = req.body.tags;
    else if (Array.isArray(req.body.interests)) tags = req.body.interests;
    // sanitize tags: keep strings, trim, unique, limit to 10
    tags = tags
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 10);

    // 4. Input validation
    const validationErrors = [];

    if (!title || !title.trim()) {
      validationErrors.push('Title is required');
    } else if (title.trim().length < 3) {
      validationErrors.push('Title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      validationErrors.push('Title cannot exceed 200 characters');
    }

    if (!content || !content.trim()) {
      validationErrors.push('Content is required');
    } else if (content.trim().length < 3) {
      validationErrors.push('Content must be at least 3 characters long');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }

    // 5. Image upload to Cloudinary (optional)
    let imageUrl;
    let imagePublicId;

    if (image && typeof image === 'string' && image.trim()) {
      try {
        // Only accept base64/data URLs here; if front-end sends a remote URL we accept it as-is
        if (image.startsWith('data:image/')) {
          const uploadResult = await cloudinary.uploader.upload(image, {
            folder: 'Duman',
            resource_type: 'image',
            quality: 'auto:good',
            fetch_format: 'auto',
            timeout: 30000 // 30 second timeout
          });

          imageUrl = uploadResult.secure_url;
          imagePublicId = uploadResult.public_id;
        } else if (image.startsWith('http')) {
          // If frontend sent an already uploaded URL, just use it
          imageUrl = image;
        } else {
          // invalid format
          return res.status(400).json({ success: false, error: 'Invalid image format' });
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        let errorMessage = 'Image upload failed';
        if (cloudinaryError.http_code === 400) {
          errorMessage = 'Invalid image file';
        } else if (cloudinaryError.http_code === 413) {
          errorMessage = 'Image file too large';
        }
        return res.status(500).json({ success: false, error: errorMessage });
      }
    }

    // 6. Create new post
    // Save tags into the model's `interests` field (the schema uses `interests`)
    const newPost = new postModel({
      title: title.trim(),
      content: content.trim(),
      image: imageUrl,
      imagePublicId: imagePublicId,
      author: userId,
      interests: tags
    });

    const savedPost = await newPost.save();

    // populate author for frontend convenience
    await savedPost.populate('author', 'username email avatar');

    // 7. Success response
    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
        data: {
        id: savedPost._id,
        title: savedPost.title,
        content: savedPost.content,
        image: savedPost.image,
        imagePublicId: savedPost.imagePublicId,
        author: savedPost.author,
        interests: savedPost.interests || [],
        tags: savedPost.interests || [],
        createdAt: savedPost.createdAt
      }
    });

  } catch (error) {
    console.error('Create post error:', error);

    // 8. Specific error handling
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await postModel.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username email avatar')
      .skip(skip)
      .limit(limit);

    const total = await postModel.countDocuments();

    return res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};