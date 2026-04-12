import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, isSameDay, parseISO } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Heart, Car, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i); // 9 AM to 6 PM

export default function WeeklyCalendar({ bookings = [], onReschedule, editable = false }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ bookingId, newDate }) => {
      await base44.entities.Booking.update(bookingId, { scheduled_date: newDate.toISOString() });
      return { bookingId, newDate };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['caregiver-jobs'] });
      toast.success('Job rescheduled!');
      if (onReschedule) onReschedule();
    },
    onError: () => toast.error('Failed to reschedule'),
  });

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const map = {};
    days.forEach(day => {
      map[format(day, 'yyyy-MM-dd')] = [];
    });
    bookings.forEach(b => {
      const dateKey = format(parseISO(b.scheduled_date), 'yyyy-MM-dd');
      if (map[dateKey]) map[dateKey].push(b);
    });
    return map;
  }, [bookings, days]);

  const handleDragEnd = (result) => {
    if (!editable) return;
    const { draggableId, destination } = result;
    if (!destination) return;

    const bookingId = draggableId.split('-')[1];
    const [dayKey, hourStr] = destination.droppableId.split('-');
    const targetHour = parseInt(hourStr);

    const newDate = new Date(`${dayKey}T${String(targetHour).padStart(2, '0')}:00:00`);
    updateMutation.mutate({ bookingId, newDate });
  };

  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-border transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-bold text-foreground text-sm">
          {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
        </h2>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-border transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Day headers */}
            <div className="flex bg-muted/50 border-b border-border sticky top-0 z-10">
              <div className="w-16 px-3 py-3 border-r border-border" />
              {days.map(day => (
                <div key={format(day, 'yyyy-MM-dd')} className="flex-1 min-w-[160px] px-3 py-3 border-r border-border text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{format(day, 'EEE')}</p>
                  <p className="text-sm font-bold text-foreground">{format(day, 'd')}</p>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {HOURS.map(hour => (
              <div key={hour} className="flex border-b border-border">
                {/* Hour label */}
                <div className="w-16 px-3 py-4 border-r border-border bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground">{String(hour).padStart(2, '0')}:00</p>
                </div>

                {/* Day columns */}
                {days.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const droppableId = `${dayKey}-${hour}`;
                  const dayBookings = bookingsByDay[dayKey] || [];
                  const hourBookings = dayBookings.filter(b => {
                    const bookingHour = parseInt(format(parseISO(b.scheduled_date), 'H'));
                    return bookingHour === hour;
                  });

                  return (
                    <Droppable key={droppableId} droppableId={droppableId} isDropDisabled={!editable}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-w-[160px] px-2 py-2 border-r border-border transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary/5' : 'hover:bg-muted/20'
                          }`}
                        >
                          <div className="space-y-1 min-h-20">
                            {hourBookings.map((booking, idx) => (
                              <Draggable
                                key={`booking-${booking.id}`}
                                draggableId={`booking-${booking.id}`}
                                index={idx}
                                isDragDisabled={!editable}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`rounded-lg p-2 text-[10px] font-semibold cursor-move transition-all ${
                                      booking.service_type === 'companionship'
                                        ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                                    } ${snapshot.isDragging ? 'shadow-lg rotate-3 opacity-90' : ''}`}
                                  >
                                    <div className="flex items-start gap-1">
                                      {booking.service_type === 'companionship' ? (
                                        <Heart className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <Car className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                      )}
                                      <span className="line-clamp-1">{booking.senior_name}</span>
                                    </div>
                                    {booking.caregiver_name && (
                                      <p className="text-[9px] text-opacity-70 mt-0.5">👤 {booking.caregiver_name}</p>
                                    )}
                                    <p className="text-[9px] opacity-70 mt-0.5 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      {booking.duration_hours || 1}h
                                    </p>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Footer */}
      {bookings.length === 0 && (
        <div className="text-center py-12 px-5">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No scheduled jobs this week</p>
        </div>
      )}

      {editable && (
        <div className="px-5 py-4 bg-muted/30 border-t border-border text-[11px] text-muted-foreground text-center">
          Drag jobs to reschedule them to a different time
        </div>
      )}
    </div>
  );
}