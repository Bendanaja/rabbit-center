'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent';
  icon: React.ReactNode;
  color?: 'primary' | 'green' | 'blue' | 'purple' | 'orange' | 'yellow';
  delay?: number;
  loading?: boolean;
}

const colorStyles = {
  primary: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    icon: 'text-primary-400',
    glow: 'shadow-primary-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    glow: 'shadow-green-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
  },
};

function AnimatedNumber({ value, format }: { value: number; format: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(v),
    });

    return () => controls.stop();
  }, [value]);

  const formatValue = (v: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }).format(v);
    }
    if (format === 'percent') {
      return `${v.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('th-TH').format(Math.round(v));
  };

  return <span>{formatValue(displayValue)}</span>;
}

export function StatsCard({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  color = 'primary',
  delay = 0,
  loading = false,
}: StatsCardProps) {
  const styles = colorStyles[color];

  // Calculate percentage change
  const percentChange = previousValue
    ? ((value - previousValue) / previousValue) * 100
    : null;

  const trend = percentChange
    ? percentChange > 0
      ? 'up'
      : percentChange < 0
        ? 'down'
        : 'neutral'
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
      }}
      className={cn(
        'relative p-6 rounded-3xl border glass-premium shadow-premium',
        styles.border,
        'hover-lift duration-300',
        styles.glow
      )}
    >
      {/* Glow effect */}
      <div className={cn(
        'absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none',
        styles.bg,
        'blur-xl'
      )} />

      <div className="relative">
        {/* Icon */}
        <div className={cn(
          'inline-flex p-3 rounded-xl mb-4',
          styles.bg
        )}>
          <div className={styles.icon}>
            {icon}
          </div>
        </div>

        {/* Title */}
        <p className="text-sm text-neutral-400 mb-1">{title}</p>

        {/* Value */}
        <div className="flex items-end gap-3">
          {loading ? (
            <div className="h-9 w-24 bg-neutral-800 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-3xl font-bold text-white">
              <AnimatedNumber value={value} format={format} />
            </h3>
          )}

          {/* Trend indicator */}
          {!loading && trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                trend === 'up' && 'bg-green-500/10 text-green-400',
                trend === 'down' && 'bg-red-500/10 text-red-400',
                trend === 'neutral' && 'bg-neutral-500/10 text-neutral-400'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'neutral' && <Minus className="h-3 w-3" />}
              <span>{Math.abs(percentChange || 0).toFixed(1)}%</span>
            </motion.div>
          )}
        </div>

        {/* Sparkline placeholder */}
        <div className="mt-4 h-12 flex items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.random() * 100}%` }}
              transition={{
                delay: delay + i * 0.05,
                duration: 0.5,
                ease: 'easeOut',
              }}
              className={cn(
                'flex-1 rounded-t',
                styles.bg,
                'min-h-[4px]'
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
