import { format } from 'date-fns';
import { Clock, DollarSign, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  open: 'bg-blue-50 border-blue-200 text-blue-700',
  claimed: 'bg-green-50 border-green-200 text-green-700',
  completed: 'bg-gray-50 border-gray-200 text-gray-700',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
};

export default function ShiftCard({ shift, onClaim, onCheckIn, isCaregiver = false }) {
  const duration = shift.end_time && shift.start_time
    ? Math.round((new Date(`2000-01-01 ${shift.end_time}`) - new Date(`2000-01-01 ${shift.start_time}`)) / 60000 / 60 * 100) / 100
    : 0;

  const estimatedPay = duration * (shift.pay_rate || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 ${STATUS_COLORS[shift.status]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm">{shift.title}</p>
          <p className="text-xs opacity-75 mt-0.5">{format(new Date(`${shift.shift_date}T00:00`), 'MMM d, yyyy')}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${STATUS_COLORS[shift.status]}`}>
          {shift.status}
        </span>
      </div>

      {shift.description && (
        <p className="text-xs opacity-75 mb-3">{shift.description}</p>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{shift.start_time} – {shift.end_time} ({duration}h)</span>
        </div>
        {shift.pay_rate && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${shift.pay_rate}/hr (Est. ${estimatedPay.toFixed(2)})</span>
          </div>
        )}
        {shift.caregiver_name && (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>{shift.caregiver_name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {isCaregiver && shift.status === 'open' && (
        <Button
          onClick={() => onClaim?.(shift)}
          className="w-full text-xs h-8 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          Claim Shift
        </Button>
      )}

      {isCaregiver && shift.status === 'claimed' && shift.caregiver_email === '' && (
        <Button
          onClick={() => onCheckIn?.(shift)}
          className="w-full text-xs h-8 rounded-lg gap-1"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Check In
        </Button>
      )}
    </motion.div>
  );
}