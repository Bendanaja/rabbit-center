'use client';

import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Zap,
  Users,
  Globe,
  Shield,
  Sparkles,
  Quote,
  ChevronDown,
  Lock,
  Brain,
  Globe2,
  Heart
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { Button } from '@/components/ui';
import { type AboutContent } from '@/lib/content';

// Icon map for value icons
const iconMap: Record<string, React.ElementType> = {
  Users,
  Shield,
  Zap,
  Globe,
  Sparkles,
  Lock,
  Brain,
  Globe2,
  Heart
};

// Animated number counter
function Counter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Magnetic button effect
function MagneticButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPageClient({ content, footer }: { content: AboutContent; footer?: React.ReactNode }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const smoothY = useSpring(heroY, { stiffness: 100, damping: 30 });

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section - Cinematic */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(220,38,38,0.15) 0%, transparent 50%)',
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: smoothY }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-sm text-neutral-400 tracking-wide uppercase">{content.hero.overline}</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <span className="block">{content.hero.titleLine1}</span>
            <span className="block bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              {content.hero.titleLine2}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg sm:text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            {content.hero.subtitle.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < content.hero.subtitle.split('\n').length - 1 && <br className="hidden sm:block" />}
              </span>
            ))}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <MagneticButton>
              <Button size="lg" variant="secondary" className="bg-white !text-neutral-900 hover:bg-neutral-100 px-8 shadow-lg" asChild>
                <Link href="/chat" className="flex items-center gap-2 text-neutral-900">
                  <Play className="h-4 w-4 fill-current" />
                  {content.hero.ctaPrimary}
                </Link>
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/5 px-8" asChild>
                <Link href="/pricing" className="flex items-center gap-2">
                  {content.hero.ctaSecondary}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-neutral-500 animate-bounce">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section - Horizontal Scroll feel */}
      <section className="py-20 sm:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {content.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center lg:text-left"
              >
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-sm text-neutral-400">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section - Editorial Layout */}
      <section className="py-20 sm:py-32 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-red-500 text-sm uppercase tracking-widest font-medium mb-4 block">
                {content.mission.sectionLabel}
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {content.mission.title}
                <span className="block text-transparent bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text">
                  {content.mission.titleHighlight}
                </span>
              </h2>
              <div className="space-y-6 text-lg text-neutral-400 leading-relaxed">
                {content.mission.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-neutral-700 to-neutral-800"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-white font-medium">{content.mission.usersCount}</span>
                  <span className="text-neutral-500 ml-1">{content.mission.usersLabel}</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-square">
                {/* Main circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 blur-3xl" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-red-500/10 to-transparent border border-white/5" />

                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-dashed border-white/10 animate-[spin_30s_linear_infinite]"
                  />
                  <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/30 overflow-hidden">
                    <Image
                      src="/images/logo.jpg"
                      alt="RabbitHub"
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Floating elements */}
                {['DeepSeek', 'Doubao', 'Seedream', 'Seedance'].map((model, i) => (
                  <div
                    key={model}
                    className="absolute px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-400 backdrop-blur-sm animate-float-slower"
                    style={{
                      top: `${20 + i * 20}%`,
                      left: i % 2 === 0 ? '0%' : 'auto',
                      right: i % 2 === 1 ? '0%' : 'auto',
                      animationDelay: `${i * 0.5}s`,
                    }}
                  >
                    {model}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section - Card Grid */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-transparent via-red-950/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-red-500 text-sm uppercase tracking-widest font-medium mb-4 block">
              {content.values.sectionLabel}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {content.values.title}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.values.items.map((item, index) => {
              const Icon = iconMap[item.iconName] || Users;
              const number = String(index + 1).padStart(2, '0');

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all duration-300"
                >
                  {/* Number */}
                  <span className="absolute top-4 right-4 text-5xl font-bold text-white/[0.03] group-hover:text-red-500/10 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {number}
                  </span>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                    <Icon className="h-6 w-6 text-red-500" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-red-500 text-sm uppercase tracking-widest font-medium mb-4 block">
              {content.timeline.sectionLabel}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {content.timeline.title}
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />

            <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
              {content.timeline.items.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative text-center"
                >
                  {/* Dot */}
                  <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                    <div className="w-full h-full rounded-full bg-red-500" />
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-3xl font-bold text-red-500 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {milestone.year}
                    </div>
                    <div className="text-lg font-semibold text-white mb-1">{milestone.event}</div>
                    <div className="text-sm text-neutral-500">{milestone.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Magazine Style */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-transparent to-red-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-red-500 text-sm uppercase tracking-widest font-medium mb-4 block">
              {content.team.sectionLabel}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {content.team.title}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.team.members.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <div className="absolute inset-0 bg-[#0a0a0a]" />

                  {/* Avatar placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.gradient} opacity-80`} />
                  </div>

                  {/* Quote overlay on hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <div className="text-center">
                      <Quote className="h-8 w-8 text-red-500 mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-neutral-300 italic leading-relaxed">
                        "{member.quote}"
                      </p>
                    </div>
                  </motion.div>
                </div>

                <h3 className="text-lg font-bold text-white">{member.name}</h3>
                <p className="text-sm text-red-500 mb-1">{member.role}</p>
                <p className="text-xs text-neutral-500">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="h-12 w-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {content.cta.title}
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              {content.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton>
                <Button size="lg" variant="secondary" className="bg-white !text-red-600 hover:bg-neutral-100 px-8 font-semibold shadow-lg" asChild>
                  <Link href="/chat" className="flex items-center gap-2 text-red-600">
                    {content.cta.ctaPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8" asChild>
                  <Link href="/pricing">{content.cta.ctaSecondary}</Link>
                </Button>
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {footer}
    </div>
  );
}
