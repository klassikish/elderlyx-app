import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Camera, AlertTriangle, Smile, Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ENTRY_TYPES = {
  note: { icon: Heart, label: 'Note', color: 'bg-blue-100 text-blue-600' },
  photo: { icon: Camera, label: 'Photo', color: 'bg-green-100 text-green-600' },
  safety_log: { icon: AlertTriangle, label: 'Safety Log', color: 'bg-orange-100 text-orange-600' },
  mood_check: { icon: Smile, label: 'Mood Check', color: 'bg-purple-100 text-purple-600' },
};

export default function ActivityFeed({ bookingId, canEdit = false, booking = {} }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('note');
  const [formData, setFormData] = useState({ title: '', content: '', mood: '', photos: [] });
  const [uploading, setUploading] = useState(false);

  // Fetch activity logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['activity-logs', bookingId],
    queryFn: () =>
      base44.entities.ActivityLog.filter(
        { booking_id: bookingId },
        '-created_date',
        50
      ),
    enabled: !!bookingId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.ActivityLog.subscribe((event) => {
      if (event.data?.booking_id === bookingId) {
        refetch();
      }
    });
    return unsubscribe;
  }, [bookingId, refetch]);

  // Create activity log
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        booking_id: bookingId,
        entry_type: formType,
        caregiver_id: user?.id,
        caregiver_name: user?.full_name,
        senior_name: booking.senior_name,
        family_email: booking.family_email,
        title: formData.title,
        content: formData.content,
        visibility: 'family',
      };

      if (formType === 'mood_check') {
        payload.mood = formData.mood;
      } else if (formType === 'safety_log') {
        payload.safety_data = {
          fall_risk: formData.fall_risk || false,
          medication_taken: formData.medication_taken || false,
          vital_signs: formData.vital_signs || '',
          concerns: formData.concerns || [],
        };
      }

      if (formData.photos.length > 0) {
        payload.photo_urls = formData.photos;
      }

      return base44.entities.ActivityLog.create(payload);
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['activity-logs', bookingId] });
      const prev = qc.getQueryData(['activity-logs', bookingId]) || [];
      const optimisticLog = {
        id: `optimistic-${Date.now()}`,
        booking_id: bookingId,
        entry_type: formType,
        title: formData.title,
        content: formData.content,
        mood: formData.mood,
        caregiver_name: user?.full_name,
        created_date: new Date().toISOString(),
        photo_urls: formData.photos,
      };
      qc.setQueryData(['activity-logs', bookingId], [optimisticLog, ...prev]);
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-logs', bookingId] });
      setFormData({ title: '', content: '', mood: '', photos: [] });
      setShowForm(false);
      toast.success('Activity logged!');
    },
    onError: (e, _, ctx) => {
      if (ctx?.prev) qc.setQueryData(['activity-logs', bookingId], ctx.prev);
      toast.error(e?.message || 'Failed to log activity');
    },
  });

  // Upload photo
  const handlePhotoUpload = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setFormData(p => ({ ...p, photos: [...p.photos, res.file_url] }));
      toast.success('Photo uploaded!');
    } catch (e) {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">Activity Feed</h3>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg gap-1"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-3.5 h-3.5" /> Log Activity
          </Button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && canEdit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-2xl border border-border p-4 space-y-3"
          >
            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(ENTRY_TYPES).map(([type, { icon: Icon, label }]) => (
                <button
                  key={type}
                  onClick={() => {
                    setFormType(type);
                    setFormData(p => ({ ...p, title: '', content: '', mood: '' }));
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    formType === type
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Title field */}
            <input
              type="text"
              placeholder="Title (optional)"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder-muted-foreground"
            />

            {/* Content based on type */}
            {(formType === 'note' || formType === 'safety_log') && (
              <textarea
                placeholder={formType === 'note' ? 'Write your note...' : 'Log safety observations...'}
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder-muted-foreground resize-none h-24"
              />
            )}

            {formType === 'mood_check' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Senior's Mood</p>
                <div className="flex gap-2 flex-wrap">
                  {['great', 'good', 'neutral', 'tired', 'unwell'].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setFormData(p => ({ ...p, mood }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        formData.mood === mood
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground hover:bg-border'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formType === 'safety_log' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fall_risk || false}
                    onChange={e => setFormData(p => ({ ...p, fall_risk: e.target.checked }))}
                  />
                  Fall risk observed
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.medication_taken || false}
                    onChange={e => setFormData(p => ({ ...p, medication_taken: e.target.checked }))}
                  />
                  Medication taken
                </label>
              </div>
            )}

            {/* Photo upload */}
            {formType === 'photo' && (
              <div className="space-y-2">
                <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-all">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Click to upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>

                {/* Photo previews */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.photos.map((url, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden">
                        <img src={url} alt="Preview" className="w-full h-24 object-cover" />
                        <button
                          onClick={() => setFormData(p => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 h-10 rounded-lg font-bold"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || uploading || (!formData.content && formType !== 'mood_check')}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Activity'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity list */}
      <div className="space-y-3">
        {isLoading && <div className="text-center py-6 text-muted-foreground text-sm">Loading activities…</div>}

        {!isLoading && logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No activities logged yet
          </div>
        )}

        {logs.map((log, i) => {
          const typeInfo = ENTRY_TYPES[log.entry_type];
          const Icon = typeInfo.icon;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {log.title && <p className="font-semibold text-foreground text-sm">{log.title}</p>}
                      <p className="text-xs text-muted-foreground">
                        {typeInfo.label} by {log.caregiver_name}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Content */}
                  {log.content && <p className="text-sm text-foreground mt-2">{log.content}</p>}

                  {/* Mood indicator */}
                  {log.mood && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-purple-50 rounded-lg w-fit">
                      <Smile className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700 capitalize">{log.mood}</span>
                    </div>
                  )}

                  {/* Safety data */}
                  {log.safety_data && (
                    <div className="mt-2 space-y-1 text-xs">
                      {log.safety_data.fall_risk && (
                        <div className="flex items-center gap-1 text-orange-600 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Fall risk noted
                        </div>
                      )}
                      {log.safety_data.medication_taken && (
                        <div className="text-green-600 font-semibold">✓ Medication taken</div>
                      )}
                      {log.safety_data.vital_signs && (
                        <p className="text-muted-foreground">{log.safety_data.vital_signs}</p>
                      )}
                    </div>
                  )}

                  {/* Photos */}
                  {log.photo_urls?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {log.photo_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Activity ${idx}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}