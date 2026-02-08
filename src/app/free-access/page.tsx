'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Play,
  Pause,
  Clock,
  Sparkles,
  Gift,
  CheckCircle,
  Timer,
  Zap,
  ArrowRight,
  Volume2,
  VolumeX,
  Tv,
  Ticket,
  Star,
  Crown,
  Trophy,
  Coins,
  X
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';

// Config
const FREE_ACCESS_CONFIG = {
  maxDailyAds: 3,
  minutesPerAd: 10,
  adDurationSeconds: 30,
};

// Floating Particle Component - CSS only
function FloatingParticle({ delay, duration, startX, startY }: { delay: number; duration: number; startX: number; startY: number }) {
  return (
    <div
      className="absolute w-1 h-1 bg-primary-500/60 rounded-full animate-sparkle"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Reward Coin Animation
function RewardCoin({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0 }}
      animate={{
        y: [-20, -80],
        opacity: [1, 1, 0],
        scale: [0, 1, 1],
        rotate: [0, 360],
      }}
      transition={{ duration: 1, delay, ease: "easeOut" }}
      className="absolute"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/50">
        <Star className="w-4 h-4 text-yellow-900" />
      </div>
    </motion.div>
  );
}

// Cinema Screen Component
function CinemaScreen({
  isPlaying,
  progress,
  onComplete,
  remainingTime
}: {
  isPlaying: boolean;
  progress: number;
  onComplete: boolean;
  remainingTime: number;
}) {
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
      {/* Screen border/frame */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 -z-10" />
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-neutral-800 to-black -z-10" />

      {/* Screen glow effect */}
      <div
        className={`absolute inset-0 rounded-2xl ${isPlaying ? 'animate-pulse' : ''}`}
        style={{
          boxShadow: isPlaying
            ? '0 0 80px rgba(239, 68, 68, 0.5)'
            : '0 0 40px rgba(239, 68, 68, 0.2)'
        }}
      />

      {/* Main screen content */}
      <div className="relative w-full h-full bg-gradient-to-br from-neutral-900 via-black to-neutral-900 flex items-center justify-center overflow-hidden">
        {/* Scan lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        {/* Content States */}
        <AnimatePresence mode="wait">
          {onComplete ? (
            // Success State
            <motion.div
              key="complete"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center relative"
            >
              {/* Celebration particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][i % 4],
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, (Math.cos(i * 30 * Math.PI / 180) * 150)],
                    y: [0, (Math.sin(i * 30 * Math.PI / 180) * 150)],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              ))}

              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                ยินดีด้วย! 🎉
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-emerald-400 text-lg"
              >
                +{FREE_ACCESS_CONFIG.minutesPerAd} นาที ถูกเพิ่มแล้ว!
              </motion.p>

              {/* Floating coins */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${20 + i * 12}%`, top: '30%' }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: -100, opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, delay: 0.2 + i * 0.1 }}
                  >
                    <Coins className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : isPlaying ? (
            // Playing State
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full h-full flex flex-col items-center justify-center"
            >
              {/* Animated ad visualization */}
              <div className="relative mb-8">
                <div
                  className="w-20 h-20 rounded-full border-4 border-primary-500/30 animate-[spin_3s_linear_infinite]"
                />
                <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                  <Volume2 className="w-8 h-8 text-primary-500" />
                </div>

                {/* Pulse rings */}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-primary-500 animate-pulse-ring"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  />
                ))}
              </div>

              <p className="text-white text-lg font-medium mb-2">กำลังเล่นโฆษณา...</p>
              <p className="text-neutral-400 text-sm mb-6">กรุณารอสักครู่เพื่อรับรางวัล</p>

              {/* Countdown */}
              <motion.div
                className="text-5xl font-bold text-primary-500 tabular-nums"
                style={{ fontFamily: "'Outfit', sans-serif" }}
                key={remainingTime}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {remainingTime}
              </motion.div>
              <p className="text-neutral-500 text-sm mt-1">วินาที</p>
            </motion.div>
          ) : (
            // Ready State
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                className="relative w-28 h-28 mx-auto mb-6"
                whileHover={{ scale: 1.05 }}
              >
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/20 to-rose-500/20 animate-glow-pulse"
                />

                {/* Play button */}
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-primary-500/40">
                  <Play className="w-12 h-12 text-white ml-1" fill="white" />
                </div>
              </motion.div>

              <p className="text-neutral-300 text-lg mb-2">พร้อมดูโฆษณา</p>
              <p className="text-neutral-500 text-sm">กดปุ่มด้านล่างเพื่อเริ่ม</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar at bottom of screen */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 via-rose-500 to-amber-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          {/* Glow on progress head */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-white/50"
            style={{ left: `${progress}%`, marginLeft: '-6px' }}
          />
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  value,
  label,
  gradient,
  glowColor
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  gradient: string;
  glowColor: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-sm overflow-hidden group"
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${glowColor}`}
        style={{ filter: 'blur(40px)' }}
      />

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-3 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {value}
        </p>
        <p className="text-sm text-neutral-400">{label}</p>
      </div>
    </motion.div>
  );
}

// Ticket/Reward Card
function RewardCard({ index, available }: { index: number; available: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-xl border-2 border-dashed ${
        available
          ? 'border-primary-500/50 bg-primary-500/5'
          : 'border-neutral-700 bg-neutral-800/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          available
            ? 'bg-gradient-to-br from-primary-500 to-rose-500'
            : 'bg-neutral-700'
        }`}>
          {available ? (
            <Ticket className="w-5 h-5 text-white" />
          ) : (
            <CheckCircle className="w-5 h-5 text-neutral-500" />
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${available ? 'text-white' : 'text-neutral-500'}`}>
            รางวัลที่ {index + 1}
          </p>
          <p className={`text-xs ${available ? 'text-primary-400' : 'text-neutral-600'}`}>
            {available ? `+${FREE_ACCESS_CONFIG.minutesPerAd} นาที` : 'รับแล้ว'}
          </p>
        </div>
      </div>

      {/* Shimmer effect for available */}
      {available && (
        <div className="absolute inset-0 rounded-xl shimmer opacity-30" />
      )}
    </motion.div>
  );
}

export default function FreeAccessPage() {
  const [adsWatchedToday, setAdsWatchedToday] = useState(1);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [freeMinutesRemaining, setFreeMinutesRemaining] = useState(10);
  const [remainingTime, setRemainingTime] = useState(FREE_ACCESS_CONFIG.adDurationSeconds);

  const remainingAds = FREE_ACCESS_CONFIG.maxDailyAds - adsWatchedToday;
  const canWatchAd = remainingAds > 0;

  const handleWatchAd = () => {
    if (!canWatchAd || isWatchingAd) return;
    setIsWatchingAd(true);
    setAdProgress(0);
    setRemainingTime(FREE_ACCESS_CONFIG.adDurationSeconds);
  };

  // Ad progress simulation
  useEffect(() => {
    if (!isWatchingAd) return;

    const interval = setInterval(() => {
      setAdProgress((prev) => {
        const newProgress = prev + (100 / FREE_ACCESS_CONFIG.adDurationSeconds);
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsWatchingAd(false);
          setShowSuccess(true);
          setAdsWatchedToday((prev) => prev + 1);
          setFreeMinutesRemaining((prev) => prev + FREE_ACCESS_CONFIG.minutesPerAd);

          setTimeout(() => setShowSuccess(false), 4000);
          return 100;
        }
        return newProgress;
      });

      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatchingAd]);

  // Particles data
  const particles = [
    { delay: 0, duration: 4, startX: 10, startY: 90 },
    { delay: 0.5, duration: 3.5, startX: 25, startY: 85 },
    { delay: 1, duration: 4.5, startX: 40, startY: 95 },
    { delay: 1.5, duration: 3, startX: 55, startY: 88 },
    { delay: 2, duration: 4, startX: 70, startY: 92 },
    { delay: 2.5, duration: 3.5, startX: 85, startY: 87 },
    { delay: 3, duration: 4, startX: 15, startY: 93 },
    { delay: 3.5, duration: 3, startX: 60, startY: 90 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          {/* Gradient orbs - CSS */}
          <div
            className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl animate-glow-pulse-slow"
          />
          <div
            className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl animate-glow-pulse-slow"
            style={{ animationDelay: '2s' }}
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />

          {/* Floating particles */}
          {particles.map((p, i) => (
            <FloatingParticle key={i} {...p} />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/20 to-amber-500/20 border border-primary-500/30 mb-6"
            >
              <Gift className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-primary-300">รางวัลฟรีทุกวัน</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ดูโฆษณา{' '}
              <span className="bg-gradient-to-r from-primary-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                รับเวลาฟรี
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-neutral-400 max-w-xl mx-auto"
            >
              ดูโฆษณาสั้นๆ {FREE_ACCESS_CONFIG.adDurationSeconds} วินาที
              รับเวลาใช้งาน AI ฟรี {FREE_ACCESS_CONFIG.minutesPerAd} นาที
              <br />
              <span className="text-primary-400 font-medium">วันละ {FREE_ACCESS_CONFIG.maxDailyAds} ครั้ง!</span>
            </motion.p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <StatsCard
              icon={Timer}
              value={`${freeMinutesRemaining}`}
              label="นาทีที่เหลือ"
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              glowColor="bg-emerald-500/20"
            />
            <StatsCard
              icon={Ticket}
              value={`${remainingAds}/${FREE_ACCESS_CONFIG.maxDailyAds}`}
              label="โฆษณาวันนี้"
              gradient="bg-gradient-to-br from-primary-500 to-rose-500"
              glowColor="bg-primary-500/20"
            />
            <StatsCard
              icon={Coins}
              value={`${adsWatchedToday * FREE_ACCESS_CONFIG.minutesPerAd}`}
              label="นาทีที่รับวันนี้"
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
              glowColor="bg-amber-500/20"
            />
            <StatsCard
              icon={Crown}
              value="VIP"
              label="อัปเกรดเพื่อไม่จำกัด"
              gradient="bg-gradient-to-br from-purple-500 to-violet-600"
              glowColor="bg-purple-500/20"
            />
          </motion.div>

          {/* Main Content - Cinema Screen */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto mb-8"
          >
            <CinemaScreen
              isPlaying={isWatchingAd}
              progress={adProgress}
              onComplete={showSuccess}
              remainingTime={remainingTime}
            />
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-12"
          >
            <motion.button
              onClick={handleWatchAd}
              disabled={!canWatchAd || isWatchingAd}
              whileHover={canWatchAd && !isWatchingAd ? { scale: 1.02 } : {}}
              whileTap={canWatchAd && !isWatchingAd ? { scale: 0.98 } : {}}
              className={`relative px-10 py-4 rounded-2xl font-bold text-lg transition-all ${
                canWatchAd && !isWatchingAd
                  ? 'bg-gradient-to-r from-primary-500 to-rose-500 text-white shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {/* Shimmer effect */}
              {canWatchAd && !isWatchingAd && (
                <div
                  className="absolute inset-0 rounded-2xl animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
              )}

              <span className="relative flex items-center gap-3">
                {isWatchingAd ? (
                  <>
                    <span className="animate-spin">
                      <Clock className="w-5 h-5" />
                    </span>
                    กำลังดู... {remainingTime}s
                  </>
                ) : canWatchAd ? (
                  <>
                    <Play className="w-5 h-5" fill="currentColor" />
                    ดูโฆษณารับ {FREE_ACCESS_CONFIG.minutesPerAd} นาทีฟรี
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    ครบโควต้าวันนี้แล้ว
                  </>
                )}
              </span>
            </motion.button>

            {!canWatchAd && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-neutral-500 text-sm mt-3"
              >
                กลับมาดูโฆษณาใหม่ได้พรุ่งนี้ หรือ{' '}
                <Link href="/pricing" className="text-primary-400 hover:underline">
                  อัปเกรดเป็น Pro
                </Link>
              </motion.p>
            )}
          </motion.div>

          {/* Today's Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              🎁 รางวัลวันนี้
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(FREE_ACCESS_CONFIG.maxDailyAds)].map((_, i) => (
                <RewardCard key={i} index={i} available={i >= adsWatchedToday} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 border-t border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-center mb-12"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            วิธีรับรางวัล
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Tv,
                title: 'ดูโฆษณา',
                description: 'กดปุ่มเพื่อเริ่มดูโฆษณาสั้นๆ 30 วินาที',
                gradient: 'from-primary-500 to-rose-500',
                delay: 0.1,
              },
              {
                icon: Gift,
                title: 'รับเวลาฟรี',
                description: 'ได้รับ 10 นาที ใช้งาน AI ทันที',
                gradient: 'from-amber-500 to-orange-500',
                delay: 0.2,
              },
              {
                icon: Sparkles,
                title: 'แชทกับ AI',
                description: 'ใช้งานได้เลย ไม่ต้องสมัครสมาชิก',
                gradient: 'from-emerald-500 to-teal-500',
                delay: 0.3,
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: step.delay }}
                whileHover={{ y: -4 }}
                className="relative p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center group"
              >
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-rose-500 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>

                <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-neutral-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-8 sm:p-12 rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-rose-600 to-amber-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

            <div className="relative text-center">
              <div className="inline-flex w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center mb-6 animate-wiggle-slow">
                <Crown className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                ต้องการใช้งานไม่จำกัด?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                อัปเกรดเป็น Pro เพื่อใช้งาน AI ได้ไม่จำกัด ไม่ต้องดูโฆษณา พร้อมฟีเจอร์พิเศษอีกมากมาย
              </p>

              <div className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 inline-block">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
                >
                  ดูแพ็กเกจทั้งหมด
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
