// posts.js - Backend routes
import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostById,
  updatePost,
  deletePost,
  getUserPosts,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleLike,
  getLikedPosts,
  getLikedPostsForUser
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

// Kullanıcının kendi post'larını getir - MUST COME BEFORE /:postId
router.get('/my-posts', authenticateToken, getUserPosts);

// Liked posts for authenticated user
router.get('/liked', authenticateToken, getLikedPosts);

// Public: liked posts of a specific user (by id)
router.get('/user/:userId/liked', getLikedPostsForUser);

// Belirli bir kullanıcının post'larını getir (opsiyonel auth)
// BU ROUTE /:postId'DEN ÖNCE GELMELİ
router.get('/user/:userId', optionalAuthenticate, getUserPosts);

// Tek bir postu getir - This should come AFTER specific routes
router.get('/:postId', optionalAuthenticate, getPostById);

// Post güncelleme - sadece post sahibi
router.put('/:postId', authenticateToken, requirePostOwner, updatePost);

// Post silme - sadece post sahibi
router.delete('/:postId', authenticateToken, requirePostOwner, deletePost);

// Yorum işlemleri
router.post('/:postId/comments', authenticateToken, createComment);
router.get('/:postId/comments', optionalAuthenticate, getComments);

// Yorum güncelleme (PUT ve POST destekli)
router.put('/:postId/comments/:commentId', authenticateToken, updateComment);
router.post('/:postId/comments/:commentId', authenticateToken, updateComment);

// Yorum silme
router.delete('/:postId/comments/:commentId', authenticateToken, deleteComment);

// Toggle like
router.post('/:postId/like', authenticateToken, toggleLike);

export default router;