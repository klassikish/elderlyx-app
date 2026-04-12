import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { CreditCard, Plus, Trash2, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const _pk = typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'string' ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim() : '';
const stripePromise = _pk.startsWith('pk_') ? loadStripe(_pk) : null;

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a2e',
      '::placeholder': { color: '#94a3b8' },
      fontFamily: 'Inter, sans-serif',
    },
  },
};

function AddCardForm({ onCancel, onAdded }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const card = elements.getElement(CardElement);
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card,
      billing_details: { name: name || user?.full_name },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Save pm_id on user profile
    const existing = user?.payment_methods || [];
    const newPm = {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      is_default: existing.length === 0,
    };
    await base44.auth.updateMe({ payment_methods: [...existing, newPm] });
    toast.success('Card saved!');
    setLoading(false);
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <p className="font-semibold text-sm text-foreground">Add a new card</p>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Name on card</label>
        <Input
          placeholder={user?.full_name || 'Full name'}
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Card details</label>
        <div className="border border-input rounded-xl px-4 py-3.5 bg-background">
          <CardElement options={CARD_STYLE} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="w-3 h-3" /> Secured by Stripe · PCI DSS compliant
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1 rounded-xl" disabled={loading || !stripe}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Card'}
        </Button>
      </div>
    </form>
  );
}

const BRAND_ICONS = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
};

export default function PaymentMethods() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [removing, setRemoving] = useState(null);

  const methods = user?.payment_methods || [];

  const handleRemove = async (pmId) => {
    setRemoving(pmId);
    const updated = methods.filter(m => m.id !== pmId);
    // If removed was default, make the first one default
    if (updated.length > 0 && !updated.some(m => m.is_default)) {
      updated[0].is_default = true;
    }
    await base44.auth.updateMe({ payment_methods: updated });
    toast.success('Card removed');
    setRemoving(null);
  };

  const handleSetDefault = async (pmId) => {
    const updated = methods.map(m => ({ ...m, is_default: m.id === pmId }));
    await base44.auth.updateMe({ payment_methods: updated });
    toast.success('Default card updated');
  };

  return (
    <div className="px-5 pt-4 pb-10 space-y-4">
      {/* Security banner */}
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
        <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 font-medium">Your payment info is encrypted and secured by Stripe</p>
      </div>

      {methods.length === 0 && !showAdd && (
        <div className="text-center py-10 space-y-3">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">No payment methods saved</p>
        </div>
      )}

      {/* Saved cards */}
      {methods.map(m => (
        <div key={m.id} className={`bg-card border rounded-2xl p-4 flex items-center gap-3 ${m.is_default ? 'border-primary' : 'border-border'}`}>
          <div className="w-12 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground capitalize">{m.brand} ···· {m.last4}</p>
            <p className="text-xs text-muted-foreground">Expires {m.exp_month}/{m.exp_year}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {m.is_default
              ? <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Default</span>
              : <button onClick={() => handleSetDefault(m.id)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Set default</button>
            }
            <button
              aria-label="Remove card"
              onClick={() => handleRemove(m.id)}
              disabled={removing === m.id}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              {removing === m.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ))}

      {showAdd ? (
        <Elements stripe={stripePromise}>
          <AddCardForm onCancel={() => setShowAdd(false)} onAdded={() => setShowAdd(false)} />
        </Elements>
      ) : (
        <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Payment Method
        </Button>
      )}
    </div>
  );
}