'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Crown, Zap, Star, Gem } from 'lucide-react';
import { type PricingPlan } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  plan: PricingPlan;
  delay?: number;
}

const planThemes: Record<string, {
  gradient: string;
  headerGradient: string;
  accentColor: string;
  checkBg: string;
  checkColor: string;
  buttonClass: string;
  icon: typeof Crown;
  rgb: string;
}> = {
  free: {
    gradient: 'from-neutral-500/10 via-neutral-600/5 to-transparent',
    headerGradient: 'from-neutral-400 to-neutral-600',
    accentColor: 'text-neutral-400',
    checkBg: 'bg-neutral-500/15',
    checkColor: 'text-neutral-400',
    buttonClass: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/50',
    icon: Star,
    rgb: '163,163,163',
  },
  starter: {
    gradient: 'from-blue-500/12 via-blue-600/5 to-transparent',
    headerGradient: 'from-blue-400 to-cyan-400',
    accentColor: 'text-blue-400',
    checkBg: 'bg-blue-500/15',
    checkColor: 'text-blue-400',
    buttonClass: 'bg-blue-600/90 hover:bg-blue-600 text-white',
    icon: Zap,
    rgb: '96,165,250',
  },
  pro: {
    gradient: 'from-red-500/15 via-rose-500/8 to-transparent',
    headerGradient: 'from-red-400 via-rose-400 to-orange-400',
    accentColor: 'text-red-400',
    checkBg: 'bg-red-500/15',
    checkColor: 'text-red-400',
    buttonClass: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white',
    icon: Crown,
    rgb: '248,113,113',
  },
  premium: {
    gradient: 'from-amber-500/12 via-amber-600/5 to-transparent',
    headerGradient: 'from-amber-400 via-yellow-400 to-orange-400',
    accentColor: 'text-amber-400',
    checkBg: 'bg-amber-500/15',
    checkColor: 'text-amber-400',
    buttonClass: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white',
    icon: Gem,
    rgb: '251,191,36',
  },
};

export function PricingCard({ plan, delay = 0 }: PricingCardProps) {
  const isPro = plan.id === 'pro';
  const theme = planThemes[plan.id] || planThemes.free;
  const paymentHref = plan.price > 0 ? `/payment?plan=${plan.id}` : '/chat';
  const IconComponent = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(
        'group relative flex flex-col h-full',
        isPro && 'z-10 lg:-my-3'
      )}
    >
      {/* Soft ambient glow - only Pro always visible, others on hover */}
      <div
        className={cn(
          'absolute -inset-4 rounded-3xl transition-opacity duration-700 blur-3xl pointer-events-none',
          isPro ? 'opacity-40 group-hover:opacity-50' : 'opacity-0 group-hover:opacity-30'
        )}
        style={{
          background: `radial-gradient(ellipse at 50% 30%, rgba(${theme.rgb}, 0.15) 0%, transparent 70%)`,
        }}
      />

      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.3, ease: 'easeOut' } }}
        className="relative flex flex-col h-full rounded-2xl overflow-hidden transition-shadow duration-500"
        style={{
          boxShadow: isPro
            ? `0 0 0 1px rgba(${theme.rgb}, 0.15), 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -4px rgba(0,0,0,0.35), 0 20px 50px -12px rgba(0,0,0,0.25)`
            : `0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.2), 0 6px 20px -4px rgba(0,0,0,0.3), 0 16px 40px -12px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Top edge - subtle light from above */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-10"
          style={{
            background: isPro
              ? `linear-gradient(90deg, transparent, rgba(${theme.rgb}, 0.3) 30%, rgba(${theme.rgb}, 0.4) 50%, rgba(${theme.rgb}, 0.3) 70%, transparent)`
              : `linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent)`,
          }}
        />

        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute top-4 right-4 z-20">
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: delay + 0.3 }}
            >
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 shadow-md shadow-amber-500/20">
                <Crown className="h-3 w-3 text-amber-900" />
                <span className="text-[11px] font-bold text-amber-900">ยอดนิยม</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Gradient header */}
        <div className={cn(
          'relative px-6 pt-6 pb-7',
          `bg-gradient-to-b ${theme.gradient}`
        )}>
          {/* Very subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)`,
            backgroundSize: '16px 16px',
          }} />

          <div className="relative flex items-center gap-3 mb-4">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
                theme.headerGradient,
              )}
              style={{
                boxShadow: `0 2px 6px rgba(${theme.rgb}, 0.25)`,
              }}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-neutral-500">{plan.description}</p>
            </div>
          </div>

          <div className="relative flex items-baseline gap-1.5">
            <span className={cn(
              'text-5xl lg:text-6xl font-display font-bold tracking-tight text-neutral-100',
              isPro && 'text-white'
            )}>
              {plan.currency}{plan.price.toLocaleString()}
            </span>
            <span className="text-base text-neutral-500">/{plan.period}</span>
          </div>

        </div>

        {/* Body */}
        <div className="relative flex-1 flex flex-col bg-neutral-950/90 px-6 pb-6 pt-4">
          {/* Separator */}
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${theme.rgb}, 0.15) 50%, transparent)`,
            }}
          />

          <button className={cn(
            'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200',
            'hover:scale-[1.01] active:scale-[0.99]',
            theme.buttonClass,
            'mb-5'
          )}>
            <Link href={paymentHref} className="flex items-center justify-center gap-2 w-full h-full">
              {plan.cta}
            </Link>
          </button>

          <div className="flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <div className={cn(
                  'shrink-0 h-5 w-5 rounded-md flex items-center justify-center mt-0.5',
                  theme.checkBg
                )}>
                  <Check className={cn('h-3 w-3', theme.checkColor)} />
                </div>
                <span className="text-sm text-neutral-300 leading-relaxed">{feature}</span>
              </div>
            ))}

            {plan.limitations.length > 0 && (
              <div className="pt-2 mt-2 border-t border-neutral-800/40 space-y-2.5">
                {plan.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-2.5">
                    <div className="shrink-0 h-5 w-5 rounded-md flex items-center justify-center mt-0.5 bg-neutral-800/40">
                      <X className="h-3 w-3 text-neutral-600" />
                    </div>
                    <span className="text-sm text-neutral-600">{limitation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
