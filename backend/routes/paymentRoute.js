import express from 'express';
import { createCheckoutSession, handleWebhook, verifySession } from '../Controller/Payment/paymentController.js';

const router = express.Router();

// Checkout session route (JSON body parser kullanılacak)
router.post('/create-checkout-session', createCheckoutSession);
router.post('/verify-session', verifySession);

// Webhook route (Raw body gerekli, server.js'de ayarlanacak veya burada özel middleware kullanılacak)
// Not: Router seviyesinde raw body'ye erişmek zor olabilir eğer global middleware varsa.
// Bu yüzden webhook handler'ı server.js'de mount etmek daha güvenli olabilir, ancak burada tanımlayıp
// server.js'de raw body middleware'ini bu route'a özel uygulayacağız.
router.post('/webhook', handleWebhook);

export default router;
