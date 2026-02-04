'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { FadeIn } from '@/components/animations';
import { Badge } from '@/components/ui';

interface PageHeroProps {
  badge?: {
    icon?: ReactNode;
    text: string;
  };
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  particles?: boolean;
}

export function PageHero({
  badge,
  title,
  subtitle,
  children,
  className = '',
  particles = true
}: PageHeroProps) {
  return (
    <section className={`py-10 sm:py-16 lg:py-24 bg-gradient-red relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 dot-pattern opacity-30" />

      {/* Animated Particles */}
      {particles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary-400/20"
              initial={{
                x: `${20 + i * 15}%`,
                y: '100%',
                opacity: 0.3
              }}
              animate={{
                y: '-20%',
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {badge && (
          <FadeIn>
            <Badge variant="primary" size="md" className="mb-4 sm:mb-6">
              {badge.icon}
              {badge.text}
            </Badge>
          </FadeIn>
        )}

        <FadeIn delay={0.1}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 px-2">
            {title}
          </h1>
        </FadeIn>

        {subtitle && (
          <FadeIn delay={0.2}>
            <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
              {subtitle}
            </p>
          </FadeIn>
        )}

        {children && (
          <FadeIn delay={0.3}>
            <div className="mt-6 sm:mt-8">
              {children}
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
