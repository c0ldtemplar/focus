import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Login } from './Login';
import { Signup } from './Signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md"
        >
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full p-2 z-10 transition-colors"
            aria-label="Close authentication modal"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <Login key="login" onSwitchToSignup={() => setMode('signup')} />
            ) : (
              <Signup key="signup" onSwitchToLogin={() => setMode('login')} />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};