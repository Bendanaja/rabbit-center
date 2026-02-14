'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Globe,
  MessageSquare,
  Bot,
  Layers,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { BentoGrid } from '@/components/home';
import { AI_MODELS, PRICING_PLANS, SITE_CONFIG } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative hero-gradient overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 dot-pattern opacity-50" />
          <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 md:w-96 h-64 md:h-96 bg-primary-100/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <FadeIn>
                <Badge variant="primary" size="md" className="mb-4 sm:mb-6">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  รองรับ 7+ โมเดล AI
                </Badge>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                  แชทกับ AI{' '}
                  <span className="gradient-text">ที่ดีที่สุดในโลก</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                  {SITE_CONFIG.description}
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/chat">เริ่มแชทฟรี</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/pricing">ดูราคา</Link>
                  </Button>
                </div>
              </FadeIn>

              {/* Model icons */}
              <FadeIn delay={0.4}>
                <div className="mt-8 sm:mt-12">
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-3 sm:mb-4">
                    ขับเคลื่อนโดย AI ชั้นนำของโลก
                  </p>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-2">
                    {AI_MODELS.slice(0, 5).map((model, index) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800"
                      >
                        <div className="relative h-5 w-5 sm:h-6 sm:w-6 rounded-md overflow-hidden">
                          <Image src={model.icon} alt={model.name} fill sizes="24px" className="object-cover" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hidden xs:inline">
                          {model.name}
                        </span>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 }}
                      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800"
                    >
                      <span className="text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-400">
                        +{AI_MODELS.length - 5} อีก
                      </span>
                    </motion.div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Chat preview mockup - Live conversation */}
            <FadeIn delay={0.5}>
              <div className="mt-10 sm:mt-16 max-w-3xl mx-auto px-4">
                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/20 border border-neutral-200 dark:border-neutral-800 bg-neutral-900">
                  {/* Browser header */}
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-neutral-800 border-b border-neutral-700">
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500" />
                      <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500" />
                      <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 mx-2 sm:mx-4">
                      <div className="h-6 sm:h-7 bg-neutral-700 rounded-lg flex items-center justify-center px-3">
                        <span className="text-[10px] sm:text-xs text-neutral-400">
                          rabbithub.app/chat
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chat content - Animated conversation */}
                  <div className="p-4 sm:p-6 space-y-4 min-h-[280px] sm:min-h-[320px] bg-gradient-to-b from-neutral-900 to-neutral-950">
                    {/* User message 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      className="flex justify-end"
                    >
                      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-lg shadow-primary-500/20">
                        <p className="text-sm">สวัสดีครับ! ช่วยอธิบาย AI ให้เข้าใจง่ายๆ หน่อย</p>
                      </div>
                    </motion.div>

                    {/* AI response 1 - with typing effect */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3, duration: 0.4 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-xl shrink-0 shadow-lg shadow-purple-500/30 overflow-hidden">
                        <Image src="/images/models/claude.svg" alt="Claude" width={32} height={32} className="w-full h-full" />
                      </div>
                      <div className="bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-neutral-700">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-purple-400">Claude 4.5</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        </div>
                        <motion.p
                          className="text-sm text-neutral-300 leading-relaxed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.6, duration: 0.5 }}
                        >
                          สวัสดีค่ะ! AI หรือ Artificial Intelligence คือการทำให้คอมพิวเตอร์คิดและเรียนรู้ได้เหมือนมนุษย์ เช่น ตอบคำถาม แปลภาษา หรือสร้างรูปภาพ ✨
                        </motion.p>
                      </div>
                    </motion.div>

                    {/* User message 2 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 2.5, duration: 0.4 }}
                      className="flex justify-end"
                    >
                      <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] shadow-lg shadow-primary-500/20">
                        <p className="text-sm">แล้วมีอะไรที่น่าตื่นเต้นในปีนี้บ้าง? 🤔</p>
                      </div>
                    </motion.div>

                    {/* AI typing indicator */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 3, duration: 0.3 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-xl shrink-0 shadow-lg shadow-green-500/30 overflow-hidden">
                        <Image src="/images/models/openai.svg" alt="OpenAI" width={32} height={32} className="w-full h-full" />
                      </div>
                      <div className="bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-neutral-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-green-400">ChatGPT 5.2</span>
                          <span className="text-[10px] text-neutral-500">กำลังพิมพ์...</span>
                        </div>
                        {/* Typing dots - spring animation */}
                        <div className="flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-2 w-2 rounded-full bg-green-400 animate-[scalePulse_0.8s_ease-in-out_infinite]"
                              style={{ willChange: 'transform, opacity', animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Input bar */}
                  <div className="px-4 py-3 bg-neutral-800 border-t border-neutral-700">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-neutral-700 rounded-xl px-4 py-2.5 flex items-center">
                        <span className="text-sm text-neutral-500">พิมพ์ข้อความ...</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30"
                        style={{ willChange: 'transform' }}
                      >
                        <ArrowRight className="h-5 w-5 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Features Section - Bento Grid */}
        <section className="py-12 sm:py-16 lg:py-32 bg-neutral-950 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-8 sm:mb-12 lg:mb-16">
              <Badge variant="default" size="md" className="mb-3 sm:mb-4">
                ฟีเจอร์
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-3 sm:mb-4">
                ทุกสิ่งที่คุณต้องการสำหรับ AI
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-neutral-400 max-w-2xl mx-auto px-4">
                แพลตฟอร์มที่ทรงพลังเพื่อการสนทนากับ AI อย่างราบรื่น
              </p>
            </FadeIn>

            <BentoGrid />
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-12 sm:py-16 lg:py-32 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-8 sm:mb-12 lg:mb-16">
              <Badge variant="default" size="md" className="mb-3 sm:mb-4">
                ราคา
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4">
                ราคาเรียบง่าย โปร่งใส
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto px-4">
                เริ่มต้นฟรี อัปเกรดเมื่อต้องการ
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
              {PRICING_PLANS.map((plan, index) => (
                <FadeIn key={plan.id} delay={index * 0.1}>
                  <div
                    className={`relative rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 h-full ${
                      plan.popular
                        ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white ring-2 sm:ring-4 ring-primary-500/20'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-amber-400 text-amber-900 text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          ยอดนิยม
                        </Badge>
                      </div>
                    )}

                    <h3
                      className={`text-lg sm:text-xl font-display font-bold mb-1 sm:mb-2 ${
                        plan.popular ? 'text-white' : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {plan.name}
                    </h3>

                    <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                      <span
                        className={`text-3xl sm:text-4xl font-display font-bold ${
                          plan.popular ? 'text-white' : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {plan.currency}{plan.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-sm sm:text-base ${plan.popular ? 'text-primary-200' : 'text-neutral-500'}`}
                      >
                        /{plan.period}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-4 sm:mb-6">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                              plan.popular ? 'text-primary-200' : 'text-green-500'
                            }`}
                          />
                          <span
                            className={`text-xs sm:text-sm ${
                              plan.popular ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'secondary' : 'primary'}
                      className={`w-full justify-center text-sm sm:text-base ${
                        plan.popular && 'bg-white text-primary-700 hover:bg-neutral-100'
                      }`}
                      asChild
                    >
                      <Link href="/pricing">{plan.cta}</Link>
                    </Button>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-32 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-10" />
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-white/5 rounded-full blur-3xl" />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
                พร้อมสัมผัสอนาคตของ AI แชทหรือยัง?
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-sm sm:text-base lg:text-lg text-primary-100 mb-6 sm:mb-8 px-4">
                เข้าร่วมกับผู้ใช้นับพันที่กำลังแชทกับ AI ที่ดีที่สุด
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="bg-white text-primary-700 hover:bg-neutral-100 w-full sm:w-auto"
                asChild
              >
                <Link href="/chat">เริ่มต้นใช้งานฟรี</Link>
              </Button>
            </FadeIn>
          </div>
        </section>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
