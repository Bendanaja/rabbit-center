'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Crown } from 'lucide-react';
import { type PricingPlan } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';

interface PricingCardProps {
  plan: PricingPlan;
  delay?: number;
}

export function PricingCard({ plan, delay = 0 }: PricingCardProps) {
  const isPro = plan.id === 'pro';
  const paymentHref = plan.price > 0 ? `/payment?plan=${plan.id}` : '/chat';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className={cn(
        'relative rounded-2xl p-6 lg:p-8 transition-all duration-300 flex flex-col h-full',
        'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
        isPro
          ? 'shadow-xl shadow-primary-500/10 ring-2 ring-primary-500 dark:ring-primary-400'
          : 'hover:shadow-xl hover:border-neutral-300 dark:hover:border-neutral-700'
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-md opacity-60" />
              <div className="relative px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 shadow-lg shadow-amber-500/40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-transparent to-transparent" />
                <div className="relative flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-900" />
                  <span className="text-xs font-bold text-amber-900 tracking-wide">
                    ยอดนิยม
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-display font-bold mb-2 text-neutral-900 dark:text-white">
          {plan.name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 min-h-[40px]">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl lg:text-5xl font-display font-bold text-neutral-900 dark:text-white">
            {plan.currency}{plan.price.toLocaleString()}
          </span>
          <span className="text-lg text-neutral-500 dark:text-neutral-400">
            /{plan.period}
          </span>
        </div>
        {plan.id === 'starter' && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
            เริ่มต้นเพียง 6.6 บาท/วัน
          </p>
        )}
        {plan.id === 'pro' && (
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
            คุ้มค่าที่สุด - ครบทุกฟีเจอร์
          </p>
        )}
        {plan.id === 'premium' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
            ระดับสูงสุด ไม่มีข้อจำกัด
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        variant={isPro ? 'primary' : 'outline'}
        size="lg"
        className={cn(
          'w-full justify-center mb-6',
          isPro && 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-0'
        )}
        asChild
      >
        <Link href={paymentHref}>
          {plan.cta}
        </Link>
      </Button>

      {/* Features */}
      <div className="space-y-3 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          รวมฟีเจอร์
        </p>
        <ul className="space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <div
                className={cn(
                  'shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5',
                  isPro
                    ? 'bg-primary-100 dark:bg-primary-900/50'
                    : 'bg-green-100 dark:bg-green-900/30'
                )}
              >
                <Check
                  className={cn(
                    'h-3 w-3',
                    isPro ? 'text-primary-600 dark:text-primary-400' : 'text-green-600 dark:text-green-400'
                  )}
                />
              </div>
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Limitations */}
        {plan.limitations.length > 0 && (
          <ul className="space-y-2.5 pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
            {plan.limitations.map((limitation) => (
              <li key={limitation} className="flex items-start gap-2.5">
                <div className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5 bg-neutral-100 dark:bg-neutral-800">
                  <X className="h-3 w-3 text-neutral-400" />
                </div>
                <span className="text-sm text-neutral-400">{limitation}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
