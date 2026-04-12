import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import TaskForm from '@/components/tasks/TaskForm.jsx';
import TaskList from '@/components/tasks/TaskList.jsx';
import TaskDetailModal from '@/components/tasks/TaskDetailModal.jsx';

export default function FamilyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('all');

  const { data: groups = [] } = useQuery({
    queryKey: ['family-groups', user?.email],
    queryFn: () =>
      base44.entities.FamilyGroup.filter(
        { primary_owner_email: user?.email },
        '-created_date',
        10
      ),
    enabled: !!user?.email,
  });

  const selectedGroup = groups[0];

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', selectedGroup?.id],
    queryFn: () =>
      base44.entities.FamilyMember.filter(
        { primary_account_email: user?.email },
        '-created_date',
        50
      ),
    enabled: !!selectedGroup?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['family-tasks', selectedGroup?.id],
    queryFn: () =>
      base44.entities.Task.filter(
        { family_group_id: selectedGroup?.id },
        '-due_date',
        100
      ),
    enabled: !!selectedGroup?.id,
  });

  const pending = tasks.filter((t) => ['pending', 'overdue'].includes(t.status)).length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  const handleTaskClick = (task) => {
    if (task.action === 'toggle') {
      // Toggle completion
      return;
    }
    setSelectedTask(task);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">Care Tasks</h1>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <p className="text-[10px] font-bold text-blue-600 uppercase">Pending</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <p className="text-[10px] font-bold text-green-600 uppercase">Completed</p>
            <p className="text-2xl font-black text-green-700 mt-1">{completed}</p>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Task List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TaskList tasks={tasks} onTaskClick={handleTaskClick} filter={filter} />
        </motion.div>
      </div>

      {/* Modals */}
      {showForm && selectedGroup && (
        <TaskForm
          group={selectedGroup}
          members={members}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}