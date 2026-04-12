import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminPayrollDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [exportLoading, setExportLoading] = useState(false);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-payroll', month],
    queryFn: async () => {
      const all = await base44.entities.Booking.filter({ status: 'completed' }, '-scheduled_date', 500);
      return all.filter(b => {
        const d = new Date(b.scheduled_date);
        return d >= monthStart && d <= monthEnd;
      });
    },
  });

  // Only admins can access
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied</p>
          <Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button>
        </div>
      </div>
    );
  }

  // Group by caregiver and calculate totals
  const payrollSummary = bookings.reduce((acc, b) => {
    if (!b.caregiver_id) return acc;
    const key = b.caregiver_id;
    if (!acc[key]) {
      acc[key] = {
        caregiver_id: b.caregiver_id,
        caregiver_name: b.caregiver_name,
        caregiver_email: b.created_by,
        bookings: [],
        basePay: 0,
        waitCharges: 0,
        totalPay: 0,
      };
    }
    acc[key].bookings.push(b);
    acc[key].basePay += (b.price || 0) - (b.wait_charge || 0);
    acc[key].waitCharges += b.wait_charge || 0;
    acc[key].totalPay = acc[key].basePay + acc[key].waitCharges;
    return acc;
  }, {});

  const caregivers = Object.values(payrollSummary).map(c => ({
    ...c,
    bonus: calcBonus(c.bookings.length),
  }));
  const totalPayroll = caregivers.reduce((sum, c) => sum + c.totalPay + c.bonus, 0);
  const totalBonus = caregivers.reduce((sum, c) => sum + c.bonus, 0);
  const totalBookings = bookings.length;

  // Calculate tiered bonus
  const calcBonus = (taskCount) => {
    if (taskCount >= 30) return 180;
    if (taskCount >= 20) return 100;
    if (taskCount >= 10) return 40;
    return 0;
  };

  const handleExportCSV = () => {
    setExportLoading(true);
    const headers = ['Caregiver', 'Email', 'Completed Bookings', 'Base Pay', 'Wait Charges', 'Bonus', 'Total Pay'];
    const rows = caregivers.map(c => {
      const bonus = calcBonus(c.bookings.length);
      return [
        c.caregiver_name,
        c.caregiver_email,
        c.bookings.length,
        c.basePay.toFixed(2),
        c.waitCharges.toFixed(2),
        bonus.toFixed(2),
        (c.totalPay + bonus).toFixed(2),
      ];
    });

    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payroll_${format(month, 'MMM_yyyy')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLoading(false);
    toast.success('CSV exported');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground flex-1">Payroll Dashboard</h1>
      </div>

      <div className="px-5 pt-5 pb-10">
        {/* Month selector */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
            className="px-3 py-2 rounded-xl bg-secondary text-sm font-medium"
          >
            ← Prev
          </button>
          <input
            type="month"
            value={format(month, 'yyyy-MM')}
            onChange={e => setMonth(new Date(e.target.value + '-01'))}
            className="px-3 py-2 rounded-xl border border-input bg-transparent text-sm"
          />
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
            className="px-3 py-2 rounded-xl bg-secondary text-sm font-medium"
          >
            Next →
          </button>
          <Button
            size="sm"
            className="ml-auto gap-1"
            onClick={handleExportCSV}
            disabled={exportLoading || caregivers.length === 0}
          >
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Payroll</p>
            <p className="text-2xl font-black text-primary">${totalPayroll.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{caregivers.length} caregivers</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-xs text-muted-foreground font-semibold mb-1">Completed Bookings</p>
            <p className="text-2xl font-black text-emerald-600">{totalBookings}</p>
            <p className="text-[10px] text-muted-foreground mt-1">this month</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Bonus</p>
            <p className="text-2xl font-black text-green-600">${totalBonus.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">tiered incentive</p>
          </motion.div>
        </div>

        {/* Caregiver table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : caregivers.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No completed bookings this month</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Caregiver</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                    <th className="text-center px-4 py-3 font-semibold text-foreground">Jobs</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">Base Pay</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">Wait Fees</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">Bonus</th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {caregivers
                    .sort((a, b) => b.totalPay - a.totalPay)
                    .map((c, i) => (
                      <motion.tr
                        key={c.caregiver_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{c.caregiver_name}</td>
                         <td className="px-4 py-3 text-xs text-muted-foreground">{c.caregiver_email}</td>
                         <td className="px-4 py-3 text-center font-semibold text-foreground">{c.bookings.length}</td>
                         <td className="px-4 py-3 text-right font-semibold text-foreground">${c.basePay.toFixed(2)}</td>
                         <td className="px-4 py-3 text-right text-orange-600 font-semibold">${c.waitCharges.toFixed(2)}</td>
                         <td className="px-4 py-3 text-right text-green-600 font-bold">${c.bonus.toFixed(2)}</td>
                         <td className="px-4 py-3 text-right font-black text-primary">${(c.totalPay + c.bonus).toFixed(2)}</td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="bg-muted px-4 py-3 border-t border-border">
              <div className="flex justify-between font-bold text-foreground">
                <span>TOTAL PAYROLL</span>
                <span>${totalPayroll.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Base: ${caregivers.reduce((s, c) => s + c.basePay + c.waitCharges, 0).toFixed(2)} + Bonus: ${totalBonus.toFixed(2)}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Payroll period: {format(monthStart, 'MMM d, yyyy')} – {format(monthEnd, 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  );
}