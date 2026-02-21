'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import {
  Layers,
  Zap,
  Shield,
  MessageSquare,
  Globe,
  Brain,
} from 'lucide-react';
import { AI_MODELS } from '@/lib/constants';

// Advanced Animated Counter
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums font-display tracking-tight">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Hover Glow Card Wrapper - creates the radial gradient following the mouse
function BentoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 group ${className}`}
    >
      {/* Background base */}
      <div className="absolute inset-0 bg-neutral-950/80 z-0" />

      {/* Radial hover glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(239, 68, 68, 0.15), transparent 40%)`,
        }}
      />

      {/* Border hover glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 mix-blend-overlay"
        style={{
          opacity: isHovered ? 1 : 0,
          boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, 0.2)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

export function BentoGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <div ref={containerRef} className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
      {/* Header for Bento Grid */}
      <div className="text-center mb-16 md:mb-24">
        <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-6">
          ทุกสิ่งที่คุณต้องการ <br className="hidden md:block" />
          <span className="text-neutral-500">ไม่มีส่วนเกิน</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px] sm:auto-rows-[300px]">

        {/* Card 1 - Multi-Model AI (Large Desktop span) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-2 lg:col-span-2 lg:row-span-2"
        >
          <BentoCard className="h-full">
            <div className="p-8 sm:p-10 flex flex-col h-full justify-between">
              <div className="max-w-xs">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20 flex items-center justify-center mb-6">
                  <Layers className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">เข้าถึงหลายโมเดลสุดล้ำ</h3>
                <p className="text-neutral-400">สลับใช้ระหว่างโมเดล AI ชั้นนำระดับโลกได้อย่างชาญฉลาดในพริบตาเดียว</p>
              </div>

              {/* Graphical Representation */}
              <div className="relative mt-8 h-48 w-full bg-black/50 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
                {/* Simulated floating model nodes */}
                <div className="absolute w-[200%] h-[200%] animate-[spin_30s_linear_infinite] opacity-50">
                  <div className="absolute top-1/2 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary-500/50 to-transparent" />
                  <div className="absolute top-1/4 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                </div>

                <div className="relative z-10 flex gap-4">
                  {[AI_MODELS[0], AI_MODELS[1], AI_MODELS[2]].map((model, i) => (
                    <motion.div
                      key={model.id}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                      className="h-14 w-14 rounded-2xl bg-neutral-900 border border-white/10 p-3 shadow-2xl flex items-center justify-center relative group backdrop-blur-md"
                    >
                      <Image src={model.icon} alt={model.name} fill className="object-cover p-3 grayscale group-hover:grayscale-0 transition-all rounded-xl" />
                      <div className="absolute -inset-2 bg-primary-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>

        {/* Card 2 - Supreme Speed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-1 lg:col-span-1"
        >
          <BentoCard className="h-full">
            <div className="p-8 flex flex-col h-full relative overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-6">
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Blazing Fast</h3>

              <div className="mt-auto flex items-end">
                <div className="text-5xl font-black text-white tracking-tighter">
                  <AnimatedCounter value={100} />
                </div>
                <span className="text-xl text-amber-500 font-bold ml-1 mb-1">ms</span>
              </div>
              <p className="text-neutral-500 text-sm font-medium mt-1">Average response time</p>

              {/* Fake grid lines */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 border-l border-t border-white/5 rounded-tl-3xl opacity-50" />
              <div className="absolute -right-12 -bottom-12 w-32 h-32 border-l border-t border-white/5 rounded-tl-3xl opacity-30" />
            </div>
          </BentoCard>
        </motion.div>

        {/* Card 3 - Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-1 lg:col-span-1"
        >
          <BentoCard className="h-full">
            <div className="p-8 flex flex-col h-full relative overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative z-10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">ปลอดภัยระดับองค์กร</h3>
              <p className="text-neutral-400 text-sm relative z-10">ระบบเข้ารหัส End-to-end รักษาข้อมูลของคุณให้ปลอดภัยสูงสุด</p>

              <div className="mt-auto flex gap-2 relative z-10">
                {['AES-256', 'SOC2', 'GDPR'].map((badge) => (
                  <span key={badge} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded font-bold border border-emerald-500/20">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Concentric scan lines */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 border border-emerald-500/10 rounded-full animate-[pulseRing_3s_ease-out_infinite]" />
              <div className="absolute -bottom-10 -right-10 w-44 h-44 border border-emerald-500/20 rounded-full animate-[pulseRing_3s_ease-out_infinite_1s]" />
            </div>
          </BentoCard>
        </motion.div>

        {/* Card 4 - Chat History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-1 lg:col-span-2"
        >
          <BentoCard className="h-full">
            <div className="p-8 flex flex-col sm:flex-row h-full gap-6">
              <div className="flex-1">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-6">
                  <MessageSquare className="h-5 w-5 text-violet-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">หน่วยความจำแชทไม่จำกัด</h3>
                <p className="text-neutral-400 text-sm mb-6 max-w-sm">ไม่พลาดทุกบริบท ประวัติการสนทนาถูกแบ็คอัพเก็บไว้และค้นหาเจอได้อย่างรวดเร็วทันที</p>
              </div>

              {/* Graphic UI mockup */}
              <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col gap-3 overflow-hidden relative rotate-2 max-h-40 sm:max-h-full">
                <div className="w-full h-8 bg-white/5 rounded-lg shimmer-mask opacity-50" />
                <div className="w-3/4 h-8 bg-violet-500/20 border border-violet-500/30 rounded-lg ml-auto" />
                <div className="w-full h-16 bg-white/5 rounded-lg shimmer-mask opacity-50" />

                {/* Glow overlay */}
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-500/20 blur-2xl" />
              </div>
            </div>
          </BentoCard>
        </motion.div>

        {/* Card 5 - Smart Context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="md:col-span-2 lg:col-span-1"
        >
          <BentoCard className="h-full">
            <div className="p-8 flex flex-col h-full items-center justify-center text-center relative overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 z-0 opacity-20"
                style={{
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(56, 189, 248, 0.2) 100%)',
                }}
              />
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 flex items-center justify-center mb-6 relative z-10">
                <Brain className="h-6 w-6 text-sky-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">เข้าใจบริบทอย่างลึกซึ้ง</h3>
              <p className="text-neutral-400 text-sm relative z-10">AI ช่วยจดจำและทำความเข้าใจรายละเอียดของงานของคุณแบบไม่มีสะดุด</p>
            </div>
          </BentoCard>
        </motion.div>

        {/* Card 6 - Global Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="md:col-span-1 lg:col-span-1"
        >
          <BentoCard className="h-full">
            <div className="p-8 flex flex-col h-full bg-[url('/grid.svg')] bg-opacity-10 bg-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 flex items-center justify-center mb-6">
                <Globe className="h-5 w-5 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ความเสถียรระดับโกลบอล</h3>
              <p className="text-neutral-400 text-sm">วางระบบบน Edge Server ลดความหน่วง ใช้งานได้ลื่นไหลทั่วโลก</p>

              <div className="mt-auto pt-6 flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-400">{i}</span>
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-rose-500/20 flex items-center justify-center text-rose-500 text-[10px] font-bold">
                  99+
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>
      </div>
    </div>
  );
}
