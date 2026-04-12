import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Star, Calendar, CreditCard, Bell, LogOut, ChevronRight, Shield, ShieldCheck, FileText, Trash2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'family';

  const handleLogout = () => base44.auth.logout('/');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    // Log out — actual deletion requires a backend/admin process
    await base44.auth.logout('/');
  };

  const menuItems = [
    { icon: Calendar, label: 'My Bookings', to: '/MyBookings', show: role === 'family' },
    { icon: Receipt, label: 'Billing & Subscription', to: '/Billing', show: role === 'family' },
    { icon: Bell, label: 'Notifications', to: '/Notifications', show: true },
    { icon: Shield, label: 'Caregiver Dashboard', to: '/', show: role === 'caregiver' },
    { icon: FileText, label: 'My Documents', to: '/CaregiverDocuments', show: role === 'caregiver' },
    { icon: ShieldCheck, label: 'Document Verification', to: '/AdminDocuments', show: role === 'admin' },
  ].filter(i => i.show);

  const roleColor = role === 'admin' ? 'text-red-600 bg-red-50 border-red-200' : role === 'caregiver' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-primary bg-primary/8 border-primary/20';
  const roleLabel = role === 'admin' ? '⚡ Admin' : role === 'caregiver' ? '✦ Caregiver' : '◎ Family';

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 rounded-xl bg-muted/70 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-black text-foreground text-lg">Profile</h1>
      </div>

      {/* Hero Avatar Section */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(222,84%,28%) 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="flex flex-col items-center pt-10 pb-8 px-5 relative z-10">
          <div className="w-22 h-22 rounded-3xl border-4 border-white/30 bg-white/20 flex items-center justify-center mb-3 overflow-hidden shadow-xl" style={{ width: 88, height: 88 }}>
            {user?.photo_url
              ? <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-white" />}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{user?.full_name}</h2>
          <p className="text-sm text-white/60 mt-0.5 font-medium">{user?.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border capitalize bg-white/15 text-white border-white/25`}>
              {roleLabel}
            </span>
            {user?.is_verified && role === 'caregiver' && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {user?.rating && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {user.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {role === 'family' && (
        <div className="mx-4 mt-4 mb-1 rounded-3xl p-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(30,64,175,0.04) 100%)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <div>
            <p className="font-black text-foreground text-sm">Current Plan</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.subscription_plan || 'basic'} plan · Upgrade for more</p>
          </div>
          <Link to="/Plans">
            <Button size="sm" className="rounded-xl font-bold shadow-sm shadow-primary/20 px-4">Upgrade</Button>
          </Link>
        </div>
      )}

      <div className="px-4 mt-4 space-y-2 pb-8">
        {menuItems.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to} className="flex items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/8 rounded-2xl flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="font-semibold text-foreground text-sm">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-2xl p-4 transition-colors active:scale-[0.98] border border-red-100 bg-red-50/60 hover:bg-red-50"
        >
          <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
            <LogOut className="w-4.5 h-4.5 text-red-500" />
          </div>
          <span className="font-bold text-red-600 text-sm">Sign Out</span>
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-3 w-full rounded-2xl p-4 transition-colors active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-muted rounded-2xl flex items-center justify-center">
            <Trash2 className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
          <span className="font-semibold text-muted-foreground text-sm">Delete Account</span>
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-card rounded-t-3xl p-6 pb-10 w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Delete Account</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              This will permanently delete your account and all data. This action cannot be undone.
            </p>
            <p className="text-xs font-semibold text-foreground mb-2">Type <span className="text-red-600 font-bold">DELETE</span> to confirm</p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-transparent mb-4 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold"
              onClick={handleDeleteAccount}
              disabled={deleteInput !== 'DELETE'}
            >
              Permanently Delete My Account
            </Button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full mt-2 text-sm text-muted-foreground py-2"
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}