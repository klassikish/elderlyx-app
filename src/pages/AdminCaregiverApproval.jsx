import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, MessageSquare, Star, AlertTriangle,
  ShieldCheck, Video, FileText, ChevronDown, ChevronUp, Loader2,
  Users, Clock, Flag, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

// ── Scoring helpers ────────────────────────────────────────────────────────────
function computeScore(user) {
  let score = 0;
  if (user.background_check_clear) score += 30;
  if (user.video_score) score += Math.round((user.video_score / 10) * 25);  // 0–25
  if (user.quiz_score) score += Math.round((user.quiz_score / 100) * 20);   // 0–20
  if (user.experience_years) score += Math.min(user.experience_years * 2, 10); // 0–10
  if (user.fast_onboarding) score += 10;
  if (user.good_answers) score += 5;
  return Math.min(score, 100);
}

function getRiskFlags(user) {
  const flags = [];
  if (!user.background_check_clear) flags.push({ label: 'Background check pending', level: 'high' });
  if (!user.video_score) flags.push({ label: 'No video interview score', level: 'medium' });
  if (user.quiz_score !== undefined && user.quiz_score < 60) flags.push({ label: `Low quiz score (${user.quiz_score}%)`, level: 'high' });
  if (user.experience_years < 1) flags.push({ label: 'Less than 1 year experience', level: 'low' });
  if (!user.good_answers) flags.push({ label: 'Answer quality review pending', level: 'medium' });
  return flags;
}

const FLAG_COLORS = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-600' };

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl font-black text-lg ${color}`}>
      {score}
      <span className="text-[9px] font-semibold opacity-70">/ 100</span>
    </div>
  );
}

// ── Applicant Card ────────────────────────────────────────────────────────────
function ApplicantCard({ user, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');
  const score = computeScore(user);
  const flags = getRiskFlags(user);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.photo_url
            ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            : <span className="font-bold text-muted-foreground text-lg">{(user.full_name || '?')[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">{user.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {flags.slice(0, 2).map(f => (
              <span key={f.label} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${FLAG_COLORS[f.level]}`}>{f.label}</span>
            ))}
            {flags.length > 2 && <span className="text-[9px] text-muted-foreground">+{flags.length - 2} more</span>}
          </div>
        </div>
        <ScoreBadge score={score} />
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Score breakdown */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Score Breakdown</p>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Background Check', val: user.background_check_clear ? 30 : 0, max: 30 },
                    { label: 'Video Interview', val: user.video_score ? Math.round((user.video_score / 10) * 25) : 0, max: 25 },
                    { label: 'Quiz Score', val: user.quiz_score ? Math.round((user.quiz_score / 100) * 20) : 0, max: 20 },
                    { label: 'Experience', val: Math.min((user.experience_years || 0) * 2, 10), max: 10 },
                    { label: 'Fast Onboarding', val: user.fast_onboarding ? 10 : 0, max: 10 },
                    { label: 'Answer Quality', val: user.good_answers ? 5 : 0, max: 5 },
                  ].map(({ label, val, max }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-32 text-muted-foreground">{label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(val / max) * 100}%` }} />
                      </div>
                      <span className="w-10 text-right font-semibold text-foreground">{val}/{max}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk flags */}
              {flags.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Flag className="w-3 h-3" /> Risk Flags
                  </p>
                  <div className="space-y-1">
                    {flags.map(f => (
                      <div key={f.label} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl ${FLAG_COLORS[f.level]}`}>
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {f.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents & Video */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Profile Details
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Experience', value: `${user.experience_years || 0} yrs` },
                    { label: 'Quiz Score', value: user.quiz_score !== undefined ? `${user.quiz_score}%` : 'N/A' },
                    { label: 'Video Score', value: user.video_score !== undefined ? `${user.video_score}/10` : 'N/A' },
                    { label: 'Background', value: user.background_check_clear ? '✅ Clear' : '⏳ Pending' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted rounded-xl px-3 py-2">
                      <p className="text-muted-foreground text-[10px]">{label}</p>
                      <p className="font-semibold text-foreground mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video review link */}
              {user.video_intro_url && (
                <a href={user.video_intro_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-purple-700">
                  <Video className="w-4 h-4" /> Watch Video Introduction
                </a>
              )}

              {/* Admin note for request info */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">Admin note (for "Request Info")</p>
                <Textarea
                  placeholder="What info do you need from the caregiver?"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="resize-none h-16 rounded-xl text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 h-10"
                  onClick={() => onAction(user.id, 'approve', note)}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl border-amber-300 text-amber-700 h-10"
                  onClick={() => onAction(user.id, 'request_info', note)}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Request Info
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl border-red-300 text-red-600 h-10"
                  onClick={() => onAction(user.id, 'reject', note)}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Active Caregiver Card ────────────────────────────────────────────────────
function ActiveCaregiverCard({ user, reviews }) {
  const userReviews = reviews.filter(r => r.caregiver_id === user.id);
  const avgRating = userReviews.length ? (userReviews.reduce((s, r) => s + (r.rating || 0), 0) / userReviews.length).toFixed(1) : null;
  const lowRating = avgRating && parseFloat(avgRating) < 3.5;
  const recentComplaints = userReviews.filter(r => r.rating <= 2).length;

  return (
    <div className={`bg-card border rounded-2xl p-4 ${lowRating || recentComplaints > 0 ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.photo_url
            ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            : <span className="font-bold text-muted-foreground">{(user.full_name || '?')[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{user.full_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {avgRating ? (
              <span className={`flex items-center gap-0.5 text-xs font-bold ${lowRating ? 'text-red-600' : 'text-amber-500'}`}>
                <Star className="w-3 h-3 fill-current" /> {avgRating}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews yet</span>
            )}
            <span className="text-xs text-muted-foreground">· {userReviews.length} reviews</span>
            {user.caregiver_available
              ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Available</span>
              : <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-semibold">Offline</span>}
          </div>
        </div>
        {(lowRating || recentComplaints > 0) && (
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {recentComplaints > 0 && <span className="text-[9px] text-red-600 font-bold">{recentComplaints} complaints</span>}
          </div>
        )}
      </div>
      {lowRating && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-700 bg-red-100 rounded-xl px-3 py-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Rating below threshold — review recommended
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminCaregiverApproval() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['admin-all-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 200),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 50),
  });

  const pending = users.filter(u => u.role === 'caregiver' && !u.caregiver_approved && u.onboarding_complete);
  const active = users.filter(u => u.role === 'caregiver' && u.caregiver_approved);

  // Caregivers with low ratings
  const lowRatingCaregivers = active.filter(u => {
    const ur = reviews.filter(r => r.caregiver_id === u.id);
    if (!ur.length) return false;
    const avg = ur.reduce((s, r) => s + (r.rating || 0), 0) / ur.length;
    return avg < 3.5;
  });

  const caregiverAlerts = alerts.filter(a => a.category === 'safety' || a.title?.includes('Abuse') || a.title?.includes('Complaint'));
  const unreadAlerts = caregiverAlerts.filter(a => !a.is_read);

  const handleAction = async (userId, action, note) => {
    setActionLoading(userId);
    const user = users.find(u => u.id === userId);

    if (action === 'approve') {
      await base44.asServiceRole?.entities?.User?.update?.(userId, { caregiver_approved: true })
        .catch(() => base44.entities.User.update(userId, { caregiver_approved: true }));
      // Send approval notification
      await base44.entities.Notification.create({
        user_email: user.email,
        title: '🎉 Application Approved!',
        body: 'Congratulations! Your caregiver application has been approved. You can now start accepting jobs.',
        type: 'general',
      });
      toast.success(`${user.full_name} approved!`);
    } else if (action === 'reject') {
      await base44.entities.Notification.create({
        user_email: user.email,
        title: 'Application Update',
        body: note ? `Your application was not approved: ${note}` : 'Your application was not approved at this time.',
        type: 'general',
      });
      toast.success('Rejection notice sent.');
    } else if (action === 'request_info') {
      await base44.entities.Notification.create({
        user_email: user.email,
        title: '📋 Additional Information Needed',
        body: note || 'Please provide additional information to complete your application review.',
        type: 'general',
      });
      toast.success('Info request sent to caregiver.');
    }

    qc.invalidateQueries({ queryKey: ['admin-all-users'] });
    setActionLoading(null);
  };

  const markAlertRead = useMutation({
    mutationFn: (id) => base44.entities.Alert.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-alerts'] }),
  });

  const TABS = [
    { id: 'pending', label: 'Pending', count: pending.length },
    { id: 'active', label: 'Active', count: active.length },
    { id: 'alerts', label: 'Alerts', count: unreadAlerts.length, highlight: unreadAlerts.length > 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-bold text-foreground">Caregiver Management</h1>
          <p className="text-xs text-muted-foreground">Applications · Active monitoring · Alerts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 pt-4 pb-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/20' : t.highlight ? 'bg-red-500 text-white' : 'bg-muted-foreground/20'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 pb-10 space-y-3 mt-2">

        {/* ── Pending Applications ─────────────────── */}
        {tab === 'pending' && (
          <>
            {loadingUsers && [1,2].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
            {!loadingUsers && pending.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <ShieldCheck className="w-12 h-12 text-green-400 mb-3" />
                <p className="font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No pending caregiver applications</p>
              </div>
            )}
            {pending.map(user => (
              <ApplicantCard key={user.id} user={user} onAction={handleAction} />
            ))}
          </>
        )}

        {/* ── Active Caregivers ─────────────────────── */}
        {tab === 'active' && (
          <>
            {lowRatingCaregivers.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-semibold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {lowRatingCaregivers.length} caregiver{lowRatingCaregivers.length > 1 ? 's' : ''} with rating below 3.5★
              </div>
            )}
            {active.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No active caregivers yet</p>
              </div>
            )}
            {/* Sort low-rated first */}
            {[...active]
              .sort((a, b) => {
                const avgA = reviews.filter(r => r.caregiver_id === a.id);
                const avgB = reviews.filter(r => r.caregiver_id === b.id);
                const rA = avgA.length ? avgA.reduce((s, r) => s + r.rating, 0) / avgA.length : 5;
                const rB = avgB.length ? avgB.reduce((s, r) => s + r.rating, 0) / avgB.length : 5;
                return rA - rB;
              })
              .map(user => (
                <ActiveCaregiverCard key={user.id} user={user} reviews={reviews} />
              ))}
          </>
        )}

        {/* ── Alerts ───────────────────────────────── */}
        {tab === 'alerts' && (
          <>
            {caregiverAlerts.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <ShieldCheck className="w-12 h-12 text-green-400 mb-3" />
                <p className="font-semibold text-foreground">No alerts</p>
                <p className="text-xs text-muted-foreground mt-1">All clear on caregiver activity</p>
              </div>
            )}
            {caregiverAlerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-card border rounded-2xl p-4 ${!alert.is_read ? 'border-red-200 bg-red-50/30' : 'border-border opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {!alert.is_read && (
                    <button
                      onClick={() => markAlertRead.mutate(alert.id)}
                      className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg flex-shrink-0"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}