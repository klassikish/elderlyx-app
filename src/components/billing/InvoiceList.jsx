import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileDown, Receipt, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_STYLE = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  refunded: 'bg-red-100 text-red-700',
};

export default function InvoiceList() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['billing-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter(
      { family_email: user?.email, payment_status: 'paid' },
      '-scheduled_date', 50
    ),
    enabled: !!user?.email,
  });

  const handleDownload = async (month, year, label) => {
    setDownloading(label);
    const res = await base44.functions.invoke('generateInvoice', { month, year });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Elderlyx_Invoice_${label}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
    toast.success('Invoice downloaded!');
  };

  // Group bookings by month
  const months = {};
  bookings.forEach(b => {
    const d = new Date(b.scheduled_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) months[key] = { year: d.getFullYear(), month: d.getMonth() + 1, label: format(d, 'MMMM yyyy'), bookings: [] };
    months[key].bookings.push(b);
  });

  const monthList = Object.values(months).sort((a, b) => `${b.year}-${b.month}` > `${a.year}-${a.month}` ? 1 : -1);

  return (
    <div className="px-5 pt-4 pb-10 space-y-4">
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && monthList.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">No paid bookings yet</p>
        </div>
      )}

      {/* Individual bookings */}
      {bookings.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">All Transactions</p>
          {bookings.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground capitalize">{b.service_type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.senior_name} · {format(new Date(b.scheduled_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-foreground">${b.price || 0}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[b.payment_status] || STATUS_STYLE.pending}`}>
                  {b.payment_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly invoice downloads */}
      {monthList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Monthly Statements</p>
          {monthList.map(({ year, month, label, bookings: mBookings }) => {
            const total = mBookings.reduce((sum, b) => sum + (b.price || 0), 0);
            const key = label;
            return (
              <div key={key} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <FileDown className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{mBookings.length} booking{mBookings.length !== 1 ? 's' : ''} · ${total} total</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl flex-shrink-0"
                  disabled={downloading === key}
                  onClick={() => handleDownload(month, year, label)}
                >
                  {downloading === key
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><FileDown className="w-3.5 h-3.5 mr-1" /> PDF</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}