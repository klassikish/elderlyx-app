import { Link } from 'react-router-dom';
import { Bell, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CaregiverHomeHeader({ user, notifications }) {
  const qc = useQueryClient();
  const toggleAvailable = useMutation({
    mutationFn: () => base44.auth.updateMe({ caregiver_available: !user?.caregiver_available }),
    onSuccess: () => { qc.invalidateQueries(); toast.success('Availability updated'); },
  });

  const isAvailable = user?.caregiver_available;

  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #064e3b 0%, #065f46 55%, #047857 100%)' }}>
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 -left-8 w-44 h-44 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
      <div className="relative z-10 px-5 pt-14 pb-24">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-emerald-300/80 text-sm font-medium tracking-wide">Caregiver Dashboard</p>
            <h1 className="text-white text-3xl font-black mt-0.5 tracking-tight">
              {user?.full_name?.split(' ')[0] || 'Welcome'} <span className="text-emerald-300">✦</span>
            </h1>
            <p className="text-emerald-200/60 text-xs mt-1.5 font-medium">Making a difference, one visit at a time</p>
          </div>
          <Link to="/Notifications" className="relative mt-1">
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

        <button
          onClick={() => toggleAvailable.mutate()}
          className="relative z-10 mt-4 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 transition-all active:scale-95"
          style={{ background: isAvailable ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isAvailable ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.12)'}` }}
        >
          {isAvailable
            ? <ToggleRight className="w-5 h-5 text-emerald-300" />
            : <ToggleLeft className="w-5 h-5 text-white/40" />}
          <span className={`text-sm font-bold ${isAvailable ? 'text-emerald-200' : 'text-white/50'}`}>
            {isAvailable ? '● Available for jobs' : '○ Unavailable'}
          </span>
        </button>
      </div>
    </div>
  );
}