import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const FLAG_TYPES = [
  'suspicious_activity',
  'payment_issue',
  'complaint',
  'multiple_chargebacks',
  'high_refund_rate',
  'account_abuse',
];

export default function RiskFlagPanel({ flags, group }) {
  const qc = useQueryClient();
  const [showAddFlag, setShowAddFlag] = useState(false);
  const [newFlagType, setNewFlagType] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');

  const addFlagMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FamilyGroupFlag.create({
        family_group_id: group.id,
        group_name: group.group_name,
        primary_owner_email: group.primary_owner_email,
        flag_type: newFlagType,
        description: newFlagDesc,
        flagged_by_admin: (await base44.auth.me()).email,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-flags'] });
      toast.success('Flag added');
      setShowAddFlag(false);
      setNewFlagType('');
      setNewFlagDesc('');
    },
  });

  const resolveFlagMutation = useMutation({
    mutationFn: (flagId) =>
      base44.entities.FamilyGroupFlag.update(flagId, { status: 'resolved' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-flags'] });
      toast.success('Flag resolved');
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Risk Flags ({flags.length})
        </h3>
        <button
          onClick={() => setShowAddFlag(!showAddFlag)}
          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAddFlag && (
        <div className="bg-muted/30 rounded-xl p-3 mb-4 space-y-2 border border-border">
          <select
            value={newFlagType}
            onChange={e => setNewFlagType(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg"
          >
            <option value="">Select flag type...</option>
            {FLAG_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <textarea
            placeholder="Flag description..."
            value={newFlagDesc}
            onChange={e => setNewFlagDesc(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg resize-none h-16"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => addFlagMutation.mutate()}
              disabled={!newFlagType || !newFlagDesc || addFlagMutation.isPending}
              className="text-xs rounded-lg"
            >
              Add Flag
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddFlag(false)}
              className="text-xs rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {flags.length === 0 ? (
          <p className="text-xs text-muted-foreground">No flags</p>
        ) : (
          flags.map((flag) => (
            <div key={flag.id} className={`p-3 rounded-xl border ${
              flag.severity === 'critical' ? 'bg-red-50 border-red-200' :
              flag.severity === 'high' ? 'bg-orange-50 border-orange-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start justify-between mb-1">
                <p className="font-semibold text-xs capitalize">{flag.flag_type.replace(/_/g, ' ')}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  flag.severity === 'critical' ? 'bg-red-200 text-red-700' :
                  flag.severity === 'high' ? 'bg-orange-200 text-orange-700' :
                  'bg-yellow-200 text-yellow-700'
                }`}>
                  {flag.severity}
                </span>
              </div>
              <p className="text-[10px] text-foreground mb-2">{flag.description}</p>
              <button
                onClick={() => resolveFlagMutation.mutate(flag.id)}
                disabled={resolveFlagMutation.isPending}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Mark Resolved
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}