import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShiftCalendar({ shifts, onDayClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getShiftsForDay = (day) => {
    return shifts.filter((shift) =>
      isSameDay(new Date(shift.shift_date), day)
    );
  };

  const prev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const next = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={prev} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dayShifts = getShiftsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <motion.button
              key={i}
              onClick={() => onDayClick?.(day)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`aspect-square p-1 rounded-lg border transition-all ${
                isCurrentMonth
                  ? 'bg-background border-border hover:border-primary cursor-pointer'
                  : 'bg-muted/30 border-transparent'
              }`}
            >
              <div className="h-full flex flex-col items-start justify-start">
                <span className={`text-xs font-semibold ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>
                {dayShifts.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                    {dayShifts.slice(0, 2).map((shift, j) => (
                      <div
                        key={j}
                        className={`text-[8px] font-bold px-1 py-0.5 rounded truncate w-full ${
                          shift.status === 'open'
                            ? 'bg-blue-100 text-blue-700'
                            : shift.status === 'claimed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {shift.title}
                      </div>
                    ))}
                    {dayShifts.length > 2 && (
                      <span className="text-[7px] text-muted-foreground">+{dayShifts.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}