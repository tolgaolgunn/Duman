import express from "express";

import { register } from "../Auth/registerController.js";
import { login } from "../Auth/loginController.js";
import { getProfile } from "../Auth/profileController.js";
import {forgotPassword, verifyResetToken,resetPassword} from "../Auth/forgotPassword.js";

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/profile", getProfile);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password", resetPassword);

export default router;
