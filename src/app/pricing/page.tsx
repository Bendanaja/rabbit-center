'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, HelpCircle } from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PricingCard } from '@/components/pricing';
import { FadeIn } from '@/components/animations';
import { PRICING_PLANS, AI_MODELS } from '@/lib/constants';

const faqs = [
  {
    question: 'สามารถเปลี่ยนแผนได้ตลอดเวลาไหม?',
    answer: 'ได้เลย! คุณสามารถอัปเกรด ดาวน์เกรด หรือยกเลิกการสมัครสมาชิกได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลในรอบบิลถัดไป',
  },
  {
    question: 'รับชำระเงินด้วยวิธีใดบ้าง?',
    answer: 'เรารับบัตรเครดิตทุกประเภท, พร้อมเพย์ และโอนเงินผ่านธนาคาร สำหรับลูกค้าองค์กรสามารถชำระผ่านใบแจ้งหนี้ได้',
  },
  {
    question: 'มีทดลองใช้ฟรีสำหรับแผน Pro ไหม?',
    answer: 'เรามีทดลองใช้ฟรี 7 วันสำหรับแผน Pro ไม่ต้องใช้บัตรเครดิตในการเริ่มต้น',
  },
  {
    question: 'จะเกิดอะไรขึ้นกับแชทถ้าดาวน์เกรด?',
    answer: 'ประวัติแชทของคุณจะถูกเก็บรักษาไว้เมื่อดาวน์เกรด คุณยังสามารถดูบทสนทนาที่ผ่านมาได้ แต่ฟีเจอร์ใหม่จะถูกจำกัดตามแผนใหม่ของคุณ',
  },
  {
    question: 'มีการคืนเงินไหม?',
    answer: 'มีครับ เรามีการรับประกันคืนเงินภายใน 14 วันสำหรับทุกแผนที่ชำระเงิน โดยไม่ต้องมีเหตุผล',
  },
  {
    question: 'สามารถใช้ RabbitHub สำหรับธุรกิจได้ไหม?',
    answer: 'ได้แน่นอน! แผน Enterprise ของเราออกแบบมาสำหรับทีมและธุรกิจ พร้อมฟีเจอร์เช่น SSO, แดชบอร์ดผู้ดูแล และการสนับสนุนเฉพาะ',
  },
];

const comparisonFeatures = [
  { name: 'ข้อความต่อวัน', free: '50', pro: 'ไม่จำกัด', enterprise: 'ไม่จำกัด' },
  { name: 'GPT-3.5 Turbo', free: true, pro: true, enterprise: true },
  { name: 'GPT-4', free: false, pro: true, enterprise: true },
  { name: 'Claude 3 Opus', free: false, pro: true, enterprise: true },
  { name: 'Gemini Pro', free: false, pro: true, enterprise: true },
  { name: 'Mistral Large', free: false, pro: true, enterprise: true },
  { name: 'Llama 3 70B', free: false, pro: true, enterprise: true },
  { name: 'ประวัติแชท', free: '7 วัน', pro: 'ไม่จำกัด', enterprise: 'ไม่จำกัด' },
  { name: 'ส่งออกบทสนทนา', free: false, pro: true, enterprise: true },
  { name: 'คำสั่งกำหนดเอง', free: false, pro: true, enterprise: true },
  { name: 'การสนับสนุนพิเศษ', free: false, pro: true, enterprise: true },
  { name: 'เข้าถึง API', free: false, pro: false, enterprise: true },
  { name: 'สมาชิกทีม', free: false, pro: false, enterprise: 'สูงสุด 10 คน' },
  { name: 'เชื่อมต่อ SSO', free: false, pro: false, enterprise: true },
  { name: 'การสนับสนุนเฉพาะ', free: false, pro: false, enterprise: true },
];

export default function PricingPage() {
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
                เลือกแผนที่เหมาะกับคุณ
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
                เริ่มต้นฟรีและขยายตามความต้องการ ทุกแผนรับประกันคืนเงินภายใน 14 วัน
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 sm:py-16 lg:py-20 -mt-4 sm:-mt-8">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {PRICING_PLANS.map((plan, index) => (
                <PricingCard key={plan.id} plan={plan} delay={index * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-10 sm:py-16 lg:py-24 bg-white dark:bg-neutral-900">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
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
                      <th className="py-4 px-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                        ฟรี
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                        โปร
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-neutral-900 dark:text-white">
                        องค์กร
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
                        <td className="py-3 px-4 text-center">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-neutral-300 dark:text-neutral-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {feature.free}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-primary-50/30 dark:bg-primary-900/10">
                          {typeof feature.pro === 'boolean' ? (
                            feature.pro ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-neutral-300 dark:text-neutral-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {feature.pro}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.enterprise === 'boolean' ? (
                            feature.enterprise ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-neutral-300 dark:text-neutral-600 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {feature.enterprise}
                            </span>
                          )}
                        </td>
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
                เข้าถึงโมเดล AI ที่ทรงพลังที่สุดในโลก
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
              {faqs.map((faq, index) => (
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
              พร้อมเริ่มต้นหรือยัง?
            </h2>
            <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8">
              เริ่มต้นด้วยแผนฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต
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

      <Footer />
    </div>
  );
}
