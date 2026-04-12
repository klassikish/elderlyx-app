import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, MapPin, DollarSign, Star, ChevronDown, ChevronUp, Briefcase, TrendingUp, CalendarCheck, Zap } from 'lucide-react';
import HelperScoreCard, { calcEligibilityScore } from '@/components/helpers/HelperScoreCard';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const TASK_CONFIG = {
  grocery: { label: 'Grocery Shopping', color: 'bg-blue-100 text-blue-700' },
  transport: { label: 'Transportation', color: 'bg-purple-100 text-purple-700' },
  companionship: { label: 'Companionship', color: 'bg-pink-100 text-pink-700' },
  household: { label: 'Household Chores', color: 'bg-amber-100 text-amber-700' },
  medical_escort: { label: 'Medical Escort', color: 'bg-red-100 text-red-700' },
  cooking: { label: 'Cooking', color: 'bg-green-100 text-green-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

const MOOD_EMOJI = {
  happy: '😊', neutral: '😐', tired: '😴', anxious: '😟', confused: '😕',
};

const tabs = [
  { id: 'available', label: 'Available Jobs', icon: Zap },
  { id: 'active', label: 'My Jobs', icon: Briefcase },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
];

export default function HelperPortal() {
  const [activeTab, setActiveTab] = useState('available');
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  // Get all helpers so helper can "select" which one they are (demo mode)
  const { data: helpers = [] } = useQuery({
    queryKey: ['helpers'],
    queryFn: () => base44.entities.Helper.list(),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 50),
  });

  const [selectedHelperId, setSelectedHelperId] = useState(null);
  const currentHelper = helpers.find(h => h.id === selectedHelperId) || helpers[0];

  const acceptMutation = useMutation({
    mutationFn: ({ id, helperName, helperId }) =>
      base44.entities.Visit.update(id, { status: 'confirmed', helper_name: helperName, helper_id: helperId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-visits'] });
      toast.success('Job accepted! The family has been notified.');
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.Visit.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-visits'] });
      toast.success('Job declined.');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.Visit.update(id, { status: 'in_progress' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-visits'] });
      toast.success('Job started! Family has been notified.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, mood }) =>
      base44.entities.Visit.update(id, { status: 'completed', mood_observation: mood }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-visits'] });
      toast.success('Job completed! Great work.');
    },
  });

  const [completingId, setCompletingId] = useState(null);
  const [selectedMood, setSelectedMood] = useState('happy');

  // Available = requested with no helper assigned yet (or no helper_id)
  const availableJobs = visits.filter(v =>
    v.status === 'requested' && (!v.helper_id || !v.helper_name)
  );

  // My active jobs
  const myJobs = visits.filter(v =>
    currentHelper && (v.helper_name === currentHelper.full_name) &&
    ['confirmed', 'in_progress'].includes(v.status)
  );

  const myCompleted = visits.filter(v =>
    currentHelper && (v.helper_name === currentHelper.full_name) &&
    v.status === 'completed'
  );

  const totalEarned = myCompleted.reduce((acc, v) => acc + (v.cost || 0), 0);
  const thisMonthEarned = myCompleted
    .filter(v => new Date(v.scheduled_date).getMonth() === new Date().getMonth())
    .reduce((acc, v) => acc + (v.cost || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-blue-700 pt-14 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/70 text-xs font-medium">Helper Portal</p>
            <h1 className="text-primary-foreground text-xl font-bold mt-0.5">
              {currentHelper ? `Hi, ${currentHelper.full_name?.split(' ')[0]}!` : 'Gig Dashboard'}
            </h1>
          </div>
          {currentHelper && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5">
                <span className="text-xs text-white font-bold">Score: {calcEligibilityScore(currentHelper)}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white font-medium">Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Helper selector (demo) */}
        {helpers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {helpers.map(h => (
              <button
                key={h.id}
                onClick={() => setSelectedHelperId(h.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  (currentHelper?.id === h.id)
                    ? 'bg-white text-primary'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {h.full_name?.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats bar */}
      {currentHelper && (
        <div className="mx-5 -mt-3 bg-card rounded-2xl border border-border shadow-sm grid grid-cols-3 divide-x divide-border overflow-hidden">
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">${thisMonthEarned}</p>
            <p className="text-[10px] text-muted-foreground">This month</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-lg font-bold text-foreground">{myCompleted.length}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <p className="text-lg font-bold text-foreground">{currentHelper.rating?.toFixed(1) || '—'}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Your rating</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mx-5 mt-4 bg-secondary rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
            {id === 'available' && availableJobs.length > 0 && (
              <span className="w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {availableJobs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-4 pb-8 space-y-3">
        <AnimatePresence mode="wait">

          {/* AVAILABLE JOBS */}
          {activeTab === 'available' && (
            <motion.div key="available" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              {availableJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No open jobs right now</p>
                  <p className="text-sm text-muted-foreground mt-1">New gigs will appear here instantly</p>
                </div>
              ) : availableJobs.map((job, i) => {
                const task = TASK_CONFIG[job.task_type] || TASK_CONFIG.other;
                const isExpanded = expandedId === job.id;
                return (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <button className="w-full p-4 text-left" onClick={() => setExpandedId(isExpanded ? null : job.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${task.color}`}>{task.label}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">${job.cost || 0}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {job.scheduled_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            {format(parseISO(job.scheduled_date), 'EEE, MMM d · h:mm a')}
                          </span>
                        )}
                        {job.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> {job.duration_minutes} min
                          </span>
                        )}
                      </div>
                      {job.senior_name && (
                        <p className="text-xs text-muted-foreground mt-1">For: <span className="font-medium text-foreground">{job.senior_name}</span></p>
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                            {job.notes && (
                              <div className="bg-muted rounded-xl p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Special Instructions</p>
                                <p className="text-sm text-foreground">{job.notes}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 h-10 text-sm border-destructive/30 text-destructive hover:bg-destructive/5 rounded-xl"
                                onClick={() => declineMutation.mutate(job.id)}
                                disabled={declineMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1.5" /> Decline
                              </Button>
                              <Button
                                className="flex-1 h-10 text-sm rounded-xl"
                                onClick={() => currentHelper && acceptMutation.mutate({ id: job.id, helperName: currentHelper.full_name, helperId: currentHelper.id })}
                                disabled={acceptMutation.isPending || !currentHelper}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept Job
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* MY ACTIVE JOBS */}
          {activeTab === 'active' && (
            <motion.div key="active" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
              {myJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No active jobs</p>
                  <p className="text-sm text-muted-foreground mt-1">Accept jobs from the Available tab</p>
                </div>
              ) : myJobs.map((job, i) => {
                const task = TASK_CONFIG[job.task_type] || TASK_CONFIG.other;
                const isInProgress = job.status === 'in_progress';
                const isCompleting = completingId === job.id;
                return (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${isInProgress ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${task.color}`}>{task.label}</div>
                        <Badge variant="outline" className={isInProgress ? 'border-primary/30 text-primary bg-primary/5' : 'border-muted text-muted-foreground'}>
                          {isInProgress ? '● In Progress' : '✓ Confirmed'}
                        </Badge>
                      </div>
                      {job.scheduled_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {format(parseISO(job.scheduled_date), 'EEE, MMM d · h:mm a')}
                        </p>
                      )}
                      {job.senior_name && <p className="text-xs text-muted-foreground mt-1">Client: <span className="font-medium text-foreground">{job.senior_name}</span></p>}
                      {job.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg px-2.5 py-2">{job.notes}</p>}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-sm font-bold text-foreground">${job.cost}</span>
                        <div className="flex gap-2">
                          {!isInProgress && (
                            <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => startMutation.mutate(job.id)} disabled={startMutation.isPending}>
                              Start Job
                            </Button>
                          )}
                          {isInProgress && !isCompleting && (
                            <Button size="sm" className="h-8 text-xs rounded-lg bg-green-600 hover:bg-green-700" onClick={() => setCompletingId(job.id)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Complete flow — mood selection */}
                      <AnimatePresence>
                        {isCompleting && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-foreground mb-2">How was {job.senior_name?.split(' ')[0]}'s mood?</p>
                              <div className="flex gap-2 mb-3">
                                {Object.entries(MOOD_EMOJI).map(([mood, emoji]) => (
                                  <button key={mood} onClick={() => setSelectedMood(mood)}
                                    className={`flex-1 py-2 rounded-xl text-lg text-center border transition-all ${selectedMood === mood ? 'border-primary bg-primary/5' : 'border-border bg-secondary'}`}>
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setCompletingId(null)}>Cancel</Button>
                                <Button size="sm" className="flex-1 rounded-xl bg-green-600 hover:bg-green-700" onClick={() => { completeMutation.mutate({ id: job.id, mood: selectedMood }); setCompletingId(null); }}>
                                  Submit & Complete
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}

              {/* Recent completed */}
              {myCompleted.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Recently Completed</p>
                  <div className="space-y-2">
                    {myCompleted.slice(0, 3).map(job => {
                      const task = TASK_CONFIG[job.task_type] || TASK_CONFIG.other;
                      return (
                        <div key={job.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between opacity-70">
                          <div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${task.color}`}>{task.label}</span>
                            <p className="text-xs text-muted-foreground mt-1">{job.scheduled_date ? format(parseISO(job.scheduled_date), 'MMM d') : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">${job.cost}</p>
                            {job.mood_observation && <p className="text-xs">{MOOD_EMOJI[job.mood_observation]}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* EARNINGS */}
          {activeTab === 'earnings' && (
            <motion.div key="earnings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              {currentHelper && <HelperScoreCard helper={currentHelper} />}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl border border-border p-4">
                  <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-foreground">${thisMonthEarned}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">This month</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <DollarSign className="w-5 h-5 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">${totalEarned}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All time</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <CalendarCheck className="w-5 h-5 text-purple-500 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{myCompleted.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Jobs done</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <Star className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-2xl font-bold text-foreground">{currentHelper?.rating?.toFixed(1) || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg rating</p>
                </div>
              </div>

              {myCompleted.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Earnings History</p>
                  <div className="space-y-2">
                    {myCompleted.map(job => {
                      const task = TASK_CONFIG[job.task_type] || TASK_CONFIG.other;
                      return (
                        <div key={job.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${task.color}`}>
                              {task.label[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{task.label}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {job.scheduled_date ? format(parseISO(job.scheduled_date), 'MMM d, yyyy') : ''}
                                {job.duration_minutes ? ` · ${job.duration_minutes} min` : ''}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-foreground">+${job.cost}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}