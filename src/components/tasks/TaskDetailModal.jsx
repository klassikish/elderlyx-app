import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { X, Loader2, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TaskDetailModal({ task, onClose }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notes, setNotes] = useState(task.completion_notes || '');
  const [photoUrls, setPhotoUrls] = useState(task.photo_urls || []);
  const [uploading, setUploading] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () =>
      base44.entities.Task.update(task.id, {
        status: 'completed',
        completion_notes: notes,
        photo_urls: photoUrls,
        completed_at: new Date().toISOString(),
        completed_by_email: user?.email,
        completed_by_name: user?.full_name,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family-tasks'] });
      toast.success('Task completed!');
      onClose?.();
    },
  });

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrls([...photoUrls, res.file_url]);
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const canComplete = !task.requires_photo || photoUrls.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-background rounded-t-3xl w-full max-w-md mx-auto p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            {task.description && (
              <p className="text-sm text-foreground">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-muted-foreground">
                📅 Due: {format(new Date(task.due_date), 'MMM d, h:mm a')}
              </p>
            )}
            {task.assigned_by_name && (
              <p className="text-xs text-muted-foreground">
                Assigned by: {task.assigned_by_name}
              </p>
            )}
          </div>

          {/* Completion Section */}
          {task.status !== 'completed' && (
            <div className="space-y-3 border-t border-border pt-4">
              {/* Photo Upload */}
              {task.requires_photo && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">
                    📸 Photo Proof (Required)
                  </label>
                  <label className="block w-full border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Click to upload photo</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Photo Preview */}
              {photoUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Uploaded Photos</p>
                  <div className="space-y-2">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <img
                          src={url}
                          alt="Task proof"
                          className="w-12 h-12 rounded-lg object-cover border border-border"
                        />
                        <button
                          onClick={() => setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))}
                          className="ml-auto text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add completion notes..."
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-transparent resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Complete Button */}
              <Button
                onClick={() => completeMutation.mutate()}
                disabled={!canComplete || completeMutation.isPending}
                className="w-full h-11 rounded-lg gap-2 bg-green-600 hover:bg-green-700"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Mark as Complete
              </Button>
            </div>
          )}

          {/* Completed State */}
          {task.status === 'completed' && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-bold text-green-900">✓ Completed</p>
                {task.completed_by_name && (
                  <p className="text-xs text-green-700 mt-1">by {task.completed_by_name}</p>
                )}
                {task.completed_at && (
                  <p className="text-xs text-green-700">
                    {format(new Date(task.completed_at), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>

              {task.completion_notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm text-foreground">{task.completion_notes}</p>
                </div>
              )}

              {task.photo_urls?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {task.photo_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Task proof"
                        className="w-full h-20 rounded-lg object-cover border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}