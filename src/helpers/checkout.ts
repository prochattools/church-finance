import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const handleCheckoutProcess = async (
    priceId: string,
    userId: string,
    email: string | null,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
  ) => {
    if (!email) {
      throw new Error('User email not available');
    }
  
    setLoading(true);
    setError(null);
  
    try {
      console.log('Initiating checkout for priceId:', priceId);
      console.log('User data:', { id: userId, email });
  
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          userId,
          email
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server responded with an error:', response.status, errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Received data from server:', data);
  
      if (!data.sessionId) {
        console.error('Server response:', data);
        throw new Error('No sessionId received from the server');
      }
  
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
  
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (stripeError) {
        console.error('Stripe redirectToCheckout error:', stripeError);
        throw stripeError;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };