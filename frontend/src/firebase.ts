// Firebase initialization and helpers for FCM token registration
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken, onMessage, MessagePayload } from 'firebase/messaging';

// Read Firebase config from Vite environment variables (VITE_*)
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: any = null;
let messaging: any = null;

export function initFirebase() {
  if (app) return { app, messaging };
  app = initializeApp(firebaseConfig);
  try {
    messaging = getMessaging(app);
  } catch (e) {
    // getMessaging may fail in non-browser envs
    messaging = null;
  }
  return { app, messaging };
}

/**
 * Request notification permission and get FCM token.
 * @param {string} vapidKey optional public VAPID key for web push
 */
export async function requestPermissionAndGetToken(vapidKey?: string) {
  initFirebase();
  if (!messaging) throw new Error('Firebase messaging not initialized or unsupported in this environment');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission not granted');

  // Prefer explicit argument, then environment variable `VITE_FIREBASE_VAPID_KEY`.
  const envVapid = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY as string | undefined;
  const usedVapid = vapidKey || envVapid || undefined;

  const currentToken = await getToken(messaging, { vapidKey: usedVapid });
  if (!currentToken) throw new Error('Failed to get FCM token');
  return currentToken;
}

export async function removeToken(clientToken?: string) {
  initFirebase();
  if (!messaging) return false;
  try {
    if (clientToken) {
      await deleteToken(messaging);
      return true;
    }
  } catch (e) {
    console.warn('deleteToken failed', e);
  }
  return false;
}

export function onForegroundMessage(handler: (payload: MessagePayload) => void) {
  initFirebase();
  if (!messaging) return () => {};
  return onMessage(messaging, handler as any);
}

/**
 * Register token with backend API endpoint. Accepts an auth token (Bearer) or falls back to localStorage token.
 */
export async function registerTokenWithServer(fcmToken: string, authToken?: string) {
  if (!fcmToken) throw new Error('Missing fcmToken');
  const token = authToken || localStorage.getItem('token') || localStorage.getItem('authToken');
  const res = await fetch('/api/notifications/register-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ token: fcmToken })
  });
  return res.json();
}

export async function unregisterTokenWithServer(fcmToken: string, authToken?: string) {
  if (!fcmToken) throw new Error('Missing fcmToken');
  const token = authToken || localStorage.getItem('token') || localStorage.getItem('authToken');
  const res = await fetch('/api/notifications/remove-token', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ token: fcmToken })
  });
  return res.json();
}

export default {
  initFirebase,
  requestPermissionAndGetToken,
  registerTokenWithServer,
  unregisterTokenWithServer,
  onForegroundMessage,
};
