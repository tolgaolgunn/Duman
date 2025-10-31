
import express from 'express';
import * as chatController from '../Controller/Chat/chatController.js';

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// helper to return a handler or a 501 stub
const handlerOrStub = (fn) => {
  if (typeof fn === 'function') return fn;
  return (req, res) => res.status(501).json({ success: false, error: 'Not implemented' });
};

// Tüm route'lar auth middleware kullanacak
router.use(authenticateToken);

// Oda CRUD işlemleri
router.post('/rooms', handlerOrStub(chatController.createRoom));
router.get('/rooms', handlerOrStub(chatController.getRooms || chatController.getAllRooms));
router.get('/rooms/user', handlerOrStub(chatController.getUserRooms || chatController.getRooms));
router.get('/rooms/:roomId', handlerOrStub(chatController.getRoomById || chatController.getRoomDetails));
router.put('/rooms/:roomId', handlerOrStub(chatController.updateRoom));
router.delete('/rooms/:roomId', handlerOrStub(chatController.deleteRoom));

// Oda ayarları
router.put('/rooms/:roomId/settings', handlerOrStub(chatController.updateRoomSettings));

// Oda katılım işlemleri
router.post('/rooms/:roomId/join', handlerOrStub(chatController.joinRoom));
router.get('/rooms/:roomId/join-requests', handlerOrStub(chatController.getJoinRequests));
router.post('/rooms/:roomId/join-requests/:requestIndex/respond', handlerOrStub(chatController.respondJoinRequest));



router.post('/messages', handlerOrStub(chatController.sendMessage));
router.get('/rooms/:roomId/messages', handlerOrStub(chatController.getChatMessages));
router.get('/messages/list', handlerOrStub(chatController.getChatList));

export default router;