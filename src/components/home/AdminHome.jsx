import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, Calendar, DollarSign, Star, ChevronRight, TrendingUp, ShieldCheck, Activity, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminHome() {
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.price || 0), 0);
  const families = users.filter(u => u.role === 'family').length;
  const caregivers = users.filter(u => u.role === 'caregiver').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  const stats = [
    { icon: Users, label: 'Families', value: families, color: 'text-blue-500', bg: 'bg-blue-50', to: '/AdminUsers' },
    { icon: Star, label: 'Caregivers', value: caregivers, color: 'text-violet-500', bg: 'bg-violet-50', to: '/AdminUsers' },
    { icon: AlertCircle, label: 'Pending', value: pendingBookings, color: 'text-amber-500', bg: 'bg-amber-50', to: '/AdminBookings' },
    { icon: DollarSign, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-emerald-500', bg: 'bg-emerald-50', to: '/AdminBookings' },
  ];

  const links = [
    { label: 'All Bookings', sub: 'Manage and monitor every booking', to: '/AdminBookings', icon: Calendar, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Users', sub: 'Families, caregivers & admins', to: '/AdminUsers', icon: Users, accent: 'bg-violet-50 text-violet-600' },
    { label: 'Caregiver Approvals', sub: 'Review applications & credentials', to: '/AdminCaregiverApproval', icon: ShieldCheck, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Caregiver Monitoring', sub: 'Performance, GPS & discipline', to: '/AdminCaregiverMonitoring', icon: Activity, accent: 'bg-rose-50 text-rose-600' },
    { label: 'Family Groups', sub: 'Groups, health scores & flags', to: '/AdminFamilyGroups', icon: Users, accent: 'bg-amber-50 text-amber-600' },
    { label: 'Analytics', sub: 'Platform stats & revenue', to: '/AdminAnalyticsDashboard', icon: TrendingUp, accent: 'bg-sky-50 text-sky-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #0a1628 0%, #111d35 60%, #162445 100%)' }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #6fa3ff 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="relative z-10 px-5 pt-14 pb-24">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-blue-400/80 text-xs font-bold tracking-widest uppercase">Admin Console</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">Elderlyx HQ</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">Real-time platform overview</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="px-4 -mt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border/60 shadow-2xl overflow-hidden"
        >
          <div className="grid grid-cols-2">
            {stats.map(({ icon: Icon, label, value, color, bg, to }, i) => (
              <Link key={label} to={to}>
                <div className={`p-5 flex items-center gap-3 hover:bg-muted/40 transition-colors active:bg-muted/60 ${i === 1 || i === 3 ? '' : ''}`}
                  style={{ borderRight: i % 2 === 0 ? '1px solid hsl(var(--border) / 0.4)' : 'none', borderBottom: i < 2 ? '1px solid hsl(var(--border) / 0.4)' : 'none' }}>
                  <div className={`w-11 h-11 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground leading-none">{value}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-wide">{label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-4 mt-6 pb-8">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Platform Tools</p>
        <div className="space-y-2.5">
          {links.map(({ label, sub, to, icon: Icon, accent }, i) => (
            <motion.div key={to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={to} className="block active:scale-[0.98] transition-transform">
                <div className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}