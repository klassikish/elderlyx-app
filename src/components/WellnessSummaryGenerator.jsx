import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, TrendingUp, AlertCircle, CheckCircle2, Lock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function WellnessSummaryGenerator({ seniorName, isPremium }) {
  const navigate = useNavigate();
  const [days, setDays] = useState(7);
  const [showPreview, setShowPreview] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('generateWellnessSummary', {
        senior_name: seniorName,
        days,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Download PDF
      const linkSource = `data:application/pdf;base64,${data.pdf_base64}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = data.filename;
      downloadLink.click();

      toast.success('Wellness report downloaded!');
      setShowPreview(true);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate report');
    },
  });

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-2xl p-5 space-y-4 text-center"
      >
        <div className="flex justify-center mb-2">
          <div className="relative">
            <TrendingUp className="w-8 h-8 text-emerald-700" />
            <Lock className="w-4 h-4 text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
          </div>
        </div>
        <div>
          <p className="font-bold text-emerald-900">AI Wellness Reports (Premium Only)</p>
          <p className="text-xs text-emerald-800/70 mt-1">
            See exactly how your loved one is doing with weekly AI analysis of mood, eating, mobility, and medication trends.
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-3 space-y-1 text-left">
          <p className="text-xs font-semibold text-emerald-900 mb-2">Premium members get:</p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            Automatic trend analysis & alerts
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            Downloadable PDF reports for family
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            Risk detection & personalized care tips
          </div>
        </div>
        <Button
          className="w-full h-11 rounded-xl font-bold gap-2 bg-emerald-700 hover:bg-emerald-800"
          onClick={() => navigate('/Plans')}
        >
          <Heart className="w-4 h-4" />
          Upgrade to Premium
        </Button>
        <p className="text-[10px] text-emerald-800 font-medium">
          Get peace of mind + save $5 per trip
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Weekly Wellness Report</p>
            <p className="text-xs text-emerald-800/70 mt-0.5">
              AI-powered analysis of {seniorName}'s health trends, concerns, and activity recommendations
            </p>
          </div>
        </div>

        {/* Days selector */}
        <div>
          <label className="text-xs font-semibold text-emerald-900 mb-2 block">
            Report Period
          </label>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  days === d
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/60 rounded-xl p-3 space-y-1.5">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-emerald-900 font-medium">Trend Analysis</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-emerald-900 font-medium">Risk Assessment</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-emerald-900 font-medium">Activity Recommendations</span>
          </div>
        </div>

        {/* Generate button */}
        <Button
          className="w-full h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 gap-2"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing & Creating PDF…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate Wellness Report
            </>
          )}
        </Button>

        <p className="text-[10px] text-emerald-800 text-center">
          Report includes AI analysis of mood, eating, mobility, medication, and independence trends
        </p>
      </div>

      {/* Success state */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 text-sm">Report Generated!</p>
              <p className="text-xs text-green-800 mt-1">
                Your PDF has been downloaded. Share it with family members to stay informed about {seniorName}'s well-being.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}