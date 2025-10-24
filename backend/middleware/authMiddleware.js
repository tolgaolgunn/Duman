import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// JWT secret kontrolü
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Authentication Middleware
 * Token'ı doğrular ve req.user'a kullanıcı bilgilerini ekler
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // 1. Authorization header kontrolü
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid format'
      });
    }

    // 2. Token extraction
    let token = authHeader.split(' ')[1];

    // Trim and remove accidental surrounding quotes
    if (typeof token === 'string') {
      token = token.trim();
      if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1);
      }
    }

    if (!token || token.length < 10) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // 3. Token verification
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Log a short debugging hint (do not log the full token)
      console.error('JWT verification error:', error.message, 'token length:', token ? token.length : 0);

      // Token süresi dolmuşsa
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }

      // Geçersiz token
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // 4. Payload validation
    // Support both { userId } and legacy { id } token payloads
    const resolvedUserId = payload.userId || payload.id;
    if (!resolvedUserId || !mongoose.Types.ObjectId.isValid(resolvedUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user identification'
      });
    }

    // 5. Attach normalized user info to request
    req.user = {
      userId: resolvedUserId,
      email: payload.email || null,
      username: payload.username || null
    };
    // also expose userId directly for backwards compatibility
    req.userId = resolvedUserId;

    // 6. Sonraki middleware'a geç
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Token varsa doğrular, yoksa da devam eder (opsiyonel işlemler için)
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token.length < 10) {
      req.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // Support both payload.userId and payload.id
      const resolvedUserId = payload.userId || payload.id;
      if (resolvedUserId && mongoose.Types.ObjectId.isValid(resolvedUserId)) {
        req.user = {
          userId: resolvedUserId,
          email: payload.email || null,
          username: payload.username || null
        };
        req.userId = resolvedUserId;
      } else {
        req.user = null;
      }
    } catch (error) {
      // Token geçersizse kullanıcıyı null yap ama hata döndürme
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Owner kontrolü
 * Kullanıcının kaynağın sahibi olmasını gerektirir
 */
export const requireOwner = (resourceOwnerIdPath = 'params.userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Resource owner ID'sini dinamik olarak al
    const paths = resourceOwnerIdPath.split('.');
    let resourceOwnerId = req;
    
    for (const path of paths) {
      resourceOwnerId = resourceOwnerId[path];
      if (resourceOwnerId === undefined) break;
    }

    // Owner kontrolü
    if (resourceOwnerId && resourceOwnerId.toString() === req.user.userId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own resources.'
    });
  };
};

/**
 * Post sahibi kontrolü
 * Özel olarak post'lar için - author ID'sini kontrol eder
 */
export const requirePostOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const postId = req.params.postId;
    
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid post ID'
      });
    }

    // Post'u veritabanından çek ve author'ını kontrol et
    const Post = await import('../models/postModel.js');
    const post = await Post.default.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Kullanıcı post'un sahibi mi kontrol et
    if (post.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify your own posts.'
      });
    }

    // Post'u request'e ekle ki controller'da tekrar çekmeye gerek kalmasın
    req.post = post;
    next();

  } catch (error) {
    console.error('Post owner check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};