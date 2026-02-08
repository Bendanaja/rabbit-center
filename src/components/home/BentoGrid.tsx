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

// Floating particles - CSS GPU animation
function FloatingParticles({ count = 6 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary-500/20 rounded-full animate-[floatY_ease-in-out_infinite]"
          style={{
            left: `${((i * 37 + 13) % 100)}%`,
            top: `${((i * 53 + 17) % 100)}%`,
            willChange: 'transform, opacity',
            animationDuration: `${3 + i * 0.5}s`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

// Static gradient orb - no JS animation, uses CSS
function GradientOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 ${className}`} />
  );
}

// 3D tilt card with CSS transitions - GPU only (transform)
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const tiltRef = useRef<HTMLDivElement>(null);

  function handleMouse(e: React.MouseEvent) {
    const rect = tiltRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateX = my * -14;
    const rotateY = mx * 14;
    if (tiltRef.current) {
      tiltRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  }

  function handleMouseLeave() {
    if (tiltRef.current) {
      tiltRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  }

  return (
    <div
      ref={tiltRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        transition: 'transform 0.15s ease-out',
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

// Animated counter
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
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
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Typing animation text - uses CSS cursor blink instead of framer-motion
function TypingText({ text, className }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isInView, text]);

  return (
    <span ref={ref} className={className}>
      {displayText}
      {isTyping && (
        <span
          className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 animate-[cursorBlink_1s_step-end_infinite]"
        />
      )}
    </span>
  );
}

// Neural network - static SVG, no JS animations
function NeuralNetwork() {
  const nodes = [
    { x: 20, y: 30 }, { x: 20, y: 70 },
    { x: 50, y: 20 }, { x: 50, y: 50 }, { x: 50, y: 80 },
    { x: 80, y: 30 }, { x: 80, y: 70 },
  ];

  const connections = [
    [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4],
    [2, 5], [2, 6], [3, 5], [3, 6], [4, 5], [4, 6],
  ];

  return (
    <svg className="w-full h-full" viewBox="0 0 100 100">
      {connections.map(([from, to], i) => (
        <line
          key={i}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary-500/30"
        />
      ))}
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r="4"
          className="fill-primary-500 animate-pulse"
          style={{ animationDelay: `${i * 300}ms` }}
        />
      ))}
    </svg>
  );
}

// Speed lines - glowing animated streaks that zoom across
function SpeedLines() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Static faint background lines */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`bg-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-primary-500/15 to-transparent"
          style={{ top: `${20 + i * 14}%`, width: '80%', left: '10%' }}
        />
      ))}
      {/* Animated glowing streaks */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`streak-${i}`}
          className="absolute h-[2px] rounded-full animate-[speedStreak_1.5s_ease-in-out_infinite]"
          style={{
            top: `${22 + i * 16}%`,
            animationDelay: `${i * 0.35}s`,
            background: `linear-gradient(90deg, transparent, transparent 20%, rgba(248,113,113,0.8) 40%, rgba(239,68,68,1) 50%, rgba(248,113,113,0.8) 60%, transparent 80%, transparent)`,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 8px rgba(239,68,68,0.6), 0 0 20px rgba(239,68,68,0.3)',
            width: '50%',
          }}
        />
      ))}
      {/* Extra thin fast streaks */}
      {[...Array(3)].map((_, i) => (
        <div
          key={`fast-${i}`}
          className="absolute h-px rounded-full animate-[speedStreak_1s_ease-in-out_infinite]"
          style={{
            top: `${30 + i * 20}%`,
            animationDelay: `${0.2 + i * 0.4}s`,
            background: `linear-gradient(90deg, transparent, rgba(252,165,165,0.6) 50%, transparent)`,
            filter: 'blur(0.3px)',
            boxShadow: '0 0 4px rgba(252,165,165,0.4)',
            width: '35%',
          }}
        />
      ))}
    </div>
  );
}

// Security scan animation - radar sweep + shield glow
function SecurityScan() {
  return (
    <div className="absolute top-3 right-3 w-20 h-20">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
      {/* Rotating radar sweep */}
      <div
        className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16,185,129,0.3) 340deg, rgba(16,185,129,0.6) 360deg)',
        }}
      />
      {/* Inner glow ring */}
      <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-pulse" />
      {/* Center dot */}
      <div className="absolute inset-[34%] rounded-full bg-emerald-500/40 animate-ping" style={{ animationDuration: '2s' }} />
    </div>
  );
}

// Chat bubble animation
function ChatBubbles() {
  const messages = [
    { text: 'สวัสดี!', isUser: true },
    { text: 'ยินดีให้บริการครับ', isUser: false },
    { text: 'ช่วยเขียนโค้ดได้ไหม?', isUser: true },
  ];

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: msg.isUser ? 20 : -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.4, duration: 0.4 }}
          className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`px-3 py-1.5 rounded-xl text-xs ${
              msg.isUser
                ? 'bg-primary-500 text-white rounded-br-sm'
                : 'bg-neutral-700 text-neutral-200 rounded-bl-sm'
            }`}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Globe - static with CSS animation for ring only
function AnimatedGlobe() {
  return (
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/30 animate-[spin_20s_linear_infinite]" />
      <div className="absolute inset-2 rounded-full border border-primary-500/20" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
        <Globe className="h-6 w-6 text-primary-400" />
      </div>
    </div>
  );
}

export function BentoGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <div ref={containerRef} className="relative">
      {/* Background effects */}
      <GradientOrb className="w-96 h-96 bg-primary-500 -top-48 -left-48" />
      <GradientOrb className="w-72 h-72 bg-primary-600 -bottom-36 -right-36" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
        {/* Card 1 - Multi-Model AI (Large) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0 }}
          className="md:col-span-2 lg:row-span-2"
        >
          <TiltCard className="h-full">
            <div className="relative h-full p-6 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700/50 overflow-hidden group">
              <FloatingParticles />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="p-3 rounded-2xl bg-primary-500/10 border border-primary-500/20"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    style={{ willChange: 'transform' }}
                  >
                    <Layers className="h-6 w-6 text-primary-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white">หลายโมเดล AI</h3>
                    <p className="text-sm text-neutral-400">เข้าถึงทุกโมเดลในที่เดียว</p>
                  </div>
                </div>

                {/* AI Model icons grid */}
                <div className="grid grid-cols-4 gap-3 mt-6">
                  {AI_MODELS.slice(0, 7).map((model, i) => (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="relative aspect-square rounded-xl bg-neutral-800/50 border border-neutral-700/50 p-2 flex items-center justify-center cursor-pointer group/icon transition-transform duration-200 hover:scale-110 hover:-translate-y-1"
                    >
                      <div className="relative h-8 w-8">
                        <Image src={model.icon} alt={model.name} fill sizes="32px" className="object-cover rounded-lg" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-700 rounded text-xs text-white opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap">
                        {model.name}
                      </div>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 1 }}
                    className="aspect-square rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center"
                  >
                    <span className="text-sm font-bold text-primary-400">+</span>
                  </motion.div>
                </div>
              </div>

              {/* Decorative corner */}
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-colors" />
            </div>
          </TiltCard>
        </motion.div>

        {/* Card 2 - Speed */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <TiltCard className="h-full">
            <div className="relative h-full p-5 rounded-3xl bg-gradient-to-br from-primary-950 to-primary-900 border border-primary-800/50 overflow-hidden group">
              <SpeedLines />

              <div className="relative z-10">
                <div
                  className="p-2.5 rounded-xl bg-primary-500/20 border border-primary-500/30 w-fit mb-3"
                >
                  <Zap className="h-5 w-5 text-primary-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">เร็วสุดขีด</h3>
                <p className="text-xs text-primary-300/70">ตอบกลับภายใน</p>
                <div className="text-3xl font-bold text-primary-400 mt-2">
                  <AnimatedCounter value={100} suffix="ms" />
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Card 3 - Security */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TiltCard className="h-full">
            <div className="relative h-full p-5 rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-800/50 overflow-hidden">
              {/* Security radar scan */}
              <SecurityScan />

              <div className="relative z-10">
                <div
                  className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 w-fit mb-3"
                >
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">ปลอดภัย 100%</h3>
                <p className="text-xs text-emerald-300/70">เข้ารหัสแบบ End-to-End</p>
                {/* Security status indicators */}
                <div className="flex items-center gap-1.5 mt-3">
                  {['E2E', 'SSL', 'AES', '256'].map((label, i) => (
                    <div
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                      style={{ animationDelay: `${i * 300}ms` }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Card 4 - Chat History */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:row-span-2"
        >
          <TiltCard className="h-full">
            <div className="relative h-full p-5 rounded-3xl bg-gradient-to-br from-violet-950 to-violet-900 border border-violet-800/50 overflow-hidden">
              <div className="relative z-10">
                <motion.div
                  className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 w-fit mb-3"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  style={{ willChange: 'transform' }}
                >
                  <MessageSquare className="h-5 w-5 text-violet-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-1">ประวัติแชท</h3>
                <p className="text-xs text-violet-300/70 mb-4">เข้าถึงได้ทุกที่ทุกเวลา</p>

                {/* Chat preview */}
                <div className="bg-neutral-900/50 rounded-xl p-3 backdrop-blur-sm">
                  <ChatBubbles />
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-violet-500/10 rounded-lg">
                    <div className="text-lg font-bold text-violet-400">
                      <AnimatedCounter value={999} suffix="+" />
                    </div>
                    <div className="text-[10px] text-violet-300/60">บทสนทนา</div>
                  </div>
                  <div className="text-center p-2 bg-violet-500/10 rounded-lg">
                    <div className="text-lg font-bold text-violet-400">∞</div>
                    <div className="text-[10px] text-violet-300/60">ไม่จำกัด</div>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Card 5 - Smart Selection (with Neural Network) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="md:col-span-2"
        >
          <TiltCard className="h-full">
            <div className="relative h-full p-5 rounded-3xl bg-gradient-to-br from-amber-950 to-amber-900 border border-amber-800/50 overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 text-amber-500/20">
                <NeuralNetwork />
              </div>

              <div className="relative z-10">
                <motion.div
                  className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 w-fit mb-3"
                  whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                  transition={{ duration: 0.6 }}
                  style={{ willChange: 'transform' }}
                >
                  <Brain className="h-5 w-5 text-amber-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-1">เลือกโมเดลอัจฉริยะ</h3>
                <p className="text-xs text-amber-300/70">
                  <TypingText text="สลับระหว่างโมเดลได้ทันทีระหว่างสนทนา" />
                </p>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Card 6 - Multi-language with Globe */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <TiltCard className="h-full">
            <div className="relative h-full p-5 rounded-3xl bg-gradient-to-br from-cyan-950 to-cyan-900 border border-cyan-800/50 overflow-hidden flex flex-col items-center justify-center">
              <AnimatedGlobe />
              <h3 className="text-lg font-bold text-white mt-3 text-center">รองรับหลายภาษา</h3>
              <p className="text-xs text-cyan-300/70 text-center">100+ ภาษาทั่วโลก</p>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}
