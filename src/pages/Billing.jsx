import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, FileText, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import InvoiceList from '@/components/billing/InvoiceList';
import PaymentMethods from '@/components/billing/PaymentMethods';
import Plans from '@/pages/Plans';

const TABS = [
  { id: 'plan', label: 'Plan', icon: Crown },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'payment', label: 'Payment', icon: CreditCard },
];

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('plan');
  const plan = user?.subscription_plan || 'basic';

  const planColors = {
    basic: 'bg-secondary text-secondary-foreground',
    family: 'bg-primary/10 text-primary',
    premium: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">Billing & Subscription</h1>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full capitalize ${planColors[plan]}`}>
          {plan}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex px-5 pt-4 gap-2 mb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {tab === 'plan' && <Plans embedded />}
        {tab === 'invoices' && <InvoiceList />}
        {tab === 'payment' && <PaymentMethods />}
      </motion.div>
    </div>
  );
}