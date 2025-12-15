import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import authRoute from './routes/authRoute.js';
import postRoute from './routes/postRoute.js';
import chatRoute from './routes/chatRoute.js'; // Yeni chat route'u
import notificationRoute from './routes/notificationRoute.js';
import publicConfigRoute from './routes/publicConfigRoute.js';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import * as socketManager from './lib/socketManager.js';
import paymentRoute from './routes/paymentRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, '../frontend/build');
const uploadsPath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/duman', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Bağlantı event'lerini dinle
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// CORS ayarları
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Webhook route must be defined BEFORE body parser to access raw body
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentRoute);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  if (!err) return next();
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ success: false, error: 'Payload too large. Reduce image size or increase server limit.' });
  }
  next(err);
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/chat', chatRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/public-firebase-config', publicConfigRoute);
app.use('/api/payment', paymentRoute); // For non-webhook routes like create-checkout-session

// Ensure uploads directory exists
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Created uploads directory at', uploadsPath);
  }
} catch (e) {
  console.error('Failed to create uploads directory', e);
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsPath));

// Serve frontend
app.use(express.static(frontendPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Socket.io entegrasyonu için HTTP server oluştur
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Provide io to socketManager so other services can emit without importing server directly
socketManager.setIo(io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (userData) => {
    socket.userId = userData.userId;
    // Join a personal room so server can emit directly to this user
    try {
      if (userData.userId) socket.join(String(userData.userId));
      // track in socket manager
      if (userData.userId) socketManager.addSocket(userData.userId, socket.id);
    } catch (e) {
      console.warn('Failed to join user room', e && e.message);
    }
    console.log(`User ${userData.userId} authenticated and joined room`);
  });

  // Odaya katılma
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId || socket.id} joined room ${roomId}`);
    
    // Diğer kullanıcılara katılım bildirimi
    socket.to(roomId).emit('userJoined', {
      userId: socket.userId,
      roomId: roomId,
      timestamp: new Date()
    });
  });

  // Odadan ayrılma
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.userId || socket.id} left room ${roomId}`);
    
    // Diğer kullanıcılara ayrılma bildirimi
    socket.to(roomId).emit('userLeft', {
      userId: socket.userId,
      roomId: roomId,
      timestamp: new Date()
    });
  });

  // Gerçek zamanlı mesaj
  socket.on('sendMessage', async (data) => {
    try {
      const { roomId, message, sender } = data;
      
      console.log(`Message from ${sender} in room ${roomId}: ${message}`);
      
      // Mesajı odaya yayınla
      io.to(roomId).emit('newMessage', {
        message: message,
        sender: sender,
        roomId: roomId,
        timestamp: new Date(),
        messageId: Date.now().toString() // Geçici ID
      });
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('messageError', {
        error: 'Mesaj gönderilemedi'
      });
    }
  });

  // Typing indicator
  socket.on('typingStart', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('userTyping', {
      userId: userId,
      roomId: roomId,
      isTyping: true
    });
  });

  socket.on('typingStop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('userTyping', {
      userId: userId,
      roomId: roomId,
      isTyping: false
    });
  });

  // Online durumu
  socket.on('userOnline', (userId) => {
    socket.broadcast.emit('userStatusChange', {
      userId: userId,
      isOnline: true
    });
  });

  // Bağlantı kesildiğinde
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Kullanıcı çevrimdışı durumunu bildir
    if (socket.userId) {
      // remove from socket manager
      socketManager.removeSocket(socket.userId, socket.id);
      socket.broadcast.emit('userStatusChange', {
        userId: socket.userId,
        isOnline: false
      });
    }
  });

  // Hata yönetimi
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Socket.io'yu global olarak kullanılabilir yap (isteğe bağlı)
app.set('io', io);

// Global error handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
export { io };