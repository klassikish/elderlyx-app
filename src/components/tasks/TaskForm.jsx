import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TaskForm({ group, members, onClose, onSuccess }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [data, setData] = useState({
    task_type: 'chore',
    priority: 'medium',
    requires_photo: true,
    recurring: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.Task.create({
        ...data,
        family_group_id: group.id,
        senior_id: group.senior_id,
        senior_name: group.senior_name,
        assigned_by_email: user?.email,
        assigned_by_name: user?.full_name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-tasks'] });
      toast.success('Task created');
      onSuccess?.();
      onClose?.();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.assigned_to_email) {
      toast.error('Please assign task to someone');
      return;
    }
    if (!data.due_date) {
      toast.error('Please set a due date');
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
          <h2 className="text-lg font-bold text-foreground">Create Task</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Task Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="e.g., Take morning medication"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              required
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

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Task Type</label>
            <select
              value={data.task_type}
              onChange={(e) => setData({ ...data, task_type: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="medication">💊 Medication</option>
              <option value="chore">🧹 Chore</option>
              <option value="activity">🎯 Activity</option>
              <option value="medical">🏥 Medical</option>
              <option value="grooming">🚿 Grooming</option>
              <option value="meal">🍽️ Meal</option>
              <option value="other">📝 Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Assign To</label>
              <select
                value={data.assigned_to_email || ''}
                onChange={(e) => {
                  const member = members.find((m) => m.member_email === e.target.value);
                  setData({
                    ...data,
                    assigned_to_email: e.target.value,
                    assigned_to_name: member?.member_name,
                  });
                }}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.member_email}>
                    {m.member_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Priority</label>
              <select
                value={data.priority}
                onChange={(e) => setData({ ...data, priority: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Due Date & Time</label>
            <input
              type="datetime-local"
              value={data.due_date || ''}
              onChange={(e) => setData({ ...data, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires_photo"
              checked={data.requires_photo}
              onChange={(e) => setData({ ...data, requires_photo: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="requires_photo" className="text-sm text-foreground font-medium">
              Requires photo proof
            </label>
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
              Recurring task
            </label>
          </div>

          {data.recurring && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Pattern</label>
              <select
                value={data.recurrence_pattern || ''}
                onChange={(e) => setData({ ...data, recurrence_pattern: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
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
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}