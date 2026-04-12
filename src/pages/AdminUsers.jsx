import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Star, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminUsers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('family');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const verifyUser = useMutation({
    mutationFn: ({ id }) => base44.entities.User.update(id, { is_verified: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User verified'); },
  });

  const list = users.filter(u => u.role === tab);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">Users</h1>
      </div>

      <div className="flex px-5 pt-4 gap-2">
        {['family', 'caregiver'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${tab === t ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t === 'family' ? '👨‍👩‍👧 Families' : '⭐ Caregivers'} ({users.filter(u => u.role === t).length})
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3 pb-6">
        {isLoading && <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>}
        {list.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card rounded-2xl border border-border p-4 flex gap-3 items-center"
          >
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {u.photo_url ? <img src={u.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground text-sm">{u.full_name || u.email}</p>
                {u.is_verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              {u.rating && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium">{u.rating.toFixed(1)}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">Joined {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
            </div>
            {!u.is_verified && (
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => verifyUser.mutate({ id: u.id })}>
                Verify
              </Button>
            )}
          </motion.div>
        ))}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No {tab} users yet</div>
        )}
      </div>
    </div>
  );
}