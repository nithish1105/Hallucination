'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MayaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
}

export function MayaAvatar({ size = 'md', isThinking = false, className }: MayaAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center rounded-full", sizeClasses[size], className)}>
      {/* Background Gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1D4ED8] via-[#4F46E5] to-[#7C3AED]" />
      
      {/* Thinking Animation Border */}
      {isThinking && (
        <motion.div
          className="absolute -inset-1 rounded-full border-2 border-transparent bg-gradient-to-r from-accent to-purple-500 opacity-50"
          style={{ maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
      )}
      
      {/* Pulse effect if thinking */}
      {isThinking && (
        <motion.div
          className="absolute inset-0 rounded-full bg-white/20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
      
      <span className="relative z-10 font-outfit font-bold text-white tracking-wider">M</span>
    </div>
  );
}
