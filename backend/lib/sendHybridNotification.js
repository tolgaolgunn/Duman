import User from '../models/userModel.js';
import * as socketManager from './socketManager.js';
import fcm from './fcm.js';

/**
 * Send a notification either via socket (when online) or FCM multicast (when offline).
 * - If user is online: emit `notification:receive` to their sockets and do NOT send push.
 * - If offline: fetch `deviceTokens` and send push via admin.messaging().sendMulticast
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {string} title
 * @param {string} message
 * @param {Object} data - optional data payload (string values recommended)
 */
export const sendHybridNotification = async (io, onlineUsers, userId, title, message, data = {}, clientPayload = null) => {
  if (!userId) throw new Error('userId required');

  try {
    // Build client payload
    const payloadForClient = clientPayload || {
      title,
      body: message,
      data,
      sentAt: new Date().toISOString()
    };

    // Determine online sockets from provided `onlineUsers` (Map or plain object)
    let socketIds = [];
    if (onlineUsers) {
      try {
        const key = String(userId);
        if (typeof onlineUsers.get === 'function') {
          // Map-like
          const v = onlineUsers.get(key);
          if (v) socketIds = Array.isArray(v) ? v.slice() : [v];
        } else if (Object.prototype.hasOwnProperty.call(onlineUsers, String(userId))) {
          const v = onlineUsers[String(userId)];
          if (v) socketIds = Array.isArray(v) ? v.slice() : [v];
        }
      } catch (e) {
        socketIds = [];
      }
    }

    // If no `onlineUsers` or not found there, fall back to socketManager
    let online = socketIds.length > 0;
    if (!online) {
      online = socketManager.isUserOnline(userId);
      if (online) {
        // get sockets known to socketManager
        socketIds = socketManager.getSockets(userId);
      }
    }

    if (online) {
      console.debug('[sendHybridNotification] user appears online, socketIds=', socketIds);
      // Emit via provided `io` when available and socket ids known
      try {
        if (io && socketIds && socketIds.length > 0) {
          socketIds.forEach((sid) => {
            try {
              io.to(String(sid)).emit('notification', payloadForClient);
            } catch (err) {
              // ignore per-socket emit errors
            }
          });
        } else if (io) {
          // If no socket ids, emit to room named by userId (common pattern)
          io.to(String(userId)).emit('notification', payloadForClient);
        } else {
          // fallback to socketManager emit which uses server-side room join
          socketManager.emitToUser(userId, 'notification', payloadForClient);
        }

        console.debug('[sendHybridNotification] emitted notification to sockets for user', userId);
        return { deliveredVia: 'socket', success: true };
      } catch (e) {
        // If socket emission fails, continue to attempt push
        console.warn('socket emit failed, will attempt FCM fallback', e);
      }
    }

    // Offline: fetch device tokens and send multicast via FCM
    const user = await User.findById(userId).select('deviceTokens').lean();
    const tokens = (user && Array.isArray(user.deviceTokens)) ? user.deviceTokens.filter(Boolean) : [];

    if (!tokens || tokens.length === 0) {
      return { deliveredVia: 'none', success: false, reason: 'no_device_tokens' };
    }

    // Initialize admin and send multicast
    const admin = fcm.initFCM ? fcm.initFCM() : (fcm && fcm.default && fcm.default.initFCM ? fcm.default.initFCM() : null);

    const messageObj = {
      notification: {
        title: title || '',
        body: message || ''
      },
      data: Object.keys(data || {}).reduce((acc, k) => ({ ...acc, [k]: String(data[k]) }), {}),
      tokens,
      android: {
        priority: 'high',
        notification: { channelId: 'default' }
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: {
            alert: { title: title || '', body: message || '' },
            sound: 'default',
            'content-available': 1
          }
        }
      }
    };

    try {
      if (!admin) {
        throw new Error('FCM admin not initialized');
      }
      console.debug('[sendHybridNotification] sending FCM to tokens:', tokens.length);
      const resp = await admin.messaging().sendMulticast(messageObj);
      return { deliveredVia: 'fcm', success: true, successCount: resp.successCount, failureCount: resp.failureCount, responses: resp.responses };
    } catch (err) {
      console.error('sendHybridNotification FCM error', err);
      return { deliveredVia: 'fcm', success: false, error: err };
    }
  } catch (err) {
    console.error('sendHybridNotification error', err);
    return { deliveredVia: 'error', success: false, error: err };
  }
}

export default sendHybridNotification;
