import postModel from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Configure Cloudinary only if env vars are present. In local dev they may be absent.
let cloudinaryConfigured = false;
try {
  if (process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });
    cloudinaryConfigured = true;
  } else {
    console.warn('Cloudinary not fully configured; image uploads will be disabled unless env vars are set.');
  }
} catch (e) {
  console.warn('Cloudinary configuration error:', e && e.message);
}

export const createPost = async (req, res) => {
  try {
    const userId = req.userId || req.user?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: 'Invalid or missing authentication' });
    }

  const { title, content, image } = req.body || {};

  // Title is optional now; only content is required.
  const errors = [];
  if (!content || !String(content).trim()) errors.push('Content is required');
  if (errors.length) return res.status(400).json({ success: false, errors });

    let imageUrl = undefined;
    let imagePublicId = undefined;

    if (image && typeof image === 'string' && image.trim()) {
      if (image.startsWith('data:image/')) {
        if (!cloudinaryConfigured) return res.status(500).json({ success: false, error: 'Image upload not configured on server' });
        const uploadResult = await cloudinary.uploader.upload(image, { folder: 'Duman', resource_type: 'image', quality: 'auto:good', fetch_format: 'auto', timeout: 30000 });
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } else if (image.startsWith('http') || image.startsWith('/')) {
        imageUrl = image;
      } else {
        return res.status(400).json({ success: false, error: 'Invalid image format' });
      }
    }

    let tags = [];
    if (Array.isArray(req.body.tags)) tags = req.body.tags;
    else if (Array.isArray(req.body.interests)) tags = req.body.interests;
    tags = tags.filter(t => typeof t === 'string').map(t => t.trim()).filter(Boolean).slice(0, 10);

    const newPostData = {
      content: String(content).trim(),
      image: imageUrl,
      imagePublicId,
      author: userId,
      interests: tags
    };
    if (title !== undefined && title !== null) {
      const t = String(title || '').trim();
      if (t) newPostData.title = t;
      else newPostData.title = undefined; // explicit: no title
    }

    const newPost = new postModel(newPostData);
    
    const saved = await newPost.save();
    await saved.populate('author', 'username email avatar');

    return res.status(201).json({ 
      success: true, 
      message: 'Post created successfully', 
      data: { 
        id: saved._id, 
        title: saved.title, 
        content: saved.content, 
        image: saved.image, 
        imagePublicId: saved.imagePublicId, 
        author: saved.author, 
        interests: saved.interests || [], 
        tags: saved.interests || [], 
        createdAt: saved.createdAt 
      } 
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ success: false, error: 'Invalid or missing postId' });

    // Use req.post if middleware set it (requirePostOwner); otherwise fetch and check ownership
    let post = req.post;
    if (!post) {
      post = await postModel.findById(postId);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
      if (!req.user || post.author.toString() !== req.user.userId.toString()) return res.status(403).json({ success: false, error: 'You are not authorized to update this post' });
    }

    const { title, content, image, tags, interests } = req.body || {};

    // Validate title/content when provided in update requests.
    // If a client sends an empty string intentionally, respond with 400 instead of letting Mongoose throw a ValidationError.
    if (title !== undefined) {
      // Title is optional. If provided, set trimmed value (may be empty => cleared).
      const t = String(title || '').trim();
      post.title = t || undefined;
    }
    if (content !== undefined) {
      const c = String(content || '').trim();
      if (!c) return res.status(400).json({ success: false, error: 'Content is required' });
      post.content = c;
    }

    let newTags = [];
    if (Array.isArray(tags)) newTags = tags;
    else if (Array.isArray(interests)) newTags = interests;
    // If the client provided tags/interests (including an empty array), update post.interests accordingly.
    if (Array.isArray(tags) || Array.isArray(interests)) {
      post.interests = (newTags || []).map(t => String(t).trim()).filter(Boolean).slice(0, 10);
    }

    // Image replacement: remove previous cloudinary image if exists, upload new one when provided as data URI
    if (image !== undefined && image !== post.image) {
      if (post.imagePublicId) {
        try { 
          await cloudinary.uploader.destroy(post.imagePublicId, { resource_type: 'image' }); 
        } catch (e) { 
          console.warn('Cloudinary delete failed:', e && e.message); 
        }
        post.imagePublicId = undefined;
        post.image = undefined;
      }

      if (typeof image === 'string' && image.trim()) {
        if (image.startsWith('data:image/')) {
          if (!cloudinaryConfigured) return res.status(500).json({ success: false, error: 'Image upload not configured on server' });
          try {
            const uploadResult = await cloudinary.uploader.upload(image, { folder: 'Duman', resource_type: 'image', quality: 'auto:good', fetch_format: 'auto', timeout: 30000 });
            post.image = uploadResult.secure_url;
            post.imagePublicId = uploadResult.public_id;
          } catch (uploadErr) {
            console.error('Cloudinary upload failed during update:', uploadErr);
            return res.status(500).json({ success: false, error: 'Image upload failed' });
          }
        } else if (image.startsWith('http') || image.startsWith('/')) {
          post.image = image;
          post.imagePublicId = undefined;
        }
      }
    }

    const saved = await post.save();
    await saved.populate('author', 'username email avatar');

    return res.status(200).json({ 
      success: true, 
      message: 'Post updated successfully', 
      data: { 
        id: saved._id, 
        title: saved.title, 
        content: saved.content, 
        image: saved.image, 
        imagePublicId: saved.imagePublicId, 
        author: saved.author, 
        interests: saved.interests || [], 
        tags: saved.interests || [], 
        createdAt: saved.createdAt 
      } 
    });
  } catch (error) {
    // If Mongoose validation error, return 400 with details
    if (error && error.name === 'ValidationError') {
      const errors = Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = error.errors[key].message || error.errors[key].kind || 'Validation error';
        return acc;
      }, {});
      console.error('Update post validation failed:', errors);
      return res.status(400).json({ success: false, error: 'Validation failed', errors });
    }

    console.error('Update post error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ success: false, error: 'Invalid or missing postId' });

    let post = req.post;
    if (!post) {
      post = await postModel.findById(postId);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
      if (!req.user || post.author.toString() !== req.user.userId.toString()) return res.status(403).json({ success: false, error: 'You are not authorized to delete this post' });
    }

    if (post.imagePublicId) {
      try { 
        await cloudinary.uploader.destroy(post.imagePublicId, { resource_type: 'image' }); 
      } catch (e) { 
        console.warn('Cloudinary delete failed:', e && e.message); 
      }
    }

    await postModel.findByIdAndDelete(post._id);
    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await postModel.find().sort({ createdAt: -1 }).populate('author', 'username email avatar').skip(skip).limit(limit);
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
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const paramUserId = req.params?.userId;
    const authUserId = req.user?.userId;
    const userId = paramUserId || authUserId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, error: 'Invalid or missing userId' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      postModel.find({ author: userId }).sort({ createdAt: -1 }).populate('author', 'username email avatar').skip(skip).limit(limit).lean(),
      postModel.countDocuments({ author: userId })
    ]);

    const optimizedPosts = posts.map(post => ({ 
      _id: post._id, 
      title: post.title, 
      content: post.content, 
      image: post.image, 
      imagePublicId: post.imagePublicId, 
      interests: post.interests || [], 
      tags: post.interests || [], 
      createdAt: post.createdAt, 
      author: { 
        id: post.author?._id || post.author?.id, 
        username: post.author?.username, 
        email: post.author?.email, 
        avatar: post.author?.avatar 
      } 
    }));

    return res.status(200).json({ 
      success: true, 
      data: optimizedPosts, 
      pagination: { 
        current: page, 
        pages: Math.ceil(total / limit), 
        total 
      } 
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ success: false, error: 'Invalid or missing postId' });

    const post = await postModel.findById(postId).populate('author', 'username email avatar');
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('Get post by id error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing postId' });
    }

    const userId = req.userId || req.user?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    // Find the post first
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Create comment object
    const commentObj = {
      _id: new mongoose.Types.ObjectId(),
      author: new mongoose.Types.ObjectId(userId),
      content: String(content).trim(),
      createdAt: new Date()
    };

    // Add comment to post
    post.comments.push(commentObj);
    await post.save();

    // Populate the author info for the newly created comment
    await post.populate('comments.author', 'username avatar');

    // Find the specific comment we just added
    const createdComment = post.comments.id(commentObj._id);
    
    if (!createdComment) {
      return res.status(500).json({ success: false, error: 'Failed to create comment' });
    }

    // Format the response properly
    const responseComment = {
      id: createdComment._id,
      author: {
        id: createdComment.author._id,
        username: createdComment.author.username,
        avatar: createdComment.author.avatar
      },
      content: createdComment.content,
      createdAt: createdComment.createdAt
    };

    return res.status(201).json({ 
      success: true, 
      data: responseComment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
export const getComments = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing postId' });
    }

    const post = await postModel.findById(postId).populate('comments.author', 'username avatar');
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Normalize comments shape for frontend - sort by newest first
    const comments = (post.comments || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(c => ({
        id: c._id,
        author: c.author ? { 
          id: c.author._id, 
          username: c.author.username, 
          avatar: c.author.avatar 
        } : { 
          id: undefined, 
          username: 'Unknown',
          avatar: undefined
        },
        content: c.content,
        createdAt: c.createdAt
      }));

    return res.status(200).json({ 
      success: true, 
      data: comments 
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};