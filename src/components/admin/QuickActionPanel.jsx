import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Lock, Edit2, RefreshCw, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function QuickActionPanel({ group }) {
  const qc = useQueryClient();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  const changePlanMutation = useMutation({
    mutationFn: (plan) => base44.entities.FamilyGroup.update(group.id, { subscription_plan: plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-group-detail'] });
      toast.success('Plan updated');
    },
  });

  const issueRefundMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('adminIssueRefund', {
        family_group_id: group.id,
        amount: refundAmount,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-group-detail'] });
      toast.success(`Refund of $${refundAmount} issued`);
      setRefundAmount(0);
      setShowRefundModal(false);
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>

      <div className="space-y-3">
        {/* Change Plan */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Change Subscription Plan</p>
          <div className="flex gap-2 flex-wrap">
            {['basic', 'family', 'premium'].map(plan => (
              <Button
                key={plan}
                size="sm"
                variant={group.subscription_plan === plan ? 'default' : 'outline'}
                className="text-xs rounded-lg"
                onClick={() => changePlanMutation.mutate(plan)}
                disabled={changePlanMutation.isPending}
              >
                {plan}
              </Button>
            ))}
          </div>
        </div>

        {/* Issue Refund */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Issue Refund</p>
          {!showRefundModal ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-lg gap-1.5 w-full"
              onClick={() => setShowRefundModal(true)}
            >
              <DollarSign className="w-3.5 h-3.5" /> Issue Refund
            </Button>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={refundAmount}
                onChange={e => setRefundAmount(parseFloat(e.target.value))}
                className="flex-1 px-2 py-1.5 text-xs border border-input rounded-lg bg-transparent"
              />
              <Button
                size="sm"
                onClick={() => issueRefundMutation.mutate()}
                disabled={!refundAmount || issueRefundMutation.isPending}
                className="text-xs rounded-lg"
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs rounded-lg"
                onClick={() => setShowRefundModal(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}