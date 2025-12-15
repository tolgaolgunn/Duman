import Stripe from 'stripe';
import User from '../../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Checkout Session Oluşturma
export const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, userId } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ success: false, error: 'Price ID and User ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/cancel`,
      customer_email: user.email,
      metadata: {
        userId: userId,
      },
    });

    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify Session (Manual check for success page)
export const verifySession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, { isPremium: true });
        return res.status(200).json({ success: true, message: 'User upgraded to premium' });
      }
    }

    res.status(200).json({ success: false, message: 'Payment not completed or User ID missing' });

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Webhook İşleme
export const handleWebhook = async (req, res) => {
  // ... (existing implementation) ...
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    // For manual handling dev environments without webhook, don't break everything
    // But return 400 strictly for security if using real keys
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      
      if (userId) {
        console.log(`Payment successful for user ${userId}. Upgrading to premium...`);
        try {
          await User.findByIdAndUpdate(userId, { isPremium: true });
          console.log(`User ${userId} upgraded to premium.`);
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }
      }
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log('Subscription deleted:', subscription.id);
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      console.log('Payment failed for invoice:', invoice.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};
