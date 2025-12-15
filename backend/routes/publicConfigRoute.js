import express from 'express';

const router = express.Router();

// Return only public Firebase config values (safe to expose)
router.get('/', (req, res) => {
  try {
    const cfg = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || null,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || null,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || null,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || null,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || null,
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || null
    };
    return res.json({ success: true, config: cfg });
  } catch (e) {
    console.error('Failed to return public config', e);
    return res.status(500).json({ success: false, error: 'Failed to return public config' });
  }
});

export default router;
