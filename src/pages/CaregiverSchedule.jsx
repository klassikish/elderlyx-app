import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CaregiverSchedule() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['caregiver-schedule', user?.id],
    queryFn: () => {
      if (user?.role === 'caregiver') {
        return base44.entities.Booking.filter(
          { caregiver_id: user.id, status: { $in: ['confirmed', 'in_progress', 'completed'] } },
          '-scheduled_date',
          100
        );
      }
      return [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Calendar className="w-5 h-5 text-primary" />
        <h1 className="font-bold text-foreground">My Schedule</h1>
      </div>

      <div className="px-5 py-6 pb-10">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading schedule…</div>
        ) : (
          <WeeklyCalendar
            bookings={bookings}
            editable={user?.role === 'caregiver'}
            onReschedule={() => refetch()}
          />
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">💡 Pro Tip</p>
          <p className="text-xs text-blue-800">
            {user?.role === 'caregiver'
              ? 'Drag jobs to reschedule them. Changes are saved automatically.'
              : 'View caregiver availability and schedule visits at specific times.'}
          </p>
        </div>
      </div>
    </div>
  );
}