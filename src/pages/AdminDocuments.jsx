import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, XCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminDocuments() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['admin-docs', filter],
    queryFn: () => filter === 'all'
      ? base44.entities.CaregiverDocument.list('-created_date', 100)
      : base44.entities.CaregiverDocument.filter({ status: filter }, '-created_date', 100),
  });

  const updateDoc = useMutation({
    mutationFn: ({ id, status, admin_note }) => base44.entities.CaregiverDocument.update(id, { status, admin_note }),
    onSuccess: async (_, { id, status, caregiver_id, caregiver_email, caregiver_name }) => {
      qc.invalidateQueries({ queryKey: ['admin-docs'] });
      toast.success(`Document ${status}`);
      // Notify caregiver
      if (caregiver_email) {
        await base44.entities.Notification.create({
          user_email: caregiver_email,
          title: status === 'approved' ? '✅ Document Approved' : '❌ Document Rejected',
          body: status === 'approved'
            ? 'Your submitted document has been approved by our team.'
            : `Your document was rejected. ${rejectNote || ''}`,
          type: 'general',
        });
      }
      setRejectTarget(null);
      setRejectNote('');
    },
  });

  const handleApprove = (doc) => {
    updateDoc.mutate({ id: doc.id, status: 'approved', admin_note: '', caregiver_email: doc.caregiver_email });
  };

  const handleReject = (doc) => {
    updateDoc.mutate({ id: doc.id, status: 'rejected', admin_note: rejectNote, caregiver_email: doc.caregiver_email });
  };

  const list = docs;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h1 className="font-bold text-foreground">Document Verification</h1>
        <span className="ml-auto text-xs text-muted-foreground">{docs.length} docs</span>
      </div>

      {/* Filter chips */}
      <div className="px-5 pt-4 flex gap-2 pb-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 space-y-3 pb-10">
        {isLoading && [1,2,3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        {!isLoading && list.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No {filter} documents.</div>
        )}
        {list.map((doc, i) => (
          <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{doc.doc_label || doc.doc_type}</p>
                    <p className="text-xs text-muted-foreground">{doc.caregiver_name} · {doc.caregiver_email}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(doc.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[doc.status]}`}>{doc.status}</span>
                </div>
                {doc.file_name && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.file_name}</p>}
                {doc.admin_note && <p className="text-xs text-red-500 mt-1">{doc.admin_note}</p>}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <a href={doc.file_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-xs font-semibold text-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View File
              </a>
              {doc.status === 'pending' && (
                <>
                  <Button size="sm" className="rounded-xl flex-1 h-8" onClick={() => handleApprove(doc)} disabled={updateDoc.isPending}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl flex-1 h-8 text-red-600 border-red-200"
                    onClick={() => setRejectTarget(doc.id === rejectTarget ? null : doc.id)}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>

            {/* Reject note input */}
            {rejectTarget === doc.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  placeholder="Reason for rejection (optional)…"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  className="w-full border border-input rounded-xl p-3 text-xs resize-none h-16 bg-transparent"
                />
                <Button size="sm" variant="destructive" className="w-full rounded-xl h-8" onClick={() => handleReject(doc)} disabled={updateDoc.isPending}>
                  Confirm Rejection
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}