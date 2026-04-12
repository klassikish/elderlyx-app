import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import CaregiverJournalForm from '@/components/CaregiverJournalForm';
import CaregiverExpenseForm from '@/components/CaregiverExpenseForm';

export default function CompletedBookings({ bookings }) {
  const [journalBookingId, setJournalBookingId] = useState(null);
  const [expenseBookingId, setExpenseBookingId] = useState(null);

  if (bookings.length === 0) return null;

  return (
    <div className="px-5 mt-5">
      <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500" /> Recent Completed
      </h2>
      <div className="space-y-2">
        {bookings.slice(0, 3).map(b => (
          <div key={b.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm capitalize">{b.service_type}</p>
                <p className="text-xs text-muted-foreground">{b.senior_name}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setJournalBookingId(journalBookingId === b.id ? null : b.id); setExpenseBookingId(null); }}
                  className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-xl"
                >
                  📓 Journal
                </button>
                <button
                  onClick={() => { setExpenseBookingId(expenseBookingId === b.id ? null : b.id); setJournalBookingId(null); }}
                  className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-xl"
                >
                  🧾 Expense
                </button>
              </div>
            </div>
            {journalBookingId === b.id && (
              <CaregiverJournalForm booking={b} onDone={() => setJournalBookingId(null)} />
            )}
            {expenseBookingId === b.id && (
              <CaregiverExpenseForm booking={b} onDone={() => setExpenseBookingId(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}