import Notification from '../../models/notificationModel.js';
import User from '../../models/userModel.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit || '50', 10);

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
}

export async function markRead(req, res) {
  try {
    const userId = req.user.userId;
    const notifId = req.params.id;

    const updated = await Notification.findOneAndUpdate(
      { _id: notifId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, error: 'Notification not found' });

    return res.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    return res.status(500).json({ success: false, error: 'Failed to mark notification read' });
  }
}

export async function markAllRead(req, res) {
  try {
    const userId = req.user.userId;
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    return res.status(500).json({ success: false, error: 'Failed to mark all notifications read' });
  }
}

export async function registerToken(req, res) {
  try {
    const userId = req.user.userId;
    const token = (req.body && (req.body.token || req.body.fcmToken)) || null;
    if (!token) return res.status(400).json({ success: false, error: 'Missing token in body' });

    // $addToSet avoids duplicates
    const updated = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { deviceTokens: token } },
      { new: true }
    ).select('deviceTokens');

    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });

    return res.json({ success: true, deviceTokens: updated.deviceTokens });
  } catch (error) {
    console.error('Failed to register token:', error);
    return res.status(500).json({ success: false, error: 'Failed to register token' });
  }
}

export async function removeToken(req, res) {
  try {
    const userId = req.user.userId;
    const token = (req.body && (req.body.token || req.body.fcmToken)) || null;
    if (!token) return res.status(400).json({ success: false, error: 'Missing token in body' });

    // Pull the token from deviceTokens
    const updated = await User.findByIdAndUpdate(
      userId,
      { $pull: { deviceTokens: token } },
      { new: true }
    ).select('deviceTokens');

    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });

    return res.json({ success: true, deviceTokens: updated.deviceTokens });
  } catch (error) {
    console.error('Failed to remove token:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove token' });
  }
}
