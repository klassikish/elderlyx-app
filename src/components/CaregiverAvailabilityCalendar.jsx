import { useState } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isWithinInterval } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i);

export default function CaregiverAvailabilityCalendar({ caregiverId, onSelectSlot }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch caregiver's existing bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['caregiver-availability', caregiverId],
    queryFn: () =>
      base44.entities.Booking.filter(
        { caregiver_id: caregiverId, status: { $in: ['confirmed', 'in_progress'] } },
        '-scheduled_date',
        100
      ),
    enabled: !!caregiverId,
  });

  const isSlotBooked = (day, hour) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return bookings.some(b => {
      const bookingStart = parseISO(b.scheduled_date);
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setHours(bookingEnd.getHours() + (b.duration_hours || 1));

      return isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd });
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
          className="w-9 h-9 rounded-lg bg-background flex items-center justify-center hover:bg-border transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-foreground text-sm">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
        </h3>
        <button
          onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
          className="w-9 h-9 rounded-lg bg-background flex items-center justify-center hover:bg-border transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day headers */}
          <div className="flex bg-background border-b border-border">
            <div className="w-16 px-3 py-3 border-r border-border" />
            {days.map(day => (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className="flex-1 min-w-[140px] px-3 py-3 border-r border-border text-center bg-muted/30"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase">{format(day, 'EEE')}</p>
                <p className="text-sm font-bold text-foreground">{format(day, 'd')}</p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {HOURS.map(hour => (
            <div key={hour} className="flex border-b border-border">
              {/* Hour label */}
              <div className="w-16 px-3 py-3 border-r border-border bg-muted/20 flex items-center justify-center">
                <p className="text-xs font-semibold text-muted-foreground">{String(hour).padStart(2, '0')}:00</p>
              </div>

              {/* Day columns with availability slots */}
              {days.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const booked = isSlotBooked(day, hour);
                const slotTime = new Date(day);
                slotTime.setHours(hour, 0, 0, 0);

                return (
                  <div
                    key={`${dayKey}-${hour}`}
                    className="flex-1 min-w-[140px] px-2 py-2 border-r border-border flex items-center justify-center"
                  >
                    <button
                      onClick={() => {
                        if (!booked) {
                          onSelectSlot?.(slotTime);
                        }
                      }}
                      disabled={booked}
                      className={`w-full h-12 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        booked
                          ? 'bg-red-100 text-red-600 border border-red-200 cursor-not-allowed opacity-60'
                          : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                      }`}
                    >
                      {booked ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Booked</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Available</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span className="text-muted-foreground">Booked</span>
        </div>
      </div>
    </div>
  );
}