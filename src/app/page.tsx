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
  ImagePlus,
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
        {/* Immersive Hero Section */}
        <section className="relative min-h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-black pt-24 pb-16">
          {/* Deep ambient blur background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary-600/30 blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-primary-900/40 blur-[120px] rounded-full pointer-events-none" />

          {/* Subtle noise/grid */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full flex flex-col items-center">

            {/* Top Badge */}
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-pointer">
                <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-xs font-medium text-neutral-300">RabbitHub AI 2.0 มาแล้ว</span>
                <ArrowRight className="h-3 w-3 text-neutral-400" />
              </div>
            </FadeIn>

            {/* Massive Typography */}
            <FadeIn delay={0.1}>
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-black text-white mb-6 leading-[1.1] tracking-tighter text-center max-w-5xl mx-auto drop-shadow-2xl">
                ระบบนิเวศ AI ที่ <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-primary-400 via-rose-500 to-primary-600 bg-clip-text text-transparent opacity-90">ทรงพลังที่สุด</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-lg md:text-2xl text-neutral-400 mb-10 max-w-2xl mx-auto text-center font-light leading-relaxed">
                แชท สร้างรูปภาพ สร้างวิดีโอ และสร้างอนาคตของคุณด้วยโมเดล AI ระดับท็อปในพื้นที่ทำงานที่สวยงามล้ำสมัย
              </p>
            </FadeIn>

            {/* Premium CTA Buttons */}
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base h-14 px-8 rounded-2xl shadow-premium-glow hover:scale-105 transition-transform"
                  asChild
                >
                  <Link href="/chat">
                    เริ่มแชทฟรี
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base h-14 px-8 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md"
                  asChild
                >
                  <Link href="/pricing">ดูราคาแพ็กเกจ</Link>
                </Button>
              </div>
            </FadeIn>

            {/* Floating Glassmorphism Hero Image */}
            <FadeIn delay={0.5} className="w-full mt-16 md:mt-24 perspective-1000">
              <motion.div
                className="max-w-5xl mx-auto rounded-3xl overflow-hidden glass-premium border border-white/10 shadow-2xl relative"
                initial={{ rotateX: 20, y: 100, opacity: 0 }}
                animate={{ rotateX: 0, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 40 }}
              >
                {/* Browser header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10 backdrop-blur-md">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 max-w-sm mx-auto bg-white/5 rounded-md flex items-center justify-center border border-white/5">
                      <span className="text-xs text-neutral-400 font-mono">rabbithub.ai/chat</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="relative bg-neutral-950/50 flex flex-col p-4 sm:p-6 gap-3 sm:gap-4">
                  {/* AI Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="flex gap-2.5 sm:gap-3 max-w-[85%] sm:max-w-[70%]"
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/15">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/20" />
                        <Image src="/images/models/anthropic.svg" alt="Claude" fill className="object-contain p-1.5" />
                      </div>
                    </div>
                    <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm shadow-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Claude Sonnet 4</span>
                        <span className="text-[10px] text-neutral-500">12:34</span>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        ฉันสามารถช่วยคุณสร้างเว็บไซต์นี่ด้วย Framer Motion, Tailwind และ React เรามาสร้างอะไรสนุกๆ ต่อไปดีคะ? ✨
                      </p>
                    </div>
                  </motion.div>

                  {/* User Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] sm:max-w-[60%]">
                      <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-rose-700 px-4 py-3 rounded-2xl rounded-br-sm shadow-lg shadow-primary-600/30 ring-1 ring-white/10">
                        <div className="absolute inset-0 rounded-2xl rounded-br-sm bg-gradient-to-t from-black/5 to-white/5 pointer-events-none" />
                        <p className="relative text-sm text-white leading-relaxed">
                          มาออกแบบ UI สวยๆ สำหรับโชว์หน้าเว็บบรรทัดต่อไปกันเถอะ!
                        </p>
                      </div>
                      <p className="text-[10px] text-neutral-500 text-right mt-1 mr-1">12:35</p>
                    </div>
                  </motion.div>

                  {/* AI Typing Indicator */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.6 }}
                    className="flex gap-2.5 sm:gap-3 max-w-[50%]"
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/15">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/20" />
                        <Image src="/images/models/anthropic.svg" alt="Claude" fill className="object-contain p-1.5" />
                      </div>
                    </div>
                    <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm shadow-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Claude Sonnet 4</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-500/20">
                          <div className="w-1 h-1 rounded-full bg-amber-400 animate-[scalePulse_0.8s_ease-in-out_infinite]" />
                          <span className="text-[10px] font-medium text-amber-400">กำลังพิมพ์...</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-[scalePulse_0.8s_ease-in-out_infinite]"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Fake Input */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="w-full mt-1"
                  >
                    <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md">
                      <div className="flex items-center px-4 py-3">
                        <span className="text-neutral-500 text-sm flex-1">ส่งข้อความถึง RabbitHub...</span>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-rose-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                          <ArrowRight className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-3 pb-2.5">
                        <div className="p-1.5 rounded-lg text-neutral-500"><ImagePlus className="h-3.5 w-3.5" /></div>
                        <div className="p-1.5 rounded-lg text-neutral-500"><Globe className="h-3.5 w-3.5" /></div>
                        <div className="w-px h-3.5 bg-white/10 mx-0.5" />
                        <div className="p-1.5 rounded-lg text-neutral-500"><MessageSquare className="h-3.5 w-3.5" /></div>
                        <div className="p-1.5 rounded-lg text-neutral-500"><Sparkles className="h-3.5 w-3.5" /></div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* Global Logos Marquee */}
        <section className="py-10 border-y border-white/5 bg-neutral-950 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" />

          <div className="flex w-full">
            {/* Marquee Track */}
            <div className="flex animate-marquee hover:[animation-play-state:paused] items-center whitespace-nowrap gap-16 px-8">
              {/* Double the list for seamless loop */}
              {[...AI_MODELS, ...AI_MODELS, ...AI_MODELS].map((model, i) => (
                <div key={`${model.id}-${i}`} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group">
                  <div className="relative h-8 w-8 sm:h-10 sm:w-10 grayscale group-hover:grayscale-0 transition-all duration-300">
                    <Image src={model.icon} alt={model.name} fill sizes="40px" className="object-cover" />
                  </div>
                  <span className="text-lg sm:text-xl font-display font-medium text-white tracking-wide">{model.name}</span>
                </div>
              ))}
            </div>
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

        {/* Pricing Preview - Redesigned to 4 cards, Premium Glassmorphism */}
        <section className="py-24 sm:py-32 bg-neutral-950 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-primary-900/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-900/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-16 lg:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white mb-6">
                ราคาเรียบง่าย <span className="bg-gradient-to-r from-primary-400 to-rose-500 bg-clip-text text-transparent">โปร่งใส</span>
              </h2>
              <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-light">
                เริ่มต้นฟรี อัปเกรดเมื่อต้องการใช้งานฟีเจอร์ระดับทรงพลัง
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  id: 'free',
                  name: 'ฟรี',
                  price: 0,
                  period: 'เดือน',
                  features: ['ใช้ได้ Seed 1.6 Flash + GPT-OSS 120B', 'ค้นหาเว็บไม่จำกัด', 'ประวัติแชท 7 วัน'],
                  cta: 'เริ่มต้นใช้งาน',
                  popular: false,
                },
                {
                  id: 'starter',
                  name: 'เริ่มต้น',
                  price: 199,
                  period: 'เดือน',
                  features: ['ใช้ได้ทุกโมเดล', 'สร้างรูปภาพและวิดีโอได้', 'ค้นหาเว็บไม่จำกัด', 'ประวัติแชท 30 วัน'],
                  cta: 'เริ่มต้นใช้งาน',
                  popular: false,
                },
                {
                  id: 'pro',
                  name: 'โปร',
                  price: 499,
                  period: 'เดือน',
                  features: ['ใช้ได้ทุกโมเดล', 'สร้างรูปภาพและวิดีโอได้', 'ค้นหาเว็บไม่จำกัด', 'ประวัติแชทไม่จำกัด'],
                  cta: 'อัปเกรดเป็น Pro',
                  popular: true,
                },
                {
                  id: 'premium',
                  name: 'พรีเมียม',
                  price: 799,
                  period: 'เดือน',
                  features: ['ใช้ได้ทุกโมเดล', 'สร้างรูปภาพและวิดีโอได้', 'ค้นหาเว็บไม่จำกัด', 'ความเร็วสูงสุด'],
                  cta: 'อัปเกรดเป็น Premium',
                  popular: false,
                },
              ].map((plan, index) => (
                <FadeIn key={plan.id} delay={index * 0.1} className="h-full">
                  <div
                    className={`relative rounded-[2rem] p-8 h-full transition-all duration-300 hover-lift bg-neutral-900 border flex flex-col ${plan.popular
                      ? 'border-primary-500/50 shadow-[0_0_40px_-15px_rgba(239,68,68,0.4)] relative overflow-hidden group'
                      : 'border-white/5 hover:border-white/20'
                      }`}
                  >
                    {plan.popular && (
                      <>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-3xl rounded-full" />
                        <div className="absolute top-4 right-4 animate-bounce">
                          <Badge className="bg-primary-500 text-white border-0 shadow-lg">
                            <Sparkles className="h-3 w-3 mr-1" />
                            ยอดนิยม
                          </Badge>
                        </div>
                      </>
                    )}

                    <div className="mb-6 z-10">
                      <h3 className={`text-xl font-display font-bold mb-2 ${plan.popular ? 'text-white' : 'text-neutral-300'}`}>
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-display font-black tracking-tight ${plan.popular ? 'text-white' : 'text-neutral-100'}`}>
                          ฿{plan.price}
                        </span>
                        <span className="text-sm font-medium text-neutral-500">
                          /{plan.period}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1 z-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 shrink-0 ${plan.popular ? 'text-primary-400' : 'text-neutral-400'}`} />
                          <span className={`text-sm ${plan.popular ? 'text-neutral-200' : 'text-neutral-400'}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className={`w-full justify-center h-12 rounded-xl text-base font-semibold z-10 ${plan.popular
                        ? 'shadow-premium-glow group-hover:bg-primary-600 transition-colors'
                        : 'border-white/10 text-white bg-white/5 hover:bg-white/10 hover:border-white/20'
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
        <section className="py-24 sm:py-32 bg-black relative overflow-hidden flex justify-center border-t border-white/5">
          {/* Intense mesh gradient background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-gradient-to-r from-primary-600/40 via-rose-600/40 to-primary-900/40 blur-[100px] rounded-[100%] pointer-events-none animate-pulse-slow" />
          </div>

          <div className="relative max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 glass-premium border border-white/10 rounded-3xl p-12 sm:p-20 shadow-premium-glow">
            <FadeIn>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white mb-6 drop-shadow-lg leading-tight">
                ขับเคลื่อนอนาคตของคุณ<br />ด้วย AI ระดับโลก
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-lg sm:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto font-light">
                เข้าร่วมกับนักสร้างสรรค์นับพันคนที่เลือกใช้แพลตฟอร์ม AI ที่ล้ำสมัยและสวยงามที่สุดในขณะนี้
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="h-14 px-8 text-base shadow-premium-glow rounded-2xl hover:scale-105 transition-transform"
                  asChild
                >
                  <Link href="/auth/signup">สมัครใช้งานฟรี</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-colors"
                  asChild
                >
                  <Link href="/pricing">ดูแพ็กเกจทั้งหมด</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
