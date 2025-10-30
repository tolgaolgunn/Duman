// posts.js - Backend routes
import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById,
  updatePost,
  deletePost,
  getUserPosts 
} from '../Controller/postController.js';
import { 
  authenticateToken, 
  optionalAuthenticate, 
  requirePostOwner 
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Tüm kullanıcılar görebilir (opsiyonel auth)
router.get('/', optionalAuthenticate, getPosts);

// Sadece authenticated kullanıcılar post oluşturabilir
router.post('/', authenticateToken, createPost);

// Belirli bir kullanıcının post'larını getir (opsiyonel auth)
router.get('/user/:userId', optionalAuthenticate, getUserPosts);

// Kullanıcının kendi post'larını getir - MUST COME BEFORE /:postId
router.get('/my-posts', authenticateToken, getUserPosts);

// Tek bir postu getir - This should come AFTER specific routes
router.get('/:postId', optionalAuthenticate, getPostById);

// Post güncelleme - sadece post sahibi
router.put('/:postId', authenticateToken, requirePostOwner, updatePost);

// Post silme - sadece post sahibi
router.delete('/:postId', authenticateToken, requirePostOwner, deletePost);

export default router;