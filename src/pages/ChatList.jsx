import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function ChatList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['chat-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter(
      user?.role === 'caregiver'
        ? { caregiver_id: user.id }
        : { family_email: user?.email },
      '-updated_date', 50
    ),
  });

  // Only bookings that have a caregiver assigned (so chat makes sense)
  const activeBookings = bookings.filter(b => b.caregiver_id && b.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">Messages</h1>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-2">
        {isLoading && (
          <div className="flex flex-col gap-3 mt-2">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        )}
        {!isLoading && activeBookings.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <MessageCircle className="w-14 h-14 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Chats appear once a caregiver is assigned to a booking</p>
          </div>
        )}
        {activeBookings.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/Chat?booking=${b.id}`}>
              <div className="bg-card rounded-2xl border border-border p-4 flex gap-3 items-center active:bg-muted transition-colors">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${b.service_type === 'companionship' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                  {b.service_type === 'companionship'
                    ? <Heart className="w-6 h-6 text-pink-500" />
                    : <Car className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">
                    {user?.role === 'caregiver' ? b.family_name || b.family_email : b.caregiver_name || 'Awaiting caregiver'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{b.service_type} · {b.status}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(b.updated_date || b.created_date), { addSuffix: true })}</p>
                </div>
                <MessageCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}