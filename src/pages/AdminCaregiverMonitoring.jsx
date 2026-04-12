import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, AlertTriangle, MapPin, DollarSign, Ban, Trash2,
  ShieldAlert, MessageSquare, RefreshCw, CheckCircle2, XCircle,
  Plus, Minus, Eye, ChevronDown, ChevronUp, Loader2, Snowflake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'bg-green-100 text-green-700' },
  warned:    { label: 'Warned',    color: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
  removed:   { label: 'Removed',   color: 'bg-slate-100 text-slate-500' },
};

function avgRating(reviews) {
  if (!reviews.length) return null;
  return (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);
}

// ── Per-caregiver detail panel ────────────────────────────────────────────────
function CaregiverDetailPanel({ user, bookings, reviews, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(user.admin_note || '');
  const [freezeReason, setFreezeReason] = useState('');

  const userReviews = reviews.filter(r => r.caregiver_id === user.id);
  const userBookings = bookings.filter(b => b.caregiver_id === user.id);
  const completed = userBookings.filter(b => b.status === 'completed').length;
  const cancelled = userBookings.filter(b => b.status === 'cancelled').length;
  const complaints = userReviews.filter(r => r.rating <= 2).length;
  const avg = avgRating(userReviews);
  const lowRating = avg && parseFloat(avg) < 4.5;
  const hasIssues = cancelled > 2 || complaints > 1 || (user.warning_count || 0) > 0;
  const status = user.caregiver_status || 'active';

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden ${
      status === 'suspended' ? 'border-red-300' :
      status === 'warned' ? 'border-amber-300' :
      (lowRating || hasIssues) ? 'border-orange-200' : 'border-border'
    }`}>
      {/* Summary row */}
      <button className="w-full p-4 flex items-center gap-3 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.photo_url
            ? <img src={user.photo_url} className="w-full h-full object-cover" alt="" />
            : <span className="font-bold text-muted-foreground text-lg">{(user.full_name || '?')[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-sm">{user.full_name}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[status]?.color || 'bg-muted'}`}>
              {STATUS_CONFIG[status]?.label}
            </span>
            {user.pay_frozen && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">PAY FROZEN</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className={`flex items-center gap-0.5 font-bold ${lowRating ? 'text-red-600' : 'text-amber-500'}`}>
              <Star className="w-3 h-3 fill-current" /> {avg || '—'}
            </span>
            <span>✅ {completed} jobs</span>
            <span>❌ {cancelled} cancel</span>
            <span>🚩 {complaints} complaints</span>
          </div>
        </div>
        {(lowRating || hasIssues) && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
            <div className="p-4 space-y-4">

              {/* Metric cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Rating', value: avg || '—', alert: lowRating },
                  { label: 'Completed', value: completed },
                  { label: 'Cancelled', value: cancelled, alert: cancelled > 2 },
                  { label: 'Complaints', value: complaints, alert: complaints > 1 },
                ].map(({ label, value, alert }) => (
                  <div key={label} className={`rounded-xl p-2.5 text-center ${alert ? 'bg-red-50 border border-red-200' : 'bg-muted'}`}>
                    <p className={`text-sm font-black ${alert ? 'text-red-600' : 'text-foreground'}`}>{value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Alerts summary */}
              {(lowRating || cancelled > 2 || complaints > 1) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Performance Alerts</p>
                  {lowRating && <p className="text-xs text-amber-700">• Rating {avg} is below 4.5 threshold</p>}
                  {cancelled > 2 && <p className="text-xs text-amber-700">• {cancelled} cancellations recorded</p>}
                  {complaints > 1 && <p className="text-xs text-amber-700">• {complaints} low-rating complaints</p>}
                </div>
              )}

              {/* Recent reviews */}
              {userReviews.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Recent Reviews</p>
                  <div className="space-y-2">
                    {userReviews.slice(0, 3).map(r => (
                      <div key={r.id} className={`rounded-xl p-2.5 text-xs ${r.rating <= 2 ? 'bg-red-50 border border-red-100' : 'bg-muted'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />)}
                          <span className="text-muted-foreground ml-1">{r.reviewer_name}</span>
                        </div>
                        {r.comment && <p className="text-muted-foreground italic">"{r.comment}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active bookings — add/remove gig */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Active Bookings</p>
                {userBookings.filter(b => ['pending','confirmed','in_progress'].includes(b.status)).length === 0
                  ? <p className="text-xs text-muted-foreground">No active bookings</p>
                  : userBookings.filter(b => ['pending','confirmed','in_progress'].includes(b.status)).map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2 mb-1.5">
                      <div>
                        <p className="text-xs font-semibold capitalize">{b.service_type} — {b.senior_name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.status}</p>
                      </div>
                      <button
                        onClick={() => onAction(user, 'remove_from_gig', b.id)}
                        className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                }
              </div>

              {/* Admin note */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">Internal Note</p>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add internal note..." className="resize-none h-14 rounded-xl text-xs" />
                <button onClick={() => onAction(user, 'save_note', null, note)} className="text-xs text-primary font-semibold mt-1">Save note</button>
              </div>

              {/* Pay freeze */}
              {!user.pay_frozen ? (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">Freeze Pay</p>
                  <Textarea value={freezeReason} onChange={e => setFreezeReason(e.target.value)} placeholder="Reason for pay freeze..." className="resize-none h-14 rounded-xl text-xs mb-2" />
                  <Button size="sm" variant="outline" className="w-full rounded-xl border-blue-300 text-blue-700 h-9"
                    onClick={() => { onAction(user, 'freeze_pay', null, freezeReason); setFreezeReason(''); }}>
                    <Snowflake className="w-3.5 h-3.5 mr-1.5" /> Freeze Pay
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <Snowflake className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-800">Pay Frozen</p>
                    {user.pay_freeze_reason && <p className="text-[10px] text-blue-600">{user.pay_freeze_reason}</p>}
                  </div>
                  <button onClick={() => onAction(user, 'unfreeze_pay')} className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg">Unfreeze</button>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" className="rounded-xl h-9 border-amber-300 text-amber-700 text-xs"
                  onClick={() => onAction(user, 'warn')}>
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Warn
                </Button>
                {status !== 'suspended' ? (
                  <Button size="sm" variant="outline" className="rounded-xl h-9 border-red-300 text-red-600 text-xs"
                    onClick={() => onAction(user, 'suspend')}>
                    <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-xl h-9 border-green-300 text-green-600 text-xs"
                    onClick={() => onAction(user, 'reinstate')}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reinstate
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-xl h-9 border-red-400 text-red-700 text-xs"
                  onClick={() => { if (window.confirm('Remove this caregiver from the platform?')) onAction(user, 'remove'); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── GPS Map ───────────────────────────────────────────────────────────────────
function LiveGPSMap({ caregivers }) {
  const online = caregivers.filter(u => u.location_lat && u.location_lng && u.caregiver_available);
  const center = online.length ? [online[0].location_lat, online[0].location_lng] : [40.7128, -74.006];

  if (online.length === 0) {
    return (
      <div className="h-48 bg-muted rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No caregivers currently online</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden h-64 border border-border">
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {online.map(u => (
          <Marker key={u.id} position={[u.location_lat, u.location_lng]}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{u.full_name}</p>
                <p className="text-muted-foreground">⭐ {u.rating?.toFixed(1) || '—'}</p>
                {u.location_updated_at && (
                  <p className="text-muted-foreground">Last seen: {formatDistanceToNow(new Date(u.location_updated_at), { addSuffix: true })}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCaregiverMonitoring() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('monitor');
  const [filter, setFilter] = useState('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['monitor-users'],
    queryFn: () => base44.entities.User.list(),
    refetchInterval: 30000, // refresh every 30s for GPS
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['monitor-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['monitor-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 500),
  });

  const caregivers = users.filter(u => u.role === 'caregiver' && u.caregiver_approved && u.caregiver_status !== 'removed');

  // Auto-compute performance alerts
  const flagged = caregivers.filter(u => {
    const ur = reviews.filter(r => r.caregiver_id === u.id);
    const ub = bookings.filter(b => b.caregiver_id === u.id);
    const avg = ur.length ? ur.reduce((s, r) => s + r.rating, 0) / ur.length : null;
    const cancelled = ub.filter(b => b.status === 'cancelled').length;
    const complaints = ur.filter(r => r.rating <= 2).length;
    return (avg && avg < 4.5) || cancelled > 2 || complaints > 1;
  });

  const filtered = filter === 'flagged' ? flagged
    : filter === 'suspended' ? caregivers.filter(u => u.caregiver_status === 'suspended')
    : filter === 'pay_frozen' ? caregivers.filter(u => u.pay_frozen)
    : caregivers;

  const handleAction = async (user, action, bookingId = null, extraData = '') => {
    const updates = {};
    let notifTitle = '', notifBody = '';

    switch (action) {
      case 'warn':
        updates.caregiver_status = 'warned';
        updates.warning_count = (user.warning_count || 0) + 1;
        notifTitle = '⚠️ Official Warning';
        notifBody = 'You have received an official warning from Elderlyx due to performance concerns. Please review our standards.';
        break;
      case 'suspend':
        updates.caregiver_status = 'suspended';
        updates.caregiver_available = false;
        notifTitle = '🚫 Account Suspended';
        notifBody = 'Your caregiver account has been suspended. Please contact support for more information.';
        break;
      case 'reinstate':
        updates.caregiver_status = 'active';
        notifTitle = '✅ Account Reinstated';
        notifBody = 'Your caregiver account has been reinstated. You may now accept jobs again.';
        break;
      case 'remove':
        updates.caregiver_status = 'removed';
        updates.caregiver_available = false;
        notifTitle = 'Account Removed';
        notifBody = 'Your caregiver account has been removed from the Elderlyx platform.';
        break;
      case 'freeze_pay':
        updates.pay_frozen = true;
        updates.pay_freeze_reason = extraData;
        notifTitle = '❄️ Pay Frozen';
        notifBody = `Your payouts have been temporarily frozen. Reason: ${extraData || 'Under review.'}`;
        break;
      case 'unfreeze_pay':
        updates.pay_frozen = false;
        updates.pay_freeze_reason = '';
        notifTitle = '✅ Pay Unfrozen';
        notifBody = 'Your payouts have been unfrozen and will resume on the next payout cycle.';
        break;
      case 'save_note':
        updates.admin_note = extraData;
        toast.success('Note saved');
        await base44.entities.User.update(user.id, updates);
        qc.invalidateQueries({ queryKey: ['monitor-users'] });
        return;
      case 'remove_from_gig':
        await base44.entities.Booking.update(bookingId, { caregiver_id: null, caregiver_name: null, status: 'pending' });
        toast.success('Caregiver removed from booking');
        qc.invalidateQueries({ queryKey: ['monitor-bookings'] });
        return;
    }

    if (Object.keys(updates).length) {
      await base44.entities.User.update(user.id, updates);
    }
    if (notifTitle) {
      await base44.entities.Notification.create({ user_email: user.email, title: notifTitle, body: notifBody, type: 'general' });
    }
    toast.success(`Action applied: ${action}`);
    qc.invalidateQueries({ queryKey: ['monitor-users'] });
  };

  const TABS = [
    { id: 'monitor', label: 'Monitor' },
    { id: 'map', label: '🗺 Live GPS' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-bold text-foreground">Caregiver Monitoring</h1>
          <p className="text-xs text-muted-foreground">{caregivers.length} active · {flagged.length} flagged</p>
        </div>
        {flagged.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> {flagged.length} issues
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 pt-4 pb-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === t.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 pb-10 space-y-3 mt-2">
        {tab === 'map' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Showing caregivers currently marked as available. Refreshes every 30s.</p>
            <LiveGPSMap caregivers={caregivers} />
            <div className="space-y-2">
              {caregivers.filter(u => u.location_lat && u.caregiver_available).map(u => (
                <div key={u.id} className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-sm font-semibold text-foreground flex-1">{u.full_name}</p>
                  {u.location_updated_at && (
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(u.location_updated_at), { addSuffix: true })}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'monitor' && (
          <>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'all', label: `All (${caregivers.length})` },
                { id: 'flagged', label: `⚠️ Flagged (${flagged.length})`, highlight: flagged.length > 0 },
                { id: 'suspended', label: `Suspended (${caregivers.filter(u => u.caregiver_status === 'suspended').length})` },
                { id: 'pay_frozen', label: `Pay Frozen (${caregivers.filter(u => u.pay_frozen).length})` },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === f.id ? 'bg-primary text-white' :
                    f.highlight ? 'bg-red-100 text-red-700' : 'bg-secondary text-muted-foreground'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {isLoading && [1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}

            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
                <p className="font-semibold text-foreground">No caregivers in this category</p>
              </div>
            )}

            {filtered.map(user => (
              <CaregiverDetailPanel
                key={user.id}
                user={user}
                bookings={bookings}
                reviews={reviews}
                onAction={handleAction}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}