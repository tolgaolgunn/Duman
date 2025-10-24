import express from 'express';
import { 
  createPost, 
  getPosts, 
//   updatePost, 
//   deletePost,
//   getUserPosts 
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

// Kullanıcının kendi post'larını getir
//router.get('/my-posts', authenticateToken, getUserPosts);

// Post güncelleme - sadece post sahibi
// router.put('/:postId', authenticateToken, requirePostOwner, updatePost);

// Post silme - sadece post sahibi
// router.delete('/:postId', authenticateToken, requirePostOwner, deletePost);

export default router;