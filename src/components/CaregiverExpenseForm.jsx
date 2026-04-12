import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import BottomSheetSelect from '@/components/BottomSheetSelect';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['groceries', 'supplies', 'medication', 'transport', 'other'];

export default function CaregiverExpenseForm({ booking, onDone }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('groceries');
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadReceipt = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setReceiptUrl(file_url);
    setUploading(false);
  };

  const mutation = useMutation({
    mutationFn: () => base44.entities.Expense.create({
      booking_id: booking.id,
      caregiver_id: user?.id,
      caregiver_name: user?.full_name,
      family_email: booking.family_email,
      senior_name: booking.senior_name,
      description,
      amount: parseFloat(amount),
      category,
      receipt_url: receiptUrl,
      status: 'pending',
    }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Expense submitted for family approval');
      onDone();
    },
  });

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
        <input
          type="text"
          placeholder="e.g. Groceries from Whole Foods"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount ($)</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
          <BottomSheetSelect
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map(c => ({ label: c, value: c }))}
            placeholder="Select category"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Receipt (optional)</label>
        {receiptUrl ? (
          <div className="flex items-center gap-2">
            <img src={receiptUrl} alt="receipt" className="h-16 w-16 object-cover rounded-lg border border-border" />
            <button onClick={() => setReceiptUrl(null)} className="text-xs text-red-500 font-semibold">Remove</button>
          </div>
        ) : (
          <label className="flex items-center gap-2 border border-dashed border-input rounded-xl px-3 py-2 cursor-pointer hover:bg-muted">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{uploading ? 'Uploading…' : 'Upload receipt photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadReceipt(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={onDone}>Cancel</Button>
        <Button size="sm" className="rounded-xl flex-1" disabled={!description || !amount || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Expense'}
        </Button>
      </div>
    </div>
  );
}