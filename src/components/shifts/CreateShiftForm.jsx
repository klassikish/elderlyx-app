import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CreateShiftForm({ group, onClose }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [data, setData] = useState({
    recurring: false,
    pay_rate: 25,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.CareShift.create({
        ...data,
        family_group_id: group.id,
        senior_id: group.senior_id,
        senior_name: group.senior_name,
        created_by_email: user?.email,
        created_by_name: user?.full_name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['care-shifts'] });
      toast.success('Shift created');
      onClose?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.title || !data.shift_date || !data.start_time || !data.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Create Care Shift</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Shift Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="e.g., Morning Care, Evening Shift"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Date</label>
            <input
              type="date"
              value={data.shift_date || ''}
              onChange={(e) => setData({ ...data, shift_date: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Start Time</label>
              <input
                type="time"
                value={data.start_time || ''}
                onChange={(e) => setData({ ...data, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">End Time</label>
              <input
                type="time"
                value={data.end_time || ''}
                onChange={(e) => setData({ ...data, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Hourly Rate ($)</label>
            <input
              type="number"
              value={data.pay_rate || ''}
              onChange={(e) => setData({ ...data, pay_rate: parseFloat(e.target.value) })}
              placeholder="25"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description</label>
            <textarea
              value={data.description || ''}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Optional details..."
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={data.recurring}
              onChange={(e) => setData({ ...data, recurring: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="recurring" className="text-sm text-foreground font-medium">
              Recurring shift
            </label>
          </div>

          {data.recurring && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Pattern</label>
                <select
                  value={data.recurrence_pattern || ''}
                  onChange={(e) => setData({ ...data, recurrence_pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">End Date</label>
                <input
                  type="date"
                  value={data.recurrence_end_date || ''}
                  onChange={(e) => setData({ ...data, recurrence_end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Shift'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}