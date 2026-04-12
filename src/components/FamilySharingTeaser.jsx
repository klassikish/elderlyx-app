import { Users, Lock, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FamilySharingTeaser() {
  const navigate = useNavigate();

  const features = [
    { icon: Users, label: 'Share with family members' },
    { icon: Heart, label: 'Real-time updates & alerts' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="font-bold text-foreground text-sm">Family Sharing Access</h3>

      <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl border border-purple-200 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-purple-900 text-sm">Stay Connected Together</p>
            <p className="text-xs text-purple-800/70 mt-1">
              Add siblings, relatives, and caregivers to monitor your loved one's care in real-time.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs text-purple-900 font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white/50 rounded-xl p-3">
          <p className="text-xs font-bold text-purple-900 mb-2">✓ Premium members can:</p>
          <ul className="space-y-1 text-[11px] text-purple-800">
            <li>• Invite multiple family members</li>
            <li>• Assign custom roles (Viewer / Contributor)</li>
            <li>• Manage permissions instantly</li>
            <li>• Share Daily Life Playback & alerts</li>
          </ul>
        </div>
      </div>

      <Button
        className="w-full h-11 rounded-2xl font-bold gap-2 bg-purple-600 hover:bg-purple-700"
        onClick={() => navigate('/Plans')}
      >
        Upgrade to Premium
        <ChevronRight className="w-4 h-4" />
      </Button>

      <p className="text-[10px] text-center text-muted-foreground">
        Premium members save $5/trip + unlock Family Sharing, Daily Life Playback & SOS alerts
      </p>
    </motion.div>
  );
}