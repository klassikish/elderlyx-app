import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Package, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OngoingClientsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: completedBookings = [] } = useQuery({
    queryKey: ['ongoing-clients', user?.id],
    queryFn: () => base44.entities.Booking.filter({ caregiver_id: user?.id, status: 'completed', service_type: 'companionship' }, '-scheduled_date', 50),
    enabled: !!user?.id,
  });

  const { data: upcomingBookings = [] } = useQuery({
    queryKey: ['upcoming-for-caregiver', user?.id],
    queryFn: () => base44.entities.Booking.filter({ caregiver_id: user?.id, status: 'confirmed' }, 'scheduled_date', 20),
    enabled: !!user?.id,
  });

  // Group by client (family_email)
  const clientMap = {};
  completedBookings.forEach(b => {
    if (!b.family_email) return;
    if (!clientMap[b.family_email]) {
      clientMap[b.family_email] = { name: b.senior_name, email: b.family_email, completed: 0, upcoming: 0 };
    }
    clientMap[b.family_email].completed += 1;
  });
  upcomingBookings.forEach(b => {
    if (!b.family_email) return;
    if (!clientMap[b.family_email]) {
      clientMap[b.family_email] = { name: b.senior_name, email: b.family_email, completed: 0, upcoming: 0 };
    }
    clientMap[b.family_email].upcoming += 1;
  });

  const clients = Object.values(clientMap).filter(c => c.completed > 0 || c.upcoming > 0);

  // Bonus tracking
  const totalCompleted = completedBookings.length;
  const nextThreshold = totalCompleted < 10 ? 10 : totalCompleted < 20 ? 20 : 30;
  const bonusAmount = nextThreshold >= 30 ? 180 : nextThreshold >= 20 ? 100 : 40;
  const progress = Math.min((totalCompleted / nextThreshold) * 100, 100);

  if (clients.length === 0) return null;

  return (
    <div className="px-5 mt-5">
      {/* Bonus tracker */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Bonus Progress
          </p>
          <span className="text-xs font-bold text-amber-700">${bonusAmount} at {nextThreshold} visits</span>
        </div>
        <div className="h-2 bg-amber-200 rounded-full overflow-hidden mb-1.5">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <p className="text-[10px] text-amber-700">
          {totalCompleted}/{nextThreshold} visits · {nextThreshold - totalCompleted} more to unlock ${bonusAmount} bonus
        </p>
      </div>

      {/* Ongoing clients */}
      <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> Ongoing Clients
      </h2>
      <div className="space-y-2">
        {clients.map((client, i) => (
          <motion.div
            key={client.email}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                {client.name?.[0] || '?'}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{client.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{client.completed} completed</span>
                  {client.upcoming > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {client.upcoming} upcoming
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" />
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}