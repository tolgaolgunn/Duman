import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['like', 'comment', 'follow', 'mention', 'system', 'custom', 'invite', 'join_request', 'error'] 
  },
  message: {
    type: String,
    required: true,
  },
  link: { 
    type: String,
    default: '#',
  },
  // Flexible metadata (postId, commentId, url, title, body, etc.)
  meta: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  isRead: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
}, {
  versionKey: false
});

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model('Notification', NotificationSchema);