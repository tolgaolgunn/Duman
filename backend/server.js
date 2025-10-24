import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import authRoute from './routes/authRoute.js';
import postRoute from './routes/postRoute.js';
import fs from 'fs';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, '../frontend/build');
const uploadsPath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


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


console.log('MongoDB connection temporarily disabled for development');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use((err, req, res, next) => {
  if (!err) return next();
  // raw-body sets err.type === 'entity.too.large' for oversized payloads
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ success: false, error: 'Payload too large. Reduce image size or increase server limit.' });
  }
  // pass to default error handler
  next(err);
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);

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

app.use(express.static(frontendPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend served from ${frontendPath}`);
});
