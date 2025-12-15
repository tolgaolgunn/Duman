import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as notificationController from '../Controller/Notification/notificationController.js';

const router = express.Router();

router.get('/', authenticateToken, notificationController.getNotifications);
router.patch('/:id/read', authenticateToken, notificationController.markRead);
router.post('/markAllRead', authenticateToken, notificationController.markAllRead);
router.post('/register-token', authenticateToken, notificationController.registerToken);
router.delete('/remove-token', authenticateToken, notificationController.removeToken);

export default router;
