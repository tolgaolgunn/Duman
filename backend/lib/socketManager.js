let ioInstance = null;
const userSockets = new Map(); // userId -> Set(socketId)

export function setIo(io) {
  ioInstance = io;
}

export function addSocket(userId, socketId) {
  if (!userId) return;
  const key = String(userId);
  const s = userSockets.get(key) || new Set();
  s.add(socketId);
  userSockets.set(key, s);
}

export function removeSocket(userId, socketId) {
  if (!userId) return;
  const key = String(userId);
  const s = userSockets.get(key);
  if (!s) return;
  s.delete(socketId);
  if (s.size === 0) userSockets.delete(key);
  else userSockets.set(key, s);
}

export function getSockets(userId) {
  return Array.from(userSockets.get(String(userId)) || []);
}

export function isUserOnline(userId) {
  const s = userSockets.get(String(userId));
  return !!(s && s.size > 0);
}

export function emitToUser(userId, event, data) {
  if (!ioInstance) return false;
  try {
    // use room (server joins sockets to room = userId)
    // use room (server should join sockets to room = userId)
    // debug: log when server emits to user rooms
    try {
      console.debug && console.debug('[socketManager] emitToUser', { userId: String(userId), event, hasIo: !!ioInstance });
    } catch (e) {}
    ioInstance.to(String(userId)).emit(event, data);
    return true;
  } catch (e) {
    console.warn('emitToUser failed', e);
    return false;
  }
}

export function clearAll() {
  userSockets.clear();
}
