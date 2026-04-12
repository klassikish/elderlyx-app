import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ShiftCalendar from '@/components/shifts/ShiftCalendar.jsx';
import CreateShiftForm from '@/components/shifts/CreateShiftForm.jsx';
import ShiftCard from '@/components/shifts/ShiftCard.jsx';

export default function FamilyShifts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: groups = [] } = useQuery({
    queryKey: ['family-groups', user?.email],
    queryFn: () =>
      base44.entities.FamilyGroup.filter(
        { primary_owner_email: user?.email },
        '-created_date',
        10
      ),
    enabled: !!user?.email,
  });

  const selectedGroup = groups[0];

  const { data: shifts = [] } = useQuery({
    queryKey: ['care-shifts', selectedGroup?.id],
    queryFn: () =>
      base44.entities.CareShift.filter(
        { family_group_id: selectedGroup?.id },
        '-shift_date',
        200
      ),
    enabled: !!selectedGroup?.id,
  });

  const selectedDateShifts = selectedDate
    ? shifts.filter((s) => s.shift_date === selectedDate.toISOString().split('T')[0])
    : [];

  const openShifts = shifts.filter((s) => s.status === 'open').length;
  const claimedShifts = shifts.filter((s) => s.status === 'claimed').length;

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
        <h1 className="font-bold text-foreground">Manage Shifts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <p className="text-[10px] font-bold text-blue-600 uppercase">Open Shifts</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{openShifts}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <p className="text-[10px] font-bold text-green-600 uppercase">Claimed</p>
            <p className="text-2xl font-black text-green-700 mt-1">{claimedShifts}</p>
          </motion.div>
        </div>

        {/* Calendar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ShiftCalendar shifts={shifts} onDayClick={setSelectedDate} />
        </motion.div>

        {/* Selected Date Shifts */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-sm text-foreground">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            {selectedDateShifts.length > 0 ? (
              <div className="space-y-2">
                {selectedDateShifts.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No shifts scheduled for this date</p>
            )}
          </motion.div>
        )}

        {/* All Upcoming Shifts */}
        {!selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-sm text-foreground">Upcoming Shifts</h3>
            <div className="space-y-2">
              {shifts.slice(0, 5).map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {showForm && selectedGroup && (
        <CreateShiftForm
          group={selectedGroup}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}