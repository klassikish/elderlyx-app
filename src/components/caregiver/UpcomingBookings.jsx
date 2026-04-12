import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import TransportTimer from '@/components/TransportTimer';

export default function UpcomingBookings({ bookings }) {
  const navigate = useNavigate();

  if (bookings.length === 0) return null;

  return (
    <div className="px-5 mt-5">
      <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" /> Upcoming
      </h2>
      <div className="space-y-2">
        {bookings.map(b => (
          <div key={b.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm capitalize">{b.service_type}</p>
                <p className="text-xs text-muted-foreground">{b.senior_name} · {format(new Date(b.scheduled_date), 'MMM d, h:mm a')}</p>
              </div>
              <button
                onClick={() => navigate(`/CaregiverSession?id=${b.id}`)}
                className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
              >
                ▶ Start
              </button>
            </div>
            {b.service_type === 'transportation' && <TransportTimer booking={b} />}
          </div>
        ))}
      </div>
    </div>
  );
}