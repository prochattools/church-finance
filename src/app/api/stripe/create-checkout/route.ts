import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import config from "@/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { priceId, email, userId } = await req.json() as { priceId?: string; email?: string; userId?: string };

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const currentProduct = config.stripe.products.find((prod) => prod.priceId === priceId)

    if(!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const isSub = currentProduct.type === 'subscription'
    const planType = priceId.includes('monthly') ? 'monthly' : 'yearly';

    const mode = isSub ? 'subscription' : 'payment'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${req.headers.get('origin')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: email,
      metadata: {
        priceId: priceId,
        productId: currentProduct.productId,
        userId: userId || 'anonymous',
        ...(isSub ? {planType} : {}),
      },
    });

    console.log('Created Stripe session:', {
      id: session.id,
      customer_email: session.customer_email,
      payment_status: session.payment_status,
      url: session.url
    });

    return NextResponse.json({ sessionId: session.id, checkoutUrl: session.url });
  } catch (err) {
    console.error('Stripe API error:', err);
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}