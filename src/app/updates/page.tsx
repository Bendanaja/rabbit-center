'use client';

import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Sparkles,
  Star,
  Zap,
  Bug,
  Rocket,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Gift,
  Shield,
  Cpu,
  Mic,
  Image as ImageIcon,
  Users
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { Button, Badge } from '@/components/ui';

type UpdateType = 'new' | 'improved' | 'fixed';

interface Update {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: {
    type: UpdateType;
    text: string;
  }[];
  highlight?: boolean;
  icon?: typeof Sparkles;
}

const updates: Update[] = [
  {
    version: 'v2.5.0',
    date: '1 กุมภาพันธ์ 2026',
    title: 'เพิ่มการรองรับ Claude 3.5 Sonnet',
    description: 'อัพเดทครั้งสำคัญ! เพิ่มโมเดลใหม่และปรับปรุงประสิทธิภาพโดยรวม',
    highlight: true,
    icon: Cpu,
    changes: [
      { type: 'new', text: 'รองรับ Claude 3.5 Sonnet จาก Anthropic' },
      { type: 'new', text: 'ระบบ Memory ที่จำบริบทได้ยาวขึ้น 50%' },
      { type: 'improved', text: 'ความเร็วในการตอบสนองเร็วขึ้น 30%' },
      { type: 'improved', text: 'UI/UX ของหน้าแชทใหม่ทั้งหมด' },
      { type: 'fixed', text: 'แก้ไขปัญหาการแสดงผล Code Block' },
    ]
  },
  {
    version: 'v2.4.2',
    date: '25 มกราคม 2026',
    title: 'ปรับปรุงประสบการณ์บนมือถือ',
    description: 'โฟกัสที่การใช้งานบนอุปกรณ์มือถือให้ราบรื่นยิ่งขึ้น',
    icon: TrendingUp,
    changes: [
      { type: 'improved', text: 'ปรับปรุง Mobile UI ให้ใช้งานง่ายขึ้น' },
      { type: 'improved', text: 'เพิ่ม Touch Gestures สำหรับการนำทาง' },
      { type: 'fixed', text: 'แก้ไขปัญหาแป้นพิมพ์บน iOS' },
      { type: 'fixed', text: 'แก้ไขการ Scroll ที่ไม่ราบรื่น' },
    ]
  },
  {
    version: 'v2.4.0',
    date: '15 มกราคม 2026',
    title: 'เพิ่มระบบ Team Collaboration',
    description: 'ทำงานร่วมกับทีมได้ง่ายขึ้นด้วยฟีเจอร์ใหม่',
    icon: Users,
    changes: [
      { type: 'new', text: 'ระบบ Shared Workspaces สำหรับทีม' },
      { type: 'new', text: 'การจัดการสิทธิ์สมาชิก' },
      { type: 'new', text: 'แชร์บทสนทนาภายในทีม' },
      { type: 'improved', text: 'Dashboard ผู้ดูแลระบบใหม่' },
    ]
  },
  {
    version: 'v2.3.5',
    date: '8 มกราคม 2026',
    title: 'อัพเดทความปลอดภัย',
    description: 'เพิ่มระดับความปลอดภัยและแก้ไขช่องโหว่',
    icon: Shield,
    changes: [
      { type: 'improved', text: 'เพิ่ม Two-Factor Authentication' },
      { type: 'improved', text: 'ปรับปรุงการเข้ารหัสข้อมูล' },
      { type: 'fixed', text: 'แก้ไขช่องโหว่ด้านความปลอดภัย' },
    ]
  },
  {
    version: 'v2.3.0',
    date: '1 มกราคม 2026',
    title: 'ฟีเจอร์ปีใหม่! Voice Chat',
    description: 'คุยกับ AI ด้วยเสียงได้แล้ว',
    icon: Mic,
    highlight: true,
    changes: [
      { type: 'new', text: 'Voice Input - พูดแทนพิมพ์' },
      { type: 'new', text: 'Text-to-Speech - ฟังคำตอบเป็นเสียง' },
      { type: 'new', text: 'รองรับภาษาไทยและอังกฤษ' },
      { type: 'improved', text: 'ปรับปรุง Real-time Streaming' },
    ]
  },
  {
    version: 'v2.2.0',
    date: '20 ธันวาคม 2025',
    title: 'เพิ่ม Gemini Pro Support',
    description: 'รองรับโมเดลใหม่จาก Google',
    icon: ImageIcon,
    changes: [
      { type: 'new', text: 'รองรับ Gemini Pro และ Gemini Pro Vision' },
      { type: 'new', text: 'อัพโหลดรูปภาพเพื่อวิเคราะห์' },
      { type: 'improved', text: 'ปรับปรุง Model Selector UI' },
    ]
  },
];

const tagStyles: Record<UpdateType, { bg: string; text: string; icon: typeof Sparkles; glow: string }> = {
  new: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    icon: Sparkles,
    glow: 'shadow-emerald-500/50'
  },
  improved: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    icon: Zap,
    glow: 'shadow-blue-500/50'
  },
  fixed: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    icon: Bug,
    glow: 'shadow-amber-500/50'
  },
};

const tagLabels: Record<UpdateType, string> = {
  new: 'ใหม่',
  improved: 'ปรับปรุง',
  fixed: 'แก้ไข',
};

// Animated counter for stats
function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useState(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-3xl sm:text-4xl font-bold text-white font-mono">
        {displayValue}{suffix}
      </div>
      <div className="text-sm text-neutral-400 mt-1">{label}</div>
    </motion.div>
  );
}

// Timeline update card with advanced animations
function UpdateCard({ update, index }: { update: Update; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isExpanded, setIsExpanded] = useState(false);

  const Icon = update.icon || Rocket;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      className="relative"
    >
      {/* Connector line glow effect */}
      <motion.div
        initial={{ height: 0 }}
        animate={isInView ? { height: "100%" } : {}}
        transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
        className="absolute left-[19px] top-10 w-0.5 bg-gradient-to-b from-primary-500/50 to-transparent"
        style={{ height: index === updates.length - 1 ? 0 : 'calc(100% + 2rem)' }}
      />

      <div className="flex gap-6">
        {/* Timeline node */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{
              type: "spring",
              stiffness: 200,
              delay: index * 0.1 + 0.2
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${
              update.highlight
                ? 'bg-gradient-to-br from-primary-500 to-rose-500 shadow-lg shadow-primary-500/50'
                : 'bg-neutral-800 border border-neutral-700'
            }`}
          >
            <Icon className={`h-5 w-5 ${update.highlight ? 'text-white' : 'text-neutral-400'}`} />
          </motion.div>

          {/* Pulse effect for highlighted items */}
          {update.highlight && (
            <div className="absolute inset-0 rounded-xl bg-primary-500/30 animate-ping" />
          )}
        </div>

        {/* Content card */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`flex-1 p-6 rounded-2xl border backdrop-blur-sm cursor-pointer ${
            update.highlight
              ? 'bg-gradient-to-br from-primary-950/80 to-rose-950/50 border-primary-500/30'
              : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                update.highlight
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {update.version}
            </motion.span>
            <span className="text-sm text-neutral-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {update.date}
            </span>
            {update.highlight && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-xs font-medium animate-pulse"
              >
                <Flame className="h-3 w-3" />
                Hot
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
            {update.title}
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            {update.description}
          </p>

          {/* Changes list with stagger animation */}
          <AnimatePresence>
            <motion.ul
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {update.changes.slice(0, isExpanded ? undefined : 3).map((change, i) => {
                const style = tagStyles[change.type];
                const TagIcon = style.icon;
                return (
                  <motion.li
                    key={i}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className="flex items-start gap-2 group/item"
                  >
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                    >
                      <TagIcon className="h-3 w-3" />
                      {tagLabels[change.type]}
                    </motion.span>
                    <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                      {change.text}
                    </span>
                  </motion.li>
                );
              })}
            </motion.ul>
          </AnimatePresence>

          {/* Expand/collapse indicator */}
          {update.changes.length > 3 && (
            <div className="mt-3 text-xs text-primary-400 flex items-center gap-1 animate-text-shimmer">
              {isExpanded ? 'ซ่อน' : `+${update.changes.length - 3} รายการเพิ่มเติม`}
              <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function UpdatesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Parallax */}
        <motion.section
          ref={heroRef}
          className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          {/* Animated background */}
          <div className="absolute inset-0">
            {/* Gradient orbs - CSS animation */}
            <div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[128px] animate-drift"
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-[128px] animate-drift-slow"
            />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}
            />

            {/* Floating particles - CSS animation */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary-500/50 rounded-full animate-sparkle"
                style={{
                  left: `${(i * 5) % 100}%`,
                  top: `${(i * 7 + 10) % 100}%`,
                  animationDuration: `${3 + (i % 4)}s`,
                  animationDelay: `${(i * 0.3) % 3}s`,
                }}
              />
            ))}
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
              >
                <div className="animate-[spin_4s_linear_infinite]">
                  <Rocket className="h-4 w-4 text-primary-400" />
                </div>
                <span className="text-sm text-neutral-300">Changelog</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                  {updates.length} อัพเดท
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  อัพเดท
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                  ล่าสุด
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                ติดตามการพัฒนาและฟีเจอร์ใหม่ๆ ของ RabbitHub
                <br />
                <span className="text-neutral-500">เราพัฒนาทุกวันเพื่อคุณ</span>
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-medium flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  สมัครรับข่าวสาร
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  ดู Roadmap
                  <ArrowUpRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-scroll-dot" />
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <section className="py-12 bg-neutral-900/50 border-y border-neutral-800">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedStat value={25} label="อัพเดทในปีนี้" suffix="+" />
              <AnimatedStat value={150} label="ฟีเจอร์ใหม่" suffix="+" />
              <AnimatedStat value={99} label="Uptime" suffix="%" />
              <AnimatedStat value={50} label="Bug Fixes" suffix="+" />
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-400 mb-4">
                <Clock className="h-4 w-4" />
                Timeline
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                ประวัติการอัพเดท
              </h2>
            </motion.div>

            {/* Timeline */}
            <div className="space-y-8">
              {updates.map((update, index) => (
                <UpdateCard key={update.version} update={update} index={index} />
              ))}
            </div>

            {/* Load more */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium flex items-center gap-2 mx-auto hover:bg-white/10 transition-colors"
              >
                ดูอัพเดทเพิ่มเติม
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Subscribe CTA */}
        <section className="py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-8 sm:p-12 rounded-3xl overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-rose-600/20 backdrop-blur-xl" />
              <div className="absolute inset-0 border border-primary-500/20 rounded-3xl" />

              {/* Animated glow - CSS */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/30 rounded-full blur-[80px] animate-glow-pulse-slow"
              />

              <div className="relative text-center">
                <div className="inline-block mb-4 animate-wiggle-slow">
                  <Gift className="h-12 w-12 text-primary-400" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  ไม่พลาดอัพเดทใหม่ๆ
                </h2>
                <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                  สมัครรับข่าวสารเพื่อรับแจ้งเตือนทันทีเมื่อมีฟีเจอร์ใหม่
                </p>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-white text-neutral-900 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    สมัคร
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
