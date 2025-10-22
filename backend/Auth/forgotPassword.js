import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { resetMailService } from "../utils/resetMailService.js";
import User from "../models/userModel.js";
import PasswordReset from "../models/passwordReset.js"; 

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if(!email){
        return res.status(400).json({ error: "Email is required" });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(200).json({ message: "Password reset email sent" });
    }

    await PasswordReset.deleteMany({ email });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 saat

    await PasswordReset.create({
        email,
        token: resetToken,
        expiresAt: resetTokenExpiry,
    });

    resetMailService(email, resetToken)
  .catch(err => console.error("Error sending reset email:", err));;

    res.status(200).json({ message: "Password reset email sent" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyResetToken = async (req, res) => {
  const { token } = req.params;
  try {
    const passwordResetRecord = await PasswordReset.findOne({ 
      token,
      expiresAt: { $gt: Date.now() }
    });

    if (!passwordResetRecord) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    res.status(200).json({ 
      valid: true, 
      email: passwordResetRecord.email,
      message: "Token is valid" 
    });
  } catch (error) {
    console.error("Verify Token Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    try {
        if(!token || !newPassword || !confirmPassword){
            return res.status(400).json({ error: "All fields are required" });
        } 

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        
        if(newPassword !== confirmPassword){
            return res.status(400).json({ error: "Password does not match confirm password" });
        }
        
        const passwordResetRecord = await PasswordReset.findOne({ 
          token,
          expiresAt: { $gt: Date.now() } // Tek seferde kontrol
        });
        
        if (!passwordResetRecord) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const user = await User.findOne({ email: passwordResetRecord.email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
         
        await PasswordReset.deleteOne({ token });
        
        res.status(200).json({ message: "Password has been reset successfully" });
        
     } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ error: "Internal server error" });
     }
}