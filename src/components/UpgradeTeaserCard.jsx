import { Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function UpgradeTeaserCard({ title, description, icon: Icon, onClick }) {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={onClick || (() => navigate('/Plans'))}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left"
    >
      <div className="bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center flex-shrink-0">
          {Icon ? <Icon className="w-5 h-5 text-amber-600" /> : <Lock className="w-5 h-5 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-amber-900 text-sm">{title}</p>
          <p className="text-xs text-amber-800/70 mt-0.5">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
      </div>
    </motion.button>
  );
}