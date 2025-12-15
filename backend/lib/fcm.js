import admin from 'firebase-admin';

let initialized = false;

function initFCM() {
  if (initialized) return admin;
  const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      admin.initializeApp({ credential: admin.credential.cert(parsed) });
      initialized = true;
      return admin;
    } catch (e) {
      console.error('Invalid FCM_SERVICE_ACCOUNT_JSON', e);
      throw e;
    }
  }

  if (serviceAccountPath) {
    admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
    initialized = true;
    return admin;
  }

  // Fallback to default credentials (GCP environment)
  admin.initializeApp();
  initialized = true;
  return admin;
}

export async function sendPushToTokens(tokens = [], payload = {}) {
  if (!tokens || tokens.length === 0) return { success: 0, failure: 0, skipped: 0 };
  const adminInstance = initFCM();

  const message = {
    notification: {
      title: payload.title || '',
      body: payload.body || ''
    },
    data: payload.data || {},
    tokens,
    android: {
      priority: 'high',
      notification: { channelId: 'default' }
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          alert: { title: payload.title || '', body: payload.body || '' },
          sound: 'default',
          'content-available': 1
        }
      }
    }
  };

  try {
    const resp = await adminInstance.messaging().sendMulticast(message);
    return { success: resp.successCount, failure: resp.failureCount, responses: resp.responses };
  } catch (err) {
    console.error('FCM send error', err);
    throw err;
  }
}

export default { initFCM, sendPushToTokens };
