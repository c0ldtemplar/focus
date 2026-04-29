import React from 'react';
import { motion } from 'motion/react';
import { getLucideIcon } from '../constants';
import { Interest } from '../types';

interface Props {
  interests: Interest[];
  onToggle: (id: string) => void;
}

export const InterestPicker: React.FC<Props> = ({ interests, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((interest) => {
        const Icon = getLucideIcon(interest.icon);
        return (
          <motion.div
            key={interest.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(interest.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
              interest.active
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600 shadow-sm'
            }`}
          >
            <Icon size={16} />
            {interest.name}
          </motion.div>
        );
      })}
    </div>
  );
};
