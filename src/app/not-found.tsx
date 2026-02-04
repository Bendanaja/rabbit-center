'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, MessageSquare, Search } from 'lucide-react';

// Fixed positions for sparkles to avoid hydration mismatch
const sparklePositions = [
  { left: 15, top: 20, size: 10, duration: 2.5, delay: 0.5 },
  { left: 85, top: 15, size: 12, duration: 3, delay: 1 },
  { left: 25, top: 75, size: 9, duration: 2.8, delay: 0.2 },
  { left: 70, top: 60, size: 11, duration: 3.2, delay: 1.5 },
  { left: 45, top: 25, size: 10, duration: 2.6, delay: 0.8 },
  { left: 60, top: 80, size: 13, duration: 3.5, delay: 2 },
  { left: 30, top: 45, size: 8, duration: 2.4, delay: 0.3 },
  { left: 80, top: 35, size: 11, duration: 3.1, delay: 1.2 },
  { left: 20, top: 55, size: 9, duration: 2.7, delay: 0.6 },
  { left: 55, top: 40, size: 12, duration: 3.3, delay: 1.8 },
  { left: 40, top: 85, size: 10, duration: 2.9, delay: 0.9 },
  { left: 75, top: 70, size: 11, duration: 3.4, delay: 2.2 },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-50 dark:from-neutral-950 dark:via-primary-950/20 dark:to-neutral-950 flex items-center justify-center px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-primary-200/30 to-transparent blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-primary-300/25 to-transparent blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Floating sparkles - using fixed positions to avoid hydration mismatch */}
        {sparklePositions.map((sparkle, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: sparkle.duration,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: 'easeInOut',
            }}
          >
            <svg
              width={sparkle.size}
              height={sparkle.size}
              viewBox="0 0 24 24"
              className="text-primary-400/60"
            >
              <path
                d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated rabbit logo */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary-500/20 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Sad bounce animation for the rabbit */}
          <motion.div
            className="relative w-full h-full"
            animate={{
              y: [0, -8, 0],
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Image
              src="/images/logo-transparent.png"
              alt="RabbitAI"
              fill
              className="object-contain opacity-80"
              style={{ filter: 'grayscale(30%)' }}
            />
          </motion.div>

          {/* Question marks floating around */}
          {['?', '?', '?'].map((char, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl font-bold text-primary-400/60"
              style={{
                top: i === 0 ? '-10%' : i === 1 ? '20%' : '50%',
                left: i === 0 ? '80%' : i === 1 ? '-15%' : '90%',
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.8, 0.3],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* 404 Number with glitch effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-6"
        >
          <motion.h1
            className="text-[120px] sm:text-[160px] font-black leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316, #ef4444)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            404
          </motion.h1>

          {/* Subtle glitch layers */}
          <motion.span
            className="absolute inset-0 text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-primary-500/20"
            animate={{
              x: [-2, 2, -2],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            404
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-4"
        >
          อุ๊ปส์! หลงทางแล้ว 🐰
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-neutral-600 dark:text-neutral-400 text-lg mb-10 max-w-md mx-auto"
        >
          ดูเหมือนว่าหน้าที่คุณกำลังหาไม่มีอยู่ หรืออาจถูกย้ายไปที่อื่นแล้ว
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary button - Go home */}
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-shadow"
            >
              <Home className="w-5 h-5" />
              กลับหน้าแรก
            </motion.button>
          </Link>

          {/* Secondary button - Start chat */}
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-md hover:shadow-lg transition-shadow"
            >
              <MessageSquare className="w-5 h-5" />
              เริ่มแชท AI
            </motion.button>
          </Link>
        </motion.div>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          onClick={() => window.history.back()}
          className="mt-8 inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">ย้อนกลับ</span>
        </motion.button>

        {/* Fun suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 p-6 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50"
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            หรือลองดูหน้าเหล่านี้:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { href: '/pricing', label: 'แพ็กเกจราคา' },
              { href: '/settings', label: 'ตั้งค่า' },
              { href: '/auth/login', label: 'เข้าสู่ระบบ' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
