
import express from 'express';
import * as chatController from '../Controller/Chat/chatController.js';

import { authenticateToken } from '../middleware/authMiddleware.js';
import { chatUpload } from '../middleware/uploadMiddleware.js';
const router = express.Router();

// helper to return a handler or a 501 stub
const handlerOrStub = (fn) => {
  if (typeof fn === 'function') return fn;
  return (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
};

// Simple logger for chat route requests to help debug missing routes
router.use((req, res, next) => {
  try {
    console.log(`[chatRoute] ${req.method} ${req.originalUrl}`);
  } catch (e) { /* ignore logging errors */ }
  next();
});

// Tüm route'lar auth middleware kullanacak
router.use(authenticateToken);

// Oda CRUD işlemleri
router.post('/rooms', handlerOrStub(chatController.createRoom));
router.get('/rooms', handlerOrStub(chatController.getRooms || chatController.getAllRooms));
router.get('/rooms/user', handlerOrStub(chatController.getUserRooms || chatController.getRooms));
router.get('/rooms/:roomId', handlerOrStub(chatController.getRoomById || chatController.getRoomDetails));
router.put('/rooms/:roomId', handlerOrStub(chatController.updateRoom));
router.delete('/rooms/:roomId', handlerOrStub(chatController.deleteRoom));
router.get('/rooms/:roomId/members', handlerOrStub(chatController.getRoomMembers));

// Davet gönderme
router.post('/rooms/:roomId/invite', handlerOrStub(chatController.inviteRoom));
router.get('/rooms/:roomId/messages', handlerOrStub(chatController.getChatMessages));
router.get('/rooms/:roomId/summary', handlerOrStub(chatController.getChatSummary));
router.post('/rooms/:roomId/leave', handlerOrStub(chatController.leaveRoom));
router.post('/rooms/:roomId/join', handlerOrStub(chatController.joinRoom));
router.get('/rooms/:roomId/join-requests', handlerOrStub(chatController.getJoinRequests));
router.post('/rooms/:roomId/join-requests/:requestIndex/respond', handlerOrStub(chatController.respondJoinRequest));
router.post('/rooms/:roomId/messages', handlerOrStub(chatController.sendMessage));
router.delete('/messages/:messageId', handlerOrStub(chatController.deleteMessage));
router.put('/messages/:messageId', handlerOrStub(chatController.editMessage));
router.get('/messages/list', handlerOrStub(chatController.getChatList));

// Dosya yükleme
router.post('/upload', chatUpload.single('file'), handlerOrStub(chatController.uploadFile));

export default router;