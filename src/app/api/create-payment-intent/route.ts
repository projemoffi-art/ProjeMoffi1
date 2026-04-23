import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Standard Stripe Test Secret Key (Placeholder - User should replace with real test key in .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51O7Lq8L0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k0k', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'usd', items } = await req.json();

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        item_count: items?.length || 0,
        platform: 'Moffi Ecosystem'
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
