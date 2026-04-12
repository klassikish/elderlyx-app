import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const LOCK_REASONS = [
  { id: 'legal_issue', label: 'Legal Issue' },
  { id: 'fraud_detected', label: 'Fraud Detected' },
  { id: 'payment_failure', label: 'Payment Failure' },
  { id: 'tos_violation', label: 'TOS Violation' },
  { id: 'admin_request', label: 'Admin Request' },
  { id: 'security_breach', label: 'Security Breach' },
  { id: 'other', label: 'Other' },
];

export default function GroupLockModal({ group, onClose }) {
  const qc = useQueryClient();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isUnlock = group.status === 'locked';
  const canConfirm = selectedReason && details && (isUnlock || confirmText === 'LOCK');

  const toggleLockMutation = useMutation({
    mutationFn: async () => {
      if (isUnlock) {
        await base44.entities.FamilyGroup.update(group.id, { status: 'active' });
      } else {
        await base44.entities.FamilyGroup.update(group.id, {
          status: 'locked',
          lock_reason: selectedReason,
          locked_at: new Date().toISOString(),
          locked_by_admin: (await base44.auth.me()).email,
        });
        await base44.entities.GroupLock.create({
          family_group_id: group.id,
          group_name: group.group_name,
          primary_owner_email: group.primary_owner_email,
          lock_reason: selectedReason,
          lock_details: details,
          locked_by_admin: (await base44.auth.me()).email,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-group-detail'] });
      toast.success(isUnlock ? 'Group unlocked' : 'Group locked');
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">
            {isUnlock ? 'Unlock Group' : 'Lock Group'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`rounded-xl p-4 ${isUnlock ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-semibold ${isUnlock ? 'text-green-900' : 'text-red-900'}`}>
            {isUnlock
              ? 'This will reactivate the group and allow bookings & payments'
              : 'This will disable bookings, payments, and role changes immediately'}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Reason</label>
            <select
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card border border-input rounded-xl"
            >
              <option value="">Select reason...</option>
              {LOCK_REASONS.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Details</label>
            <textarea
              placeholder={isUnlock ? 'Why are you unlocking?' : 'Provide detailed reason...'}
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-card border border-input rounded-xl resize-none h-20"
            />
          </div>

          {!isUnlock && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                Type "LOCK" to confirm
              </label>
              <input
                type="text"
                placeholder="Type LOCK..."
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-card border border-input rounded-xl"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={`flex-1 rounded-xl gap-2 ${isUnlock ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            disabled={!canConfirm || toggleLockMutation.isPending}
            onClick={() => toggleLockMutation.mutate()}
          >
            {toggleLockMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {isUnlock ? 'Unlock Group' : 'Lock Group'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}