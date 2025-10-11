'use client';

import { useState } from 'react';
//import { loadStripe, Stripe } from '@stripe/stripe-js';
import { handleCheckoutProcess } from '@/helpers/checkout';

interface CheckoutButtonProps {
  priceId: string;
  disabled?: boolean;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ priceId, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    const email = process.env.NEXT_PUBLIC_CHECKOUT_EMAIL ?? 'demo@example.com';
    await handleCheckoutProcess(
      priceId,
      process.env.NEXT_PUBLIC_CHECKOUT_USER_ID ?? 'demo-user',
      email,
      setLoading,
      setError
    );
  };

  return (
    <div>
      <button 
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
        onClick={handleCheckout}
        disabled={loading || disabled}
      >
        {loading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default CheckoutButton;
