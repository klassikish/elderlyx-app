import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import BottomSheetSelect from '@/components/BottomSheetSelect';
import { toast } from 'sonner';

const taskTypes = [
  { value: 'grocery', label: 'Grocery Shopping' },
  { value: 'transport', label: 'Transportation' },
  { value: 'companionship', label: 'Companionship' },
  { value: 'household', label: 'Household Chores' },
  { value: 'medical_escort', label: 'Medical Escort' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'other', label: 'Other' },
];

export default function BookHelper() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedTask = urlParams.get('task') || '';
  const preselectedHelper = urlParams.get('helper') || '';

  const [form, setForm] = useState({
    task_type: preselectedTask,
    helper_id: preselectedHelper,
    scheduled_date: '',
    duration_minutes: 60,
    notes: '',
  });

  const { data: seniors = [] } = useQuery({
    queryKey: ['seniors'],
    queryFn: () => base44.entities.Senior.list(),
  });

  const { data: helpers = [] } = useQuery({
    queryKey: ['helpers'],
    queryFn: () => base44.entities.Helper.list(),
  });

  const senior = seniors[0];
  const availableHelpers = helpers.filter(h => h.available);

  const createVisit = useMutation({
    mutationFn: (data) => base44.entities.Visit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits-timeline'] });
      toast.success('Visit booked successfully!');
      navigate('/CareTimeline');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedHelper = helpers.find(h => h.id === form.helper_id);
    createVisit.mutate({
      ...form,
      senior_id: senior?.id || '',
      senior_name: senior?.full_name || '',
      helper_name: selectedHelper?.full_name || '',
      status: 'requested',
      cost: selectedHelper ? (selectedHelper.hourly_rate || 0) * (form.duration_minutes / 60) : 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Book a Visit"
        subtitle="Schedule help for your loved one"
        onBack={() => navigate(-1)}
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-4 pb-8">

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Type of Help</label>
            <BottomSheetSelect
              value={form.task_type}
              onChange={(v) => setForm({ ...form, task_type: v })}
              options={taskTypes.map(t => ({ value: t.value, label: t.label }))}
              placeholder="Select task type"
            />
          </div>

          {/* Helper */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Preferred Helper</label>
            <BottomSheetSelect
              value={form.helper_id}
              onChange={(v) => setForm({ ...form, helper_id: v })}
              options={availableHelpers.map(h => ({ value: h.id, label: `${h.full_name} — $${h.hourly_rate}/hr` }))}
              placeholder="Select a helper (optional)"
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Date & Time</label>
            <Input
              type="datetime-local"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="bg-card"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Duration (minutes)</label>
            <BottomSheetSelect
              value={String(form.duration_minutes)}
              onChange={(v) => setForm({ ...form, duration_minutes: parseInt(v) })}
              options={[
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '90', label: '1.5 hours' },
                { value: '120', label: '2 hours' },
                { value: '180', label: '3 hours' },
                { value: '240', label: '4 hours' },
              ]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Special Instructions</label>
            <Textarea
              placeholder="Any specific requests or instructions..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-card min-h-[80px]"
            />
          </div>

          {/* Cost Estimate */}
          {form.helper_id && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs text-muted-foreground">Estimated Cost</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                ${((helpers.find(h => h.id === form.helper_id)?.hourly_rate || 0) * (form.duration_minutes / 60)).toFixed(2)}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-sm font-semibold rounded-xl"
            disabled={!form.task_type || !form.scheduled_date || createVisit.isPending}
          >
            {createVisit.isPending ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}