import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  interests: {
    type: [String],
    default: []
  }
}, { 
  timestamps: true 
});

// DÜZELTME: userModel yerine userSchema kullan
export default mongoose.model('User', userSchema);