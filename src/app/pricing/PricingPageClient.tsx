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
  { name: 'ข้อความต่อวัน', free: '50', starter: '200', pro: 'ไม่จำกัด', premium: 'ไม่จำกัด' },
  { name: 'โมเดล AI', free: '3 โมเดล', starter: '5 โมเดล', pro: 'ทุกโมเดล', premium: 'ทุกโมเดล + ก่อนใคร' },
  { name: 'สร้างรูปภาพ', free: false, starter: '10/วัน', pro: '50/วัน', premium: 'ไม่จำกัด' },
  { name: 'สร้างวิดีโอ', free: false, starter: false, pro: '5/วัน', premium: '20/วัน' },
  { name: 'ประวัติแชท', free: '7 วัน', starter: '30 วัน', pro: 'ไม่จำกัด', premium: 'ไม่จำกัด' },
  { name: 'ส่งออกบทสนทนา', free: false, starter: false, pro: true, premium: true },
  { name: 'คำสั่งกำหนดเอง', free: false, starter: false, pro: true, premium: true },
  { name: 'ความเร็ว', free: 'ปกติ', starter: 'ปกติ', pro: 'สูง', premium: 'สูงสุด + ลำดับความสำคัญ' },
  { name: 'เข้าถึง API', free: false, starter: false, pro: false, premium: true },
  { name: 'ปรับแต่ง AI ส่วนตัว', free: false, starter: false, pro: false, premium: true },
  { name: 'การสนับสนุนพิเศษ', free: false, starter: 'แชท', pro: 'แชท + อีเมล', premium: '24/7' },
  { name: 'SLA รับประกัน', free: false, starter: false, pro: false, premium: '99.9%' },
];

const paidPlans = PRICING_PLANS.filter(p => p.id !== 'free');

interface PricingPageClientProps {
  content: PricingContent;
  footer?: React.ReactNode;
}

export function PricingPageClient({ content, footer }: PricingPageClientProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-10 sm:py-16 lg:py-24 bg-gradient-red relative overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-30" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <Badge variant="primary" size="md" className="mb-4 sm:mb-6">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                ราคาเรียบง่าย
              </Badge>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 px-2">
                {content.hero.title}
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
                {content.hero.subtitle}
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Free plan banner */}
        <section className="py-4 sm:py-6 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    แผนฟรี - 0 บาท
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    ทดลองใช้งาน 30 ข้อความ/วัน ไม่ต้องสมัครสมาชิก ไม่ต้องใช้บัตรเครดิต
                  </p>
                </div>
                <Button variant="outline" size="md" asChild>
                  <Link href="/chat">เริ่มใช้งานฟรี</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Pricing Cards - 3 paid plans */}
        <section className="py-8 sm:py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {paidPlans.map((plan, index) => (
                <PricingCard key={plan.id} plan={plan} delay={index * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-10 sm:py-16 lg:py-24 bg-white dark:bg-neutral-900">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-6 sm:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2 sm:mb-4">
                เปรียบเทียบแผนอย่างละเอียด
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                ดูว่าแต่ละแผนมีอะไรบ้าง
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="py-4 px-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">
                        ฟีเจอร์
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                        Free
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Starter (199)
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                        Pro (499)
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Premium (799)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((feature, index) => (
                      <tr
                        key={feature.name}
                        className={`border-b border-neutral-100 dark:border-neutral-800 ${
                          index % 2 === 0 ? 'bg-neutral-50/50 dark:bg-neutral-800/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                          {feature.name}
                        </td>
                        {(['free', 'starter', 'pro', 'premium'] as const).map((planKey) => {
                          const val = feature[planKey];
                          return (
                            <td
                              key={planKey}
                              className={cn(
                                'py-3 px-4 text-center',
                                planKey === 'pro' && 'bg-primary-50/30 dark:bg-primary-900/10'
                              )}
                            >
                              {typeof val === 'boolean' ? (
                                val ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-neutral-300 dark:text-neutral-600 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
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
        <section className="py-10 sm:py-16 lg:py-24 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-6 sm:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2 sm:mb-4">
                โมเดล AI ที่พร้อมใช้งาน
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                เข้าถึงโมเดล AI ที่ทรงพลังที่สุด ผ่าน BytePlus
              </p>
            </FadeIn>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {AI_MODELS.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 touch-feedback"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={model.icon} alt={model.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                        {model.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                        {model.provider}
                      </p>
                    </div>
                    {model.tier !== 'free' && (
                      <Badge variant="warning" size="sm" className="shrink-0 text-[10px] sm:text-xs">
                        โปร
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                    {model.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 sm:py-16 lg:py-24 bg-white dark:bg-neutral-900">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-6 sm:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2 sm:mb-4">
                คำถามที่พบบ่อย
              </h2>
            </FadeIn>

            <div className="space-y-3 sm:space-y-4">
              {content.faqs.map((faq, index) => (
                <FadeIn key={faq.question} delay={index * 0.05}>
                  <div className="p-4 sm:p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 touch-feedback">
                    <h3 className="flex items-start gap-2 text-sm sm:text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                      <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 shrink-0 mt-0.5" />
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-400 pl-6 sm:pl-7">
                      {faq.answer}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-16 lg:py-20 bg-gradient-to-br from-primary-600 to-primary-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-3 sm:mb-4">
              {content.cta.title}
            </h2>
            <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8">
              {content.cta.subtitle}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary-700 hover:bg-neutral-100 w-full sm:w-auto"
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
