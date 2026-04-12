import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ShiftCalendar from '@/components/shifts/ShiftCalendar.jsx';
import ShiftCard from '@/components/shifts/ShiftCard.jsx';
import ShiftCheckInForm from '@/components/shifts/ShiftCheckInForm.jsx';
import { toast } from 'sonner';

export default function CaregiverShifts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [checkInMode, setCheckInMode] = useState('checkin');

  const { data: shifts = [] } = useQuery({
    queryKey: ['available-shifts'],
    queryFn: () =>
      base44.entities.CareShift.filter({}, '-shift_date', 200),
  });

  const { data: myShifts = [] } = useQuery({
    queryKey: ['my-shifts', user?.email],
    queryFn: () =>
      base44.entities.CareShift.filter(
        { caregiver_email: user?.email },
        '-shift_date',
        100
      ),
    enabled: !!user?.email,
  });

  const claimMutation = useMutation({
    mutationFn: (shift) =>
      base44.entities.CareShift.update(shift.id, {
        status: 'claimed',
        caregiver_id: user?.id,
        caregiver_email: user?.email,
        caregiver_name: user?.full_name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['available-shifts'] });
      qc.invalidateQueries({ queryKey: ['my-shifts'] });
      toast.success('Shift claimed! You can now check in.');
    },
  });

  const openShifts = shifts.filter((s) => s.status === 'open');
  const selectedDateShifts = selectedDate
    ? openShifts.filter((s) => s.shift_date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">Shifts</h1>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <p className="text-[10px] font-bold text-blue-600 uppercase">Available</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{openShifts.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <p className="text-[10px] font-bold text-green-600 uppercase">My Shifts</p>
            <p className="text-2xl font-black text-green-700 mt-1">{myShifts.length}</p>
          </motion.div>
        </div>

        {/* Calendar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ShiftCalendar shifts={openShifts} onDayClick={setSelectedDate} />
        </motion.div>

        {/* Available Shifts */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-sm text-foreground">
              Available Shifts
            </h3>
            {selectedDateShifts.length > 0 ? (
              <div className="space-y-2">
                {selectedDateShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    onClaim={() => claimMutation.mutate(shift)}
                    isCaregiver
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No shifts available for this date</p>
            )}
          </motion.div>
        )}

        {/* My Shifts */}
        {myShifts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> My Claimed Shifts
            </h3>
            <div className="space-y-2">
              {myShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onCheckIn={() => {
                    setSelectedShift(shift);
                    setCheckInMode('checkin');
                  }}
                  isCaregiver
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Check-in Modal */}
      {selectedShift && (
        <ShiftCheckInForm
          shift={selectedShift}
          mode={checkInMode}
          onClose={() => setSelectedShift(null)}
        />
      )}
    </div>
  );
}