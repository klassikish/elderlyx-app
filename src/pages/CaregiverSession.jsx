import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PackVisitReport from '@/components/PackVisitReport';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PlayCircle, StopCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import SessionHeader from '@/components/caregiver/SessionHeader';
import BookingInfoCard from '@/components/caregiver/BookingInfoCard';
import TaskChecklist from '@/components/caregiver/TaskChecklist';
import QuickUpdatesSection from '@/components/caregiver/QuickUpdatesSection';
import NoteInputSection from '@/components/caregiver/NoteInputSection';
import SessionLog from '@/components/caregiver/SessionLog';

const BOOKING_ID = new URLSearchParams(window.location.search).get('id');

export default function CaregiverSession() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [completedTasks, setCompletedTasks] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [arrived, setArrived] = useState(false);

  const { data: booking } = useQuery({
    queryKey: ['session-booking', BOOKING_ID],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ caregiver_id: user?.id }, '-created_date', 50);
      return bookings.find(b => b.id === BOOKING_ID);
    },
    enabled: !!BOOKING_ID && !!user?.id,
  });

  const { data: journal } = useQuery({
    queryKey: ['session-journal', BOOKING_ID],
    queryFn: () => base44.entities.VisitJournal.filter({ booking_id: BOOKING_ID }, '-created_date', 1),
    enabled: !!BOOKING_ID,
    select: data => data[0] || null,
  });

  useEffect(() => {
    if (!sessionStarted || !startTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, startTime]);

  const startSessionMutation = useMutation({
    mutationFn: () => base44.entities.Booking.update(BOOKING_ID, { status: 'in_progress' }),
    onSuccess: () => {
      setSessionStarted(true);
      setStartTime(Date.now());
      qc.invalidateQueries({ queryKey: ['caregiver-bookings'] });
      toast.success('Session started!');
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: async (text) => {
      const existing = journal;
      const newNote = `[${format(new Date(), 'h:mm a')}] ${text}`;
      if (existing) {
        const updated = existing.notes ? `${existing.notes}\n${newNote}` : newNote;
        return base44.entities.VisitJournal.update(existing.id, { notes: updated });
      }
      return base44.entities.VisitJournal.create({
        booking_id: BOOKING_ID,
        caregiver_id: user?.id,
        caregiver_name: user?.full_name,
        family_email: booking?.family_email,
        senior_name: booking?.senior_name,
        notes: newNote,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-journal', BOOKING_ID] });
      setNoteText('');
      toast.success('Note saved!');
    },
  });

  const toggleTask = (id) => {
    setCompletedTasks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleQuickUpdate = (text) => {
    saveNoteMutation.mutate(text);
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const notes = journal?.notes ? journal.notes.split('\n').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-background pb-32">
      <SessionHeader sessionStarted={sessionStarted} elapsed={elapsed} />

      <div className="px-5 pt-5 space-y-5">
        <BookingInfoCard booking={booking} />

        {arrived && !sessionStarted && booking.status !== 'in_progress' && (
          <Button
            className="w-full h-14 rounded-2xl font-bold text-base gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => startSessionMutation.mutate()}
            disabled={startSessionMutation.isPending}
          >
            {startSessionMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            Start Session
          </Button>
        )}

        {(sessionStarted || booking.status === 'in_progress') && (
          <>
            <TaskChecklist completedTasks={completedTasks} onToggleTask={toggleTask} />
            <QuickUpdatesSection onSend={handleQuickUpdate} />
            <NoteInputSection
              noteText={noteText}
              onNoteChange={setNoteText}
              onSend={() => noteText.trim() && saveNoteMutation.mutate(noteText.trim())}
              isLoading={saveNoteMutation.isPending}
            />
            <SessionLog notes={notes} />
          </>
        )}
      </div>

      {(sessionStarted || booking.status === 'in_progress') && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background/95 backdrop-blur border-t border-border px-5 pt-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          {completedTasks.length < 7 && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1 mb-2 font-medium">
              <AlertTriangle className="w-3 h-3" /> {7 - completedTasks.length} tasks still pending
            </p>
          )}
          <Button
            className="w-full h-12 rounded-2xl font-bold gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setShowVisitForm(true)}
          >
            <StopCircle className="w-4 h-4" />
            Complete Session
          </Button>
        </div>
      )}

      {showVisitForm && (
        <PackVisitReport
          booking={booking}
          onComplete={() => { setShowVisitForm(false); location.href = '/'; }}
        />
      )}
    </div>
  );
}