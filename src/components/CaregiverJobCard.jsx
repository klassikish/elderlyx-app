import { motion } from 'framer-motion';
import { MapPin, Clock, Calendar, Heart, Car, Zap, ChevronRight, X, Package, RefreshCw, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const EFFORT = {
  companionship: { label: 'Easy', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  transportation: { label: 'Moderate', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

const TASK_META = {
  companionship: { icon: Heart, color: 'bg-pink-100 text-pink-600', label: 'Companionship Visit' },
  transportation: { icon: Car, color: 'bg-blue-100 text-blue-600', label: 'Transportation' },
};

export default function CaregiverJobCard({ booking, onAccept, onDecline, loading }) {
  const task = TASK_META[booking.service_type] || TASK_META.companionship;
  const effort = EFFORT[booking.service_type] || EFFORT.companionship;
  const TaskIcon = task.icon;
  const pay = booking.price || 35;
  const distance = booking.distance_miles ?? '~2.4';
  const date = new Date(booking.scheduled_date);

  const isPackJob = booking.service_type === 'companionship';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onDecline}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-card w-full max-w-md mx-auto rounded-t-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* Pay hero */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium mb-0.5">You'll earn</p>
              <p className="text-white text-5xl font-black tracking-tight">${pay}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                <p className="text-emerald-100 text-xs font-medium">Prepaid visit · no payment issues</p>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <TaskIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          {isPackJob && (
            <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-100" />
              <p className="text-emerald-100 text-xs font-semibold">From Care Pack · Reliable repeat client</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-3">

          {/* Task type + effort */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${task.color}`}>
                <TaskIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{task.label}</p>
                <p className="text-xs text-muted-foreground">{booking.senior_name}</p>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${effort.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${effort.dot}`} />
              {effort.label}
            </span>
          </div>

          <div className="h-px bg-border" />

          {/* Date / Time / Distance row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Calendar, label: 'Date', value: format(date, 'MMM d') },
              { icon: Clock, label: 'Time', value: format(date, 'h:mm a') },
              { icon: MapPin, label: 'Distance', value: `${distance} mi` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Address */}
          {(booking.address || booking.pickup_address) && (
            <div className="flex items-start gap-2.5 bg-muted rounded-xl px-3 py-2.5">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{booking.address || booking.pickup_address}</p>
            </div>
          )}

          {/* Care pack context */}
          {isPackJob && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-xs font-semibold text-blue-800">Part of ongoing care plan</p>
              </div>
              <p className="text-xs text-blue-700">Client receives regular visits · consistent schedule</p>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Note from family</p>
              <p className="text-sm text-amber-800">{booking.notes}</p>
            </div>
          )}

          {/* Duration */}
          {booking.duration_hours && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>{booking.duration_hours}h visit · ${(pay / booking.duration_hours).toFixed(0)}/hr</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 pt-2 flex gap-3">
          <button
            onClick={onDecline}
            disabled={loading}
            className="w-14 h-14 rounded-2xl border-2 border-border flex items-center justify-center flex-shrink-0 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>Accept Visit <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}