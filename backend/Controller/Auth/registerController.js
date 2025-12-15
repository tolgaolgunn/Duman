import User from '../../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
  const { username, email, password, confirmPassword, interests } = req.body;

  try {
    console.log('Register request body received:', req.body);

    if (password !== confirmPassword) {
      console.log(' Password mismatch');
      return res.status(400).json({ error: 'Password does not match confirm password' });
    }

    if (password.length < 6) {
      console.log(' Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!interests || !Array.isArray(interests) || interests.length < 1) {
      console.log(' Interests validation failed');
      return res.status(400).json({ error: 'At least one interest is required' });
    }


    // Manuel hash yapalım
    const hashedPassword = await bcrypt.hash(password, 10);
  

    // Yeni kullanıcı oluştur
    const newUser = new User({ 
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword, // Hash'lenmiş password
      interests: interests 
    });

    console.log(' User object created:', {
      username: newUser.username,
      email: newUser.email,
      interests: newUser.interests,
      passwordLength: newUser.password.length
    });

    console.log('Attempting to save user...');
    
    // Kullanıcıyı kaydet
    const savedUser = await newUser.save();
    
    console.log(' USER SAVED SUCCESSFULLY:', {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      interests: savedUser.interests,
      createdAt: savedUser.createdAt
    });

    // JWT token oluştur
    // JWT token oluştur
    const token = jwt.sign({ 
      id: savedUser._id,
      userId: savedUser._id,
      username: savedUser.username,
      avatar: savedUser.avatar
    }, process.env.JWT_SECRET, { expiresIn: '1d' });

    console.log('Token created, sending response');

    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        interests: savedUser.interests
      }
    });

  } catch (err) {
    console.error('🔴 [ERROR] Register process failed:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });

    let errorMsg = 'Registration failed';

    if (err.code === 11000) {
      errorMsg = 'Email already exists';
      console.log('Duplicate email error');
    }

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      errorMsg = errors.join(', ');
      console.log('Validation error:', errors);
    }

    res.status(400).json({ error: errorMsg });
  }
};