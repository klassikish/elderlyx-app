import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';

// Lazily initialize Stripe only when needed, never at module parse time
let _stripePromise = null;
function getStripePromise() {
  if (_stripePromise) return _stripePromise;
  const pk = typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'string'
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : '';
  if (pk.startsWith('pk_')) {
    _stripePromise = loadStripe(pk);
  }
  return _stripePromise;
}

// Inner form — must be inside <Elements>
function PayForm({ amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrorMsg('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message);
      onError?.(error.message);
      setLoading(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMsg('Payment did not complete. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <Button type="submit" disabled={!stripe || loading} className="w-full h-12 rounded-2xl font-bold">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing…</>
          : <><Lock className="w-4 h-4 mr-2" /> Pay ${(amount).toFixed(2)} Securely</>}
      </Button>

      <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="w-2.5 h-2.5" /> Secured by Stripe · SSL encrypted
      </p>
    </form>
  );
}

// Exported wrapper — pass clientSecret from createPaymentIntent backend function
export default function StripePaymentForm({ clientSecret, amount, onSuccess, onError }) {
  const stripePromise = getStripePromise();
  if (!clientSecret || !stripePromise) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
      Stripe is not configured. Please set <strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> in your environment.
    </div>
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <PayForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}