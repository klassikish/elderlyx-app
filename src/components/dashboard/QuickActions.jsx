import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Car, Users, Utensils, Stethoscope, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  { icon: ShoppingCart, label: 'Grocery', color: 'hsl(160, 55%, 45%)', task: 'grocery' },
  { icon: Car, label: 'Transport', color: 'hsl(215, 80%, 52%)', task: 'transport' },
  { icon: Users, label: 'Company', color: 'hsl(280, 55%, 55%)', task: 'companionship' },
  { icon: Utensils, label: 'Cooking', color: 'hsl(15, 85%, 60%)', task: 'cooking' },
  { icon: Stethoscope, label: 'Medical', color: 'hsl(0, 72%, 51%)', task: 'medical_escort' },
  { icon: Wrench, label: 'Household', color: 'hsl(45, 85%, 55%)', task: 'household' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ icon: Icon, label, color, task }, idx) => (
        <motion.div
          key={task}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Link
            to={`/BookHelper?task=${task}`}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}12` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}