'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ConfidenceBarProps {
  confidence: number;
  showLabel?: boolean;
}

export function ConfidenceBar({ confidence, showLabel = true }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  
  let colorClass = 'bg-emerald-500';
  if (percentage < 60) colorClass = 'bg-red-500';
  else if (percentage < 80) colorClass = 'bg-amber-500';
  else if (percentage < 95) colorClass = 'bg-blue-500';

  return (
    <div className="flex items-center gap-3 w-full max-w-sm mt-2">
      <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden flex-1 border border-border">
        <motion.div
          className={`h-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted min-w-[32px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}
