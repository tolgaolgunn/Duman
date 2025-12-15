import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import * as socketManager from '../lib/socketManager.js';
import sendHybridNotification from '../lib/sendHybridNotification.js';

class NotificationService {
  /**
   * Persist and deliver a notification.
   * @param {string|ObjectId} senderId
   * @param {string|ObjectId} recipientId
   * @param {string} type
   * @param {object} meta
   */
  static async sendNotification(senderId, recipientId, type, meta = {}) {
    if (!recipientId) throw new Error('recipientId required');

    // Persist to DB — ensure `message` and `link` fields exist to satisfy schema
    const messageText = meta && (meta.message || meta.text) ? (meta.message || meta.text) : NotificationService._buildBody(type, meta);
    const link = meta && meta.link ? meta.link : (meta && meta.url ? meta.url : '#');
    const doc = await Notification.create({ sender: senderId, recipient: recipientId, type, message: messageText, link, meta, isRead: false });

    // Emit updated unread count to recipient's sockets so UI badges update immediately
    try {
      const unreadCount = await Notification.countDocuments({ recipient: recipientId, isRead: false });
      try {
        console.debug && console.debug('[NotificationService] emitting unreadCountUpdate', { recipientId, unreadCount });
        const ok = socketManager.emitToUser(recipientId, 'unreadCountUpdate', { count: unreadCount });
        if (!ok) console.warn('[NotificationService] emitToUser returned false for unreadCountUpdate', { recipientId });
      } catch (e) {
        console.warn('Failed to emit unreadCountUpdate', e);
      }
    } catch (e) {
      console.warn('Failed to compute unread count', e);
    }

    const payloadForClient = {
      id: doc._id,
      _id: doc._id,
      sender: senderId,
      recipient: recipientId,
      type,
      message: doc.message,
      link: doc.link,
      meta,
      isRead: doc.isRead,
      createdAt: doc.createdAt
    };

    // Always call the hybrid helper so delivery is centralized.
    try {
      const user = await User.findById(recipientId).select('deviceTokens notificationPreferences username').lean();
      const title = NotificationService._buildTitle(type, meta, user);
      const body = NotificationService._buildBody(type, meta, user);
      const dataPayload = { type, notificationId: String(doc._id), ...meta };

      console.debug('[NotificationService] delegating delivery to sendHybridNotification', { recipientId, title });
      const result = await sendHybridNotification(undefined, undefined, recipientId, title, body, dataPayload, payloadForClient);
      console.debug('[NotificationService] sendHybridNotification result', result);
    } catch (err) {
      console.error('Notification delivery error', err);
    }

    return doc;
  }

  static _buildTitle(type, meta = {}, user = {}) {
    switch (type) {
      case 'like': return meta.title || 'Yeni beğeni';
      case 'comment': return meta.title || 'Yeni yorum';
      case 'follow': return meta.title || 'Yeni takipçi';
      default: return meta.title || 'Bildirim';
    }
  }

  static _buildBody(type, meta = {}, user = {}) {
    switch (type) {
      case 'like': return meta.text || `${meta.username || 'Bir kullanıcı'} gönderinizi beğendi`;
      case 'comment': return meta.text || 'Gönderinize yorum yapıldı';
      case 'follow': return `${meta.username || 'Bir kullanıcı'} sizi takip etti`;
      default: return meta.body || '';
    }
  }
}

export default NotificationService;
