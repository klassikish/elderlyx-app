import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, Clock, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const DOC_TYPES = [
  { id: 'background_check', label: 'Background Check' },
  { id: 'id_license', label: 'ID / Driver License' },
  { id: 'certification', label: 'Care Certification' },
  { id: 'insurance', label: 'Liability Insurance' },
  { id: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  pending: { label: 'Under Review', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function CaregiverDocuments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('background_check');

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['my-docs'],
    queryFn: () => base44.entities.CaregiverDocument.filter({ caregiver_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.CaregiverDocument.create({
      caregiver_id: user.id,
      caregiver_name: user.full_name,
      caregiver_email: user.email,
      doc_type: selectedType,
      doc_label: DOC_TYPES.find(d => d.id === selectedType)?.label,
      file_url,
      file_name: file.name,
      status: 'pending',
    });
    qc.invalidateQueries({ queryKey: ['my-docs'] });
    toast.success('Document submitted for review!');
    setUploading(false);
    e.target.value = '';
  };

  const allApproved = docs.length > 0 && docs.every(d => d.status === 'approved');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-bold text-foreground">My Documents</h1>
        {allApproved && (
          <div className="ml-auto flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Verified</span>
          </div>
        )}
      </div>

      <div className="px-5 pt-5 pb-32 space-y-5">
        {/* Upload section */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="font-bold text-foreground mb-1">Upload a Document</p>
          <p className="text-xs text-muted-foreground mb-4">Submit certifications, background checks, or licenses for admin review.</p>

          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Document Type</p>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedType(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${selectedType === d.id ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-transparent text-muted-foreground'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-colors ${uploading ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}>
            {uploading
              ? <Loader2 className="w-7 h-7 text-primary animate-spin" />
              : <Upload className="w-7 h-7 text-muted-foreground" />}
            <p className="text-sm font-semibold text-foreground">{uploading ? 'Uploading…' : 'Tap to upload file'}</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* Submitted docs */}
        <div>
          <p className="font-bold text-foreground mb-3">Submitted Documents</p>
          {isLoading && <div className="h-20 bg-muted rounded-2xl animate-pulse" />}
          {!isLoading && docs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No documents submitted yet.</div>
          )}
          <div className="space-y-3">
            {docs.map((doc, i) => {
              const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{doc.doc_label || doc.doc_type}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                    {doc.admin_note && <p className="text-xs text-red-500 mt-0.5">{doc.admin_note}</p>}
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}