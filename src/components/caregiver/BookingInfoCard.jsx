import { User, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingInfoCard({ booking }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
          {booking.service_type === 'companionship' ? '❤️' : '🚗'}
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground capitalize">{booking.service_type} Visit</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <User className="w-3 h-3" /> {booking.senior_name}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" /> {format(new Date(booking.scheduled_date), 'MMM d, h:mm a')}
          </div>
          {booking.address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" /> {booking.address}
            </div>
          )}
        </div>
        <span className="text-primary font-black text-xl">${booking.price || 35}</span>
      </div>
    </div>
  );
}