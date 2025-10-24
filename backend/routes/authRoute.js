import express from "express";
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';

// Middleware imports
import { authenticateToken } from "../middleware/authMiddleware.js";

// Controller imports
import { register } from "../Controller/Auth/registerController.js";
import { login } from "../Controller/Auth/loginController.js";
import { getProfile, updateProfile } from "../Controller/Auth/profileController.js";
import { uploadPhoto } from "../Controller/Auth/profileController.js";
import { 
  forgotPassword, 
  verifyResetToken, 
  resetPassword 
} from "../Controller/Auth/forgotPassword.js";

dotenv.config();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Sadece 1 dosya
  },
  fileFilter: (req, file, cb) => {
    // Dosya tipi kontrolü
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'));
    }
  }
});

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password", resetPassword);

// Protected routes (authentication required)
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.post('/upload-photo', authenticateToken, upload.single('file'), uploadPhoto);


// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file is allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

// 404 handler for auth routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Auth endpoint not found'
  });
});

export default router;