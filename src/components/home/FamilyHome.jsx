import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '@/components/PullToRefresh';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ElderlyxLifeMonitor from '@/components/ElderlyxLifeMonitor';
import UpgradePromptModal from '@/components/UpgradePromptModal';
import { Bell, Heart, Car, ChevronRight, Star, Shield, Clock, Sparkles, ArrowRight } from 'lucide-react';
import CarePackDashboard from '@/components/CarePackDashboard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function FamilyHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleRefresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['my-bookings'] }),
      qc.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  };

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => base44.entities.Booking.filter({ family_email: user?.email }, '-created_date', 5),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email, is_read: false }, '-created_date', 10),
  });

  const upcomingBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0f1e3d 0%, #1a3560 55%, #1e4d8c 100%)' }}>
          {/* Layered decorative circles */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #6fa3ff 0%, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #a5c4ff 0%, transparent 60%)' }} />

          <div className="relative z-10 px-5 pt-14 pb-24">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-300/80 text-sm font-medium tracking-wide">Good {getTimeOfDay()}</p>
                <h1 className="text-white text-3xl font-black mt-0.5 tracking-tight">
                  {firstName} <span className="text-blue-300">✦</span>
                </h1>
                <p className="text-blue-200/60 text-xs mt-1.5 font-medium">Premium care, always within reach</p>
              </div>
              <Link to="/Notifications" aria-label="View notifications" className="relative mt-1">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Quick Book Hero Card ── */}
        <div className="px-4 -mt-12 relative z-10">
          <Link to="/Book">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl overflow-hidden shadow-2xl active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)' }}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-white text-lg leading-tight">Book care in 60s</p>
                  <p className="text-blue-200/80 text-xs mt-0.5 font-medium">Name · Date · Pay → Done</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)' }} />
            </motion.div>
          </Link>
        </div>

        {/* ── Services ── */}
        <div className="px-4 mt-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                to: '/Book?service=companionship',
                icon: Heart,
                label: 'Companionship',
                sub: 'Company, meals & activities',
                price: '$35 / visit',
                iconBg: 'bg-rose-50',
                iconColor: 'text-rose-500',
                accent: '#fff1f2',
                delay: 0.05,
              },
              {
                to: '/Book?service=transportation',
                icon: Car,
                label: 'Transportation',
                sub: 'Doctor visits & safe rides',
                price: '$40 / ride',
                iconBg: 'bg-sky-50',
                iconColor: 'text-sky-500',
                accent: '#f0f9ff',
                delay: 0.1,
              },
            ].map(({ to, icon: Icon, label, sub, price, iconBg, iconColor, accent, delay }) => (
              <motion.div key={to} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
                <Link to={to} className="block active:scale-95 transition-transform">
                  <div className="bg-card rounded-3xl border border-border/60 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">{label}</h3>
                      <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{sub}</p>
                      <div className="mt-3 inline-block">
                        <span className="text-primary font-black text-sm">{price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Trust Strip ── */}
        <div className="px-4 mt-4">
          <div className="rounded-3xl border border-border/60 bg-card p-4">
            <div className="flex gap-2">
              {[
                { icon: Shield, label: 'Background\nChecked', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: Star, label: 'Top Rated\nCaregivers', color: 'text-amber-500', bg: 'bg-amber-50' },
                { icon: Clock, label: 'Flexible\nScheduling', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map(({ icon: Icon, label, color, bg }, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${color}`} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground leading-tight whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Care Pack Dashboard ── */}
        <CarePackDashboard />

        {/* ── Life Monitor ── */}
        <div className="px-4 mt-4">
          <ElderlyxLifeMonitor onUpgradeClick={() => setShowUpgradeModal(true)} />
        </div>

        {/* ── Upcoming Bookings ── */}
        {upcomingBookings.length > 0 && (
          <div className="px-4 mt-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-foreground text-base">Upcoming</h2>
              <Link to="/MyBookings" className="text-xs text-primary font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {upcomingBookings.slice(0, 2).map(b => (
                <div key={b.id} className="bg-card rounded-2xl border border-border/60 p-4 flex gap-3 items-center shadow-sm">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${b.service_type === 'companionship' ? 'bg-rose-50' : 'bg-sky-50'}`}>
                    {b.service_type === 'companionship'
                      ? <Heart className="w-5 h-5 text-rose-500" />
                      : <Car className="w-5 h-5 text-sky-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground capitalize">{b.service_type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(b.scheduled_date), 'EEE, MMM d · h:mm a')}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {b.status === 'confirmed' ? '✓ Confirmed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Browse Caregivers CTA ── */}
        <div className="px-4 mt-4 mb-8">
          <Link to="/Caregivers" className="block active:scale-[0.98] transition-transform">
            <div className="rounded-3xl border border-primary/20 p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(30,64,175,0.03) 100%)' }}>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">Browse Caregivers</p>
                <p className="text-xs text-muted-foreground mt-0.5">Find the perfect match</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
          </Link>
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradePromptModal
          onClose={() => setShowUpgradeModal(false)}
          trigger="visited_feature"
        />
      )}
    </PullToRefresh>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}