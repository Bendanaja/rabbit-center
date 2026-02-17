'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle } from 'lucide-react';
import { Navbar } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PricingCard } from '@/components/pricing';
import { FadeIn } from '@/components/animations';
import { PRICING_PLANS, AI_MODELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { type PricingContent } from '@/lib/content';

const comparisonFeatures = [
  { name: 'โมเดล AI', free: '2 โมเดล', starter: 'ทุกโมเดล', pro: 'ทุกโมเดล', premium: 'ทุกโมเดล' },
  { name: 'สร้างรูปภาพ', free: false, starter: true, pro: true, premium: true },
  { name: 'สร้างวิดีโอ', free: false, starter: true, pro: true, premium: true },
  { name: 'ค้นหาเว็บ', free: true, starter: true, pro: true, premium: true },
  { name: 'ประวัติแชท', free: '7 วัน', starter: '30 วัน', pro: 'ไม่จำกัด', premium: 'ไม่จำกัด' },
  { name: 'ความเร็ว', free: 'ปกติ', starter: 'ปกติ', pro: 'สูง', premium: 'สูงสุด' },
  { name: 'เข้าถึง API', free: false, starter: false, pro: false, premium: true },
  { name: 'การสนับสนุนพิเศษ', free: false, starter: false, pro: true, premium: true },
];

const planHeaderColors: Record<string, string> = {
  free: 'text-neutral-400',
  starter: 'text-blue-400',
  pro: 'text-red-400',
  premium: 'text-amber-400',
};

const planColumnHighlight: Record<string, string> = {
  free: '',
  starter: '',
  pro: 'bg-red-500/[0.04]',
  premium: '',
};

interface PricingPageClientProps {
  content: PricingContent;
  footer?: React.ReactNode;
}

export function PricingPageClient({ content, footer }: PricingPageClientProps) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-red-500/[0.07] rounded-full blur-[120px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/[0.05] rounded-full blur-[100px]" />
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                <Sparkles className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-medium text-neutral-300">ราคา</span>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                ราคาเรียบง่าย{' '}
                <span className="bg-gradient-to-r from-red-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                  โปร่งใส
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
                {content.hero.subtitle}
              </p>
            </FadeIn>

          </div>
        </section>

        {/* Pricing Cards - All 4 plans */}
        <section className="relative py-4 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-start">
              {PRICING_PLANS.map((plan, index) => (
                <PricingCard key={plan.id} plan={plan} delay={index * 0.08} />
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 sm:py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-3">
                เปรียบเทียบแผนอย่างละเอียด
              </h2>
              <p className="text-sm sm:text-base text-neutral-500">
                ดูว่าแต่ละแผนมีอะไรบ้าง
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="overflow-x-auto rounded-2xl border border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800/80">
                      <th className="py-5 px-5 text-left text-sm font-semibold text-neutral-300">
                        ฟีเจอร์
                      </th>
                      {(['free', 'starter', 'pro', 'premium'] as const).map((planKey) => {
                        const plan = PRICING_PLANS.find(p => p.id === planKey);
                        return (
                          <th key={planKey} className={cn(
                            'py-5 px-4 text-center text-sm font-bold',
                            planHeaderColors[planKey],
                            planColumnHighlight[planKey]
                          )}>
                            <div>{plan?.name}</div>
                            <div className="text-xs font-normal text-neutral-500 mt-0.5">
                              ฿{plan?.price.toLocaleString()}/เดือน
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, index) => (
                      <tr
                        key={feature.name}
                        className={cn(
                          'border-b border-neutral-800/40 transition-colors hover:bg-white/[0.02]',
                          index % 2 === 0 ? 'bg-white/[0.01]' : ''
                        )}
                      >
                        <td className="py-3.5 px-5 text-sm text-neutral-400">
                          {feature.name}
                        </td>
                        {(['free', 'starter', 'pro', 'premium'] as const).map((planKey) => {
                          const val = feature[planKey];
                          return (
                            <td
                              key={planKey}
                              className={cn(
                                'py-3.5 px-4 text-center',
                                planColumnHighlight[planKey]
                              )}
                            >
                              {typeof val === 'boolean' ? (
                                val ? (
                                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-neutral-700 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-neutral-300">
                                  {val}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Available Models */}
        <section className="py-16 sm:py-20 lg:py-28 border-t border-neutral-800/50">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-3">
                โมเดล AI ที่พร้อมใช้งาน
              </h2>
              <p className="text-sm sm:text-base text-neutral-500">
                เข้าถึงโมเดล AI ที่ทรงพลังที่สุดในที่เดียว
              </p>
            </FadeIn>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {AI_MODELS.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="p-3 sm:p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={model.icon} alt={model.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-white truncate">
                        {model.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-neutral-500">
                        {model.provider}
                      </p>
                    </div>
                    <Badge
                      variant={model.tier === 'free' ? 'success' : 'info'}
                      size="sm"
                      className="shrink-0 text-[10px] sm:text-xs"
                    >
                      {model.tier === 'free' ? 'ฟรี' : 'สมาชิก'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2 line-clamp-2">
                    {model.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 lg:py-28 border-t border-neutral-800/50">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-3">
                คำถามที่พบบ่อย
              </h2>
            </FadeIn>

            <div className="space-y-3 sm:space-y-4">
              {content.faqs.map((faq, index) => (
                <FadeIn key={faq.question} delay={index * 0.05}>
                  <div className="p-4 sm:p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                    <h3 className="flex items-start gap-2 text-sm sm:text-base font-semibold text-white mb-2">
                      <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0 mt-0.5" />
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 pl-6 sm:pl-7 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-rose-600/10 to-orange-600/20" />
          <div className="absolute inset-0 bg-neutral-950/80" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-4">
              {content.cta.title}
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 mb-8">
              {content.cta.subtitle}
            </p>
            <Button
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border-0 text-white shadow-lg shadow-red-500/20 w-full sm:w-auto"
              asChild
            >
              <Link href="/chat">เริ่มต้นใช้งานฟรี</Link>
            </Button>
          </div>
        </section>
      </main>

      {footer}
    </div>
  );
}
