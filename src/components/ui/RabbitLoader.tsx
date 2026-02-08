'use client';

import { useMemo } from 'react';
import Image from 'next/image';

interface RabbitLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showText?: boolean;
  showProgressBar?: boolean;
}

export function RabbitLoader({
  size = 'md',
  text = 'กำลังโหลด...',
  showText = true,
  showProgressBar = true
}: RabbitLoaderProps) {
  const config = useMemo(() => ({
    sm: { logoSize: 60, containerSize: 120, barWidth: 140 },
    md: { logoSize: 90, containerSize: 160, barWidth: 200 },
    lg: { logoSize: 120, containerSize: 200, barWidth: 260 },
  }), []);

  const { logoSize, containerSize, barWidth } = config[size];

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Main Animation Container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Ambient glow - CSS only */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-primary-400/30 to-primary-600/15 blur-3xl animate-pulse"
          style={{ width: containerSize * 0.9, height: containerSize * 0.9 }}
        />

        {/* Pulse rings - CSS */}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 border-primary-500/30 animate-[pulseRing_2s_ease-out_infinite]"
            style={{ width: logoSize * 0.7, height: logoSize * 0.7, willChange: 'transform, opacity', animationDelay: `${i}s` }}
          />
        ))}

        {/* Sparkle particles - CSS */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI * 2) / 4 - Math.PI / 4;
          const radius = logoSize * 0.55;
          return (
            <div
              key={`sparkle-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full animate-[sparklePop_2s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #fbbf24)',
                left: '50%',
                top: '50%',
                marginLeft: Math.cos(angle) * radius - 3,
                marginTop: Math.sin(angle) * radius - 3,
                willChange: 'transform, opacity',
                animationDelay: `${i * 0.5}s`,
              }}
            />
          );
        })}

        {/* THE LOGO - Bouncing rabbit - CSS */}
        <div
          className="absolute z-10 animate-[bounceY_0.8s_ease-in-out_infinite]"
          style={{
            width: logoSize,
            height: logoSize,
            willChange: 'transform',
          }}
        >
          <div
            className="relative w-full h-full"
            style={{ filter: 'drop-shadow(0 4px 20px rgba(239, 68, 68, 0.4))' }}
          >
            <Image
              src="/images/logo-transparent.png"
              alt="RabbitHub Loading"
              fill
              sizes={`${logoSize}px`}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Progress Bar - CSS shimmer */}
      {showProgressBar && (
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative overflow-hidden rounded-full"
            style={{ width: barWidth, height: 8 }}
          >
            <div className="absolute inset-0 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full" />
            <div
              className="absolute inset-y-0 left-0 rounded-full shimmer"
              style={{
                width: '95%',
                background: 'linear-gradient(90deg, #dc2626, #ef4444, #f97316, #fbbf24)',
                backgroundSize: '300% 100%',
              }}
            />
          </div>

          {/* Pulsing dots - CSS */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-[dotPulse_0.8s_ease-in-out_infinite]"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  willChange: 'transform, opacity',
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading Text - CSS */}
      {showText && text && (
        <p
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 tracking-wide animate-[textFade_1.5s_ease-in-out_infinite]"
        >
          {text}
        </p>
      )}
    </div>
  );
}

// Full page loader variant
export function RabbitLoaderFullPage({ text = 'กำลังโหลด...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-neutral-950 dark:via-primary-950/20 dark:to-neutral-950" />

      {/* Loader content */}
      <div className="relative z-10">
        <RabbitLoader size="lg" text={text} showProgressBar={true} />
      </div>
    </div>
  );
}

// Inline mini loader for buttons or small spaces
export function RabbitLoaderMini() {
  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className="relative w-5 h-5 animate-bounce"
        style={{ willChange: 'transform', animationDuration: '0.5s' }}
      >
        <Image
          src="/images/logo-transparent.png"
          alt="Loading"
          fill
          sizes="20px"
          className="object-contain"
        />
      </div>
    </div>
  );
}

// Standalone progress bar component
export function AnimatedProgressBar({
  width = 200,
  height = 6,
}: {
  width?: number;
  height?: number;
  speed?: 'slow' | 'normal' | 'fast';
}) {
  return (
    <div
      className="relative overflow-hidden rounded-full"
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-full" />
      <div
        className="absolute inset-y-0 left-0 rounded-full shimmer"
        style={{
          width: '100%',
          background: 'linear-gradient(90deg, #dc2626, #ef4444, #f97316, #ef4444, #dc2626)',
          backgroundSize: '300% 100%',
        }}
      />
    </div>
  );
}
