'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import Image from 'next/image';

interface RabbitLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showText?: boolean;
  showProgressBar?: boolean;
}

// Smooth bounce with squash and stretch
const bounceTransition = {
  duration: 0.6,
  repeat: Infinity,
  ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export function RabbitLoader({
  size = 'md',
  text = 'กำลังโหลด...',
  showText = true,
  showProgressBar = true
}: RabbitLoaderProps) {
  const config = useMemo(() => ({
    sm: { logoSize: 60, jumpHeight: 15, containerSize: 120, orbitSize: 90, barWidth: 140 },
    md: { logoSize: 90, jumpHeight: 22, containerSize: 160, orbitSize: 130, barWidth: 200 },
    lg: { logoSize: 120, jumpHeight: 30, containerSize: 200, orbitSize: 170, barWidth: 260 },
  }), []);

  const { logoSize, jumpHeight, containerSize, orbitSize, barWidth } = config[size];

  // Generate sparkles with deterministic values (avoid hydration mismatch)
  const sparkles = useMemo(() => [
    { id: 0, x: 15, y: 10, delay: 0, duration: 1.3, size: 6 },
    { id: 1, x: 75, y: 20, delay: 0.4, duration: 1.6, size: 8 },
    { id: 2, x: 30, y: 55, delay: 0.8, duration: 1.4, size: 7 },
    { id: 3, x: 85, y: 45, delay: 1.2, duration: 1.8, size: 5 },
    { id: 4, x: 50, y: 15, delay: 1.6, duration: 1.5, size: 9 },
    { id: 5, x: 20, y: 40, delay: 0.2, duration: 1.7, size: 6 },
    { id: 6, x: 65, y: 60, delay: 0.6, duration: 1.2, size: 8 },
    { id: 7, x: 40, y: 30, delay: 1.0, duration: 1.9, size: 7 },
  ], []);

  // Floating particles around the logo with deterministic values
  const floatingParticles = useMemo(() => [
    { id: 0, angle: 0, distance: orbitSize * 0.45, size: 4, delay: 0, duration: 2.2 },
    { id: 1, angle: Math.PI / 6, distance: orbitSize * 0.5, size: 5, delay: 0.1, duration: 2.5 },
    { id: 2, angle: Math.PI / 3, distance: orbitSize * 0.42, size: 6, delay: 0.2, duration: 2.8 },
    { id: 3, angle: Math.PI / 2, distance: orbitSize * 0.48, size: 4, delay: 0.3, duration: 2.3 },
    { id: 4, angle: (2 * Math.PI) / 3, distance: orbitSize * 0.52, size: 5, delay: 0.4, duration: 2.6 },
    { id: 5, angle: (5 * Math.PI) / 6, distance: orbitSize * 0.44, size: 7, delay: 0.5, duration: 2.4 },
    { id: 6, angle: Math.PI, distance: orbitSize * 0.47, size: 4, delay: 0.6, duration: 2.7 },
    { id: 7, angle: (7 * Math.PI) / 6, distance: orbitSize * 0.51, size: 6, delay: 0.7, duration: 2.1 },
    { id: 8, angle: (4 * Math.PI) / 3, distance: orbitSize * 0.43, size: 5, delay: 0.8, duration: 2.9 },
    { id: 9, angle: (3 * Math.PI) / 2, distance: orbitSize * 0.49, size: 4, delay: 0.9, duration: 2.2 },
    { id: 10, angle: (5 * Math.PI) / 3, distance: orbitSize * 0.46, size: 6, delay: 1.0, duration: 2.5 },
    { id: 11, angle: (11 * Math.PI) / 6, distance: orbitSize * 0.5, size: 5, delay: 1.1, duration: 2.3 },
  ], [orbitSize]);

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Main Animation Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: containerSize,
          height: containerSize,
        }}
      >
        {/* Ambient glow */}
        <motion.div
          className="absolute rounded-full bg-gradient-to-b from-primary-400/40 to-primary-600/20 blur-3xl"
          style={{ width: containerSize * 0.9, height: containerSize * 0.9 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Beautiful floating particles in a circle pattern */}
        {floatingParticles.map((particle) => {
          const x = Math.cos(particle.angle) * particle.distance;
          const y = Math.sin(particle.angle) * particle.distance;
          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                background: `linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(249, 115, 22, 0.6))`,
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [x, x * 1.1, x],
                y: [y, y * 0.9, y],
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          );
        })}

        {/* Sparkles */}
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute pointer-events-none"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
            animate={{
              y: [0, -18, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: sparkle.duration,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: 'easeOut',
            }}
          >
            <svg
              width={sparkle.size}
              height={sparkle.size}
              viewBox="0 0 24 24"
              className="text-primary-400"
            >
              <path
                d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
        ))}

        {/* Ground shadow */}
        <motion.div
          className="absolute rounded-full"
          style={{
            bottom: '8%',
            width: logoSize * 0.8,
            height: logoSize * 0.15,
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
          }}
          animate={{
            scaleX: [1, 0.5, 1],
            scaleY: [1, 0.7, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={bounceTransition}
        />

        {/* THE LOGO - Bouncing rabbit */}
        <motion.div
          className="absolute z-10"
          style={{
            width: logoSize,
            height: logoSize,
          }}
          animate={{
            y: [0, -jumpHeight, 0],
            scaleY: [1, 1.05, 0.92, 1],
            scaleX: [1, 0.95, 1.06, 1],
          }}
          transition={bounceTransition}
        >
          {/* Glow behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary-500/30 blur-xl"
            animate={{
              scale: [0.8, 1.1, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Logo image */}
          <motion.div
            className="relative w-full h-full"
            style={{
              filter: 'drop-shadow(0 4px 20px rgba(239, 68, 68, 0.4))',
            }}
            animate={{
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Image
              src="/images/logo-transparent.png"
              alt="RabbitAI Loading"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Pulse rings - expanding outward */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: logoSize * 0.7,
              height: logoSize * 0.7,
              border: '2px solid',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
            animate={{
              scale: [1, 2.8],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Additional glowing pulse */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: logoSize * 0.5,
            height: logoSize * 0.5,
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Beautiful Progress Bar - Fast start, wait at 95-99% */}
      {showProgressBar && (
        <div className="flex flex-col items-center gap-3">
          {/* Progress bar container */}
          <div
            className="relative overflow-hidden rounded-full"
            style={{ width: barWidth, height: 8 }}
          >
            {/* Background track with subtle inner shadow */}
            <div className="absolute inset-0 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full shadow-inner" />

            {/* Shimmer on track */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.2), transparent)',
              }}
              animate={{
                x: [-barWidth, barWidth],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Main progress fill - fast to 95%, then slow pulse at 95-99% */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #dc2626, #ef4444, #f97316, #fbbf24)',
                backgroundSize: '300% 100%',
              }}
              initial={{ width: '0%' }}
              animate={{
                width: ['0%', '60%', '85%', '95%', '97%', '99%', '97%', '95%'],
                backgroundPosition: ['0% 0%', '50% 0%', '100% 0%', '150% 0%', '200% 0%', '250% 0%', '200% 0%', '150% 0%'],
              }}
              transition={{
                width: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeOut',
                  times: [0, 0.15, 0.3, 0.5, 0.65, 0.8, 0.9, 1],
                },
                backgroundPosition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            />

            {/* Shine sweep effect */}
            <motion.div
              className="absolute inset-y-0 w-1/3 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              }}
              animate={{
                x: [-barWidth * 0.3, barWidth * 1.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Glowing pulse at the edge */}
            <motion.div
              className="absolute inset-y-0 w-4 rounded-full bg-white/70 blur-sm"
              animate={{
                x: [0, barWidth * 0.55, barWidth * 0.85, barWidth * 0.93, barWidth * 0.95, barWidth * 0.97, barWidth * 0.95, barWidth * 0.93],
                opacity: [0.3, 0.8, 1, 1, 1, 1, 1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeOut',
                times: [0, 0.15, 0.3, 0.5, 0.65, 0.8, 0.9, 1],
              }}
            />
          </div>

          {/* Animated dots - pulsing while waiting */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                }}
                animate={{
                  scale: [0.6, 1.3, 0.6],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading Text */}
      {showText && text && (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.p
            className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 tracking-wide"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {text}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

// Full page loader variant with beautiful backdrop
export function RabbitLoaderFullPage({ text = 'กำลังโหลด...' }: { text?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-neutral-950 dark:via-primary-950/20 dark:to-neutral-950" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-primary-200/40 to-transparent blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-gradient-to-br from-primary-300/30 to-transparent blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Loader content */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number]
        }}
      >
        <RabbitLoader size="lg" text={text} showProgressBar={true} />
      </motion.div>
    </motion.div>
  );
}

// Inline mini loader for buttons or small spaces
export function RabbitLoaderMini() {
  return (
    <motion.div
      className="inline-flex items-center gap-1.5"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      <motion.div
        className="relative w-5 h-5"
        animate={{ y: [0, -3, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Image
          src="/images/logo-transparent.png"
          alt="Loading"
          fill
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

// Standalone progress bar component
export function AnimatedProgressBar({
  width = 200,
  height = 6,
  speed = 'fast'
}: {
  width?: number;
  height?: number;
  speed?: 'slow' | 'normal' | 'fast';
}) {
  const durations = {
    slow: 2.5,
    normal: 1.8,
    fast: 1.2,
  };

  const duration = durations[speed];

  return (
    <div
      className="relative overflow-hidden rounded-full"
      style={{ width, height }}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-full" />

      {/* Shimmer background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.2), transparent)',
        }}
        animate={{
          x: [-width, width],
        }}
        transition={{
          duration: duration * 0.6,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Main animated fill */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #dc2626, #ef4444, #f97316, #ef4444, #dc2626)',
          backgroundSize: '300% 100%',
        }}
        animate={{
          width: ['0%', '100%', '100%', '0%'],
          left: ['0%', '0%', '0%', '100%'],
          backgroundPosition: ['0% 0%', '50% 0%', '100% 0%', '150% 0%'],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.45, 0.55, 1],
        }}
      />

      {/* Highlight shine */}
      <motion.div
        className="absolute inset-y-0 w-8 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        }}
        animate={{
          x: [-32, width + 32],
        }}
        transition={{
          duration: duration * 0.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Glow dot at edge */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg shadow-primary-500/50"
        style={{ width: height + 2, height: height + 2 }}
        animate={{
          x: [0, width - height - 2, width - height - 2, 0],
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1, 1, 0.5],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.45, 0.55, 1],
        }}
      />
    </div>
  );
}
