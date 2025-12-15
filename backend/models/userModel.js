import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    index:true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index:true
  },
  password: {
    type: String,
    required: true
  },
  interests: {
    type: [String],
    default: []
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  }
  ,
  avatarPublicId: {
    type: String,
    default: ''
  },
  coverPublicId: {
    type: String,
    default: ''
  }
  ,
  // FCM device tokens for push notifications (mobile/offline)
  deviceTokens: {
    type: [String],
    default: []
  },
  // Optional per-user notification preferences
  notificationPreferences: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

userSchema.set('strict', false);
export default mongoose.model('User', userSchema);