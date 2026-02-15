'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  ImageIcon,
  Video,
  Globe,
  Sparkles,
  ChevronRight,
  Activity,
  Server,
  Shield,
  Cpu,
} from 'lucide-react'

// --- Typing text hook ---
function useTypingText(text: string, speed = 80, startDelay = 1200) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1))
          i++
        } else {
          setDone(true)
          clearInterval(interval)
        }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [text, speed, startDelay])

  return { displayed, done }
}

// --- Floating geometric shapes ---
function FloatingShapes() {
  const shapes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        size: 4 + Math.random() * 8,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        duration: 12 + Math.random() * 10,
        delay: Math.random() * 4,
        opacity: 0.06 + Math.random() * 0.08,
        rotation: Math.random() * 360,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute border border-red-500/20 rounded-sm"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            opacity: s.opacity,
            rotate: s.rotation,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [s.rotation, s.rotation + 90, s.rotation],
            opacity: [s.opacity, s.opacity * 2, s.opacity],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: s.delay,
          }}
        />
      ))}
    </div>
  )
}

// --- Progress bar ---
function SystemProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const target = 73 + Math.random() * 15
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= target) {
            clearInterval(interval)
            return target
          }
          return prev + 0.5
        })
      }, 30)
      return () => clearInterval(interval)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-neutral-500">SYSTEM UPGRADE</span>
        <span className="font-mono text-red-400">{Math.round(progress)}%</span>
      </div>
      <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// --- Status line items ---
const STATUS_LINES = [
  { icon: Server, label: 'API Services', status: 'upgrading', color: 'text-amber-400' },
  { icon: Cpu, label: 'AI Models', status: 'optimizing', color: 'text-red-400' },
  { icon: Shield, label: 'Security', status: 'active', color: 'text-emerald-400' },
  { icon: Activity, label: 'Database', status: 'migrating', color: 'text-amber-400' },
]

// --- Features ---
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Chat',
    desc: 'แชทกับ AI 10+ โมเดล',
    gradient: 'from-red-500/10 to-orange-500/10',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
  },
  {
    icon: ImageIcon,
    title: 'Image Gen',
    desc: 'สร้างรูปภาพด้วย AI',
    gradient: 'from-violet-500/10 to-fuchsia-500/10',
    border: 'border-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: Video,
    title: 'Video Gen',
    desc: 'สร้างวิดีโอด้วย AI',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Globe,
    title: 'Web Search',
    desc: 'ค้นหาเว็บเรียลไทม์',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
]

// --- Main ---
export default function MaintenancePage() {
  const { displayed: typedText, done: typingDone } = useTypingText(
    'กำลังปรับปรุงระบบ',
    90,
    800
  )
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (!typingDone) return
    const interval = setInterval(() => setShowCursor((p) => !p), 530)
    return () => clearInterval(interval)
  }, [typingDone])

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* --- Atmospheric layers --- */}

      {/* Red radial glow from center */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background:
            'radial-gradient(ellipse at center, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.04) 40%, transparent 70%)',
        }}
      />

      {/* Subtle bottom warm glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          left: '30%',
          width: '600px',
          height: '400px',
          background:
            'radial-gradient(ellipse at center, rgba(153,27,27,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Floating geometry */}
      <FloatingShapes />

      {/* --- Content --- */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-xl mx-auto">
          {/* ====== Logo + Pulse Rings ====== */}
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative">
              {/* Pulse rings */}
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute inset-0 rounded-2xl border border-red-500/20"
                  style={{ margin: `-${ring * 12}px` }}
                  animate={{
                    opacity: [0.3, 0, 0.3],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: ring * 0.6,
                  }}
                />
              ))}

              {/* Glow behind logo */}
              <div
                className="absolute -inset-4 rounded-3xl blur-2xl"
                style={{ background: 'rgba(220,38,38,0.15)' }}
              />

              {/* Logo */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden shadow-2xl shadow-red-900/40 border border-neutral-800">
                <Image
                  src="/images/logo.jpg"
                  alt="RabbitHub AI"
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* ====== Brand Name ====== */}
          <motion.div
            className="text-center mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Rabbit
              <span className="bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
                Hub
              </span>{' '}
              AI
            </h1>
          </motion.div>

          {/* ====== Typing status line ====== */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-lg sm:text-xl text-neutral-300 font-body">
              {typedText}
              <span
                className="inline-block w-[2px] h-5 bg-red-500 ml-0.5 align-middle"
                style={{ opacity: typingDone ? (showCursor ? 1 : 0) : 1 }}
              />
            </p>
            <motion.p
              className="text-sm text-neutral-500 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.6 }}
            >
              เตรียมพร้อมเปิดตัวเร็วๆ นี้
            </motion.p>
          </motion.div>

          {/* ====== Terminal-style status card ====== */}
          <motion.div
            className="mb-8 rounded-2xl border border-neutral-800 overflow-hidden"
            style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="font-mono text-[11px] text-neutral-500 ml-2">
                system-status.log
              </span>
            </div>

            {/* Status lines */}
            <div className="px-4 py-4 space-y-3">
              {STATUS_LINES.map((line, i) => (
                <motion.div
                  key={line.label}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 + i * 0.15, duration: 0.4 }}
                >
                  <div className="flex items-center gap-2.5">
                    <line.icon className="h-3.5 w-3.5 text-neutral-500" />
                    <span className="font-mono text-xs text-neutral-400">{line.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs ${line.color}`}>{line.status}</span>
                    {line.status !== 'active' && (
                      <motion.div
                        className="h-1.5 w-1.5 rounded-full bg-amber-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                    {line.status === 'active' && (
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Divider */}
              <div className="border-t border-neutral-800/60 pt-3 mt-3">
                <SystemProgress />
              </div>
            </div>
          </motion.div>

          {/* ====== Coming Soon Features ====== */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-red-400" />
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
                Coming Soon
              </span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  className={`group relative rounded-xl border ${feat.border} p-4 bg-gradient-to-br ${feat.gradient} hover:scale-[1.02] transition-transform duration-200`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.2 + i * 0.12, duration: 0.5 }}
                >
                  <feat.icon className={`h-5 w-5 ${feat.iconColor} mb-2.5`} />
                  <p className="text-sm font-display font-semibold text-white mb-0.5">
                    {feat.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 leading-snug">{feat.desc}</p>
                  <ChevronRight className="absolute top-4 right-3 h-3.5 w-3.5 text-neutral-700 group-hover:text-neutral-500 transition-colors" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ====== Model strip ====== */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.6 }}
          >
            <p className="text-center text-[11px] text-neutral-600 mb-3 font-mono uppercase tracking-wider">
              Powered by
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {[
                { src: '/images/models/deepseek.svg', name: 'DeepSeek' },
                { src: '/images/models/kimi.svg', name: 'Kimi' },
                { src: '/images/models/byteplus.svg', name: 'Seed' },
                { src: '/images/models/zhipu.svg', name: 'GLM' },
              ].map((model, i) => (
                <motion.div
                  key={model.name}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 3.0 + i * 0.1, duration: 0.4 }}
                >
                  <div className="relative h-4 w-4 rounded overflow-hidden">
                    <Image src={model.src} alt={model.name} fill sizes="16px" className="object-cover" />
                  </div>
                  <span className="text-[11px] text-neutral-500">{model.name}</span>
                </motion.div>
              ))}
              <motion.span
                className="text-[11px] text-neutral-600 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
              >
                +6 more
              </motion.span>
            </div>
          </motion.div>

          {/* ====== Footer ====== */}
          <motion.p
            className="text-center text-[11px] text-neutral-700 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.5 }}
          >
            2026 RabbitHub AI. All rights reserved.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
