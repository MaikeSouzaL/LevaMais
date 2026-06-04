const Stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'C:/Users/Administrator/Desktop/Leva_Mais/backend/.env' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function test() {
  try {
    console.log('Testing Stripe PIX creation with key:', process.env.STRIPE_SECRET_KEY.substring(0, 15) + '...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1550, // R$ 15.50
      currency: 'brl',
      payment_method_types: ['pix'],
      payment_method_data: {
        type: 'pix',
      },
      confirm: true,
      return_url: 'https://example.com',
    });
    console.log('PIX PaymentIntent created successfully!');
    console.log('ID:', paymentIntent.id);
    console.log('Status:', paymentIntent.status);
    console.log('Next action:', JSON.stringify(paymentIntent.next_action, null, 2));
  } catch (err) {
    console.error('Error creating PIX PaymentIntent:', err.message);
  }
}

test();
