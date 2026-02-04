'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import {
  Layers,
  Zap,
  Shield,
  MessageSquare,
  Bot,
  Globe,
  Sparkles,
  Brain,
  Code,
  Cpu,
} from 'lucide-react';
import { AI_MODELS } from '@/lib/constants';

// Floating particles component - uses deterministic positions to avoid hydration mismatch
function FloatingParticles({ count = 20 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate deterministic positions based on index (same on server and client)
  const getPosition = (index: number) => ({
    x: ((index * 37 + 13) % 100) + '%',
    y: ((index * 53 + 17) % 100) + '%',
  });

  const getDuration = (index: number) => 4 + (index % 4);
  const getDelay = (index: number) => (index * 0.5) % 4;

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => {
        const pos = getPosition(i);
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-500/30 rounded-full"
            initial={{
              x: pos.x,
              y: pos.y,
            }}
            animate={{
              y: [null, '-20%', '120%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: getDuration(i),
              repeat: Infinity,
              delay: getDelay(i),
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

// Animated gradient orb
function GradientOrb({ className }: { className?: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 30, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Interactive 3D tilt card
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
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

// Typing animation text
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
        <motion.span
          className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  );
}

// Neural network animation
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
        <motion.line
          key={i}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary-500/30"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: i * 0.1 }}
        />
      ))}
      {nodes.map((node, i) => (
        <motion.circle
          key={i}
          cx={node.x}
          cy={node.y}
          r="4"
          className="fill-primary-500"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            scale: { duration: 2, repeat: Infinity, delay: i * 0.2 },
            default: { duration: 0.5, delay: i * 0.1 },
          }}
        />
      ))}
      {/* Animated pulse along connections */}
      {connections.slice(0, 6).map(([from, to], i) => (
        <motion.circle
          key={`pulse-${i}`}
          r="2"
          className="fill-primary-400"
          initial={{ cx: nodes[from].x, cy: nodes[from].y, opacity: 0 }}
          animate={{
            cx: [nodes[from].x, nodes[to].x],
            cy: [nodes[from].y, nodes[to].y],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}

// Speed lines animation
function SpeedLines() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"
          style={{
            top: `${20 + i * 10}%`,
            width: '60%',
            left: '20%',
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: [0, 1, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeOut',
          }}
        />
      ))}
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

// Globe with rotating ring
function AnimatedGlobe() {
  return (
    <div className="relative w-20 h-20">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary-500/30"
        style={{ borderStyle: 'dashed' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-primary-500/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
        <Globe className="h-6 w-6 text-primary-400" />
      </div>
      {/* Orbiting dots */}
      {[0, 120, 240].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary-500 rounded-full"
          style={{
            top: '50%',
            left: '50%',
            marginTop: -4,
            marginLeft: -4,
          }}
          animate={{
            x: [
              Math.cos((angle * Math.PI) / 180) * 36,
              Math.cos(((angle + 360) * Math.PI) / 180) * 36,
            ],
            y: [
              Math.sin((angle * Math.PI) / 180) * 36,
              Math.sin(((angle + 360) * Math.PI) / 180) * 36,
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
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
              <FloatingParticles count={15} />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="p-3 rounded-2xl bg-primary-500/10 border border-primary-500/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
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
                      whileHover={{ scale: 1.15, y: -5 }}
                      className="relative aspect-square rounded-xl bg-neutral-800/50 border border-neutral-700/50 p-2 flex items-center justify-center cursor-pointer group/icon"
                    >
                      <div className="relative h-8 w-8">
                        <Image src={model.icon} alt={model.name} fill className="object-cover rounded-lg" />
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
                <motion.div
                  className="p-2.5 rounded-xl bg-primary-500/20 border border-primary-500/30 w-fit mb-3"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="h-5 w-5 text-primary-400" />
                </motion.div>
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
              <motion.div
                className="absolute top-4 right-4 w-16 h-16 rounded-full border-4 border-emerald-500/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative z-10">
                <motion.div
                  className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 w-fit mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Shield className="h-5 w-5 text-emerald-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-1">ปลอดภัย 100%</h3>
                <p className="text-xs text-emerald-300/70">เข้ารหัสแบบ End-to-End</p>
                <div className="flex items-center gap-1 mt-3">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-emerald-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
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
                  whileHover={{ rotate: 10 }}
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
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
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
