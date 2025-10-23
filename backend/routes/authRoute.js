import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import { register } from "../Auth/registerController.js";
import { login } from "../Auth/loginController.js";
import { getProfile,updateProfile } from "../Auth/profileController.js";
import { uploadPhoto } from "../Auth/profileController.js";
import multer from 'multer';
import path from 'path';

// Use memory storage so we can stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
import {forgotPassword, verifyResetToken,resetPassword} from "../Auth/forgotPassword.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post('/upload-photo', upload.single('file'), uploadPhoto);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password", resetPassword);

export default router;
