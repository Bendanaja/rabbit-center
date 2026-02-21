'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Brain,
  MessageSquare,
  Sparkles,
  Zap,
  Globe,
  Eye,
  Wand2,
  Bot,
  Play,
  CheckCircle2,
  XCircle,
  Stars,
  ImagePlus,
  Video,
  Search,
  Mic,
  Pencil,
  Code,
  Smartphone,
  Moon,
  Banknote,
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { type FeaturesContent } from '@/lib/content';

// Category visual config
const categoryConfig: Record<string, { icon: React.ElementType; gradient: string }> = {
  'ai-models': { icon: Brain, gradient: 'from-violet-500 to-fuchsia-500' },
  'chat': { icon: MessageSquare, gradient: 'from-primary-500 to-rose-500' },
  'security': { icon: Sparkles, gradient: 'from-emerald-400 to-teal-500' },
  'integration': { icon: Globe, gradient: 'from-amber-400 to-orange-500' },
};

// Feature icons per category
const featureIconMap: Record<string, React.ElementType[]> = {
  'ai-models': [Sparkles, Brain, Eye, Wand2],
  'chat': [Zap, ImagePlus, Video, Search],
  'security': [Eye, Mic, Pencil, Code],
  'integration': [Globe, Banknote, Moon, Smartphone],
};

// Stats icons
const statsConfig: Record<string, { icon: React.ElementType; color: string }> = {
  '20+': { icon: Brain, color: 'text-violet-400' },
  'รูป+วิดีโอ': { icon: ImagePlus, color: 'text-primary-400' },
  '100%': { icon: Globe, color: 'text-emerald-400' },
  'ฟรี': { icon: Zap, color: 'text-amber-400' },
};

export default function FeaturesPageClient({ content, footer }: { content: FeaturesContent; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-primary-500/30">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-primary-600/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <FadeIn>
              <Badge variant="default" className="bg-white/5 border-white/10 backdrop-blur-md text-neutral-300 py-1.5 px-4 mb-8">
                <Stars className="w-3 h-3 mr-2 text-primary-400" />
                {content.hero.badge}
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-black text-white mb-6 leading-[1.05] tracking-tighter">
                {content.hero.titleLine1} <br />
                <span className="bg-gradient-to-r from-primary-400 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  {content.hero.titleLine2}
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                {content.hero.subtitle} <br className="hidden md:block" />
                <span className="text-neutral-500">{content.hero.subtitleSecondary}</span>
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="primary" size="lg" className="w-full sm:w-auto h-14 px-8 text-base shadow-premium-glow rounded-2xl" asChild>
                  <Link href="/chat">
                    <Play className="h-5 w-5 mr-2" /> เริ่มใช้งานฟรี
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-white/5 border-white/10 text-white backdrop-blur-md rounded-2xl hover:bg-white/10" asChild>
                  <Link href="/pricing">รูปแบบราคา</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Stats */}
        <section className="relative z-20 -mt-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.stats.map((stat, index) => {
              const config = statsConfig[stat.value] || { icon: Brain, color: 'text-primary-400' };
              const Icon = config.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm"
                >
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-black text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-500">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Feature Categories */}
        <section className="py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
                ทุกฟีเจอร์ที่คุณต้องการ
              </h2>
              <p className="text-lg text-neutral-400 max-w-xl mx-auto font-light">
                ครบทุกความสามารถ AI ในแพลตฟอร์มเดียว
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.categories.map((category, index) => {
                const config = categoryConfig[category.id] || { icon: Brain, gradient: 'from-primary-500 to-rose-500' };
                const icons = featureIconMap[category.id] || [Sparkles, Sparkles, Sparkles, Sparkles];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                          {category.subtitle}
                        </p>
                        <h3 className="text-xl font-display font-bold text-white">
                          {category.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                      {category.description}
                    </p>

                    <div className="space-y-3">
                      {category.features.map((feature, i) => {
                        const FeatureIcon = icons[i] || Sparkles;
                        return (
                          <div key={feature.name} className="flex items-start gap-3">
                            <div className="mt-0.5 w-6 h-6 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                              <FeatureIcon className="h-3 w-3 text-neutral-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-200">{feature.name}</p>
                              <p className="text-xs text-neutral-500 mt-0.5">{feature.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-24 sm:py-32 bg-neutral-950 border-y border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
                ทำไมต้องเลือก <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-rose-500">RabbitHub?</span>
              </h2>
              <p className="text-lg text-neutral-400 font-light">
                เปรียบเทียบกับบริการ AI อื่นๆ
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-5 font-medium text-neutral-400 text-sm">ฟีเจอร์</th>
                        <th className="p-5 text-center border-x border-primary-500/20 bg-primary-500/5">
                          <div className="flex flex-col items-center gap-1">
                            <Bot className="w-5 h-5 text-primary-400" />
                            <span className="font-display font-bold text-white">RabbitHub</span>
                          </div>
                        </th>
                        <th className="p-5 text-center text-sm text-neutral-400">ChatGPT</th>
                        <th className="p-5 text-center text-sm text-neutral-400">Claude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {content.comparison.map((row) => (
                        <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-5 text-sm text-neutral-300">{row.feature}</td>
                          <td className="p-5 text-center border-x border-primary-500/10 bg-primary-500/[0.02]">
                            {row.rabbithub ? (
                              <CheckCircle2 className="w-5 h-5 text-primary-400 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-neutral-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-5 text-center">
                            {row.chatgpt ? (
                              <CheckCircle2 className="w-5 h-5 text-neutral-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-neutral-700 mx-auto" />
                            )}
                          </td>
                          <td className="p-5 text-center">
                            {row.claude ? (
                              <CheckCircle2 className="w-5 h-5 text-neutral-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-neutral-700 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-r from-primary-600/30 via-rose-600/30 to-primary-900/30 blur-[100px] rounded-full pointer-events-none" />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
            <FadeIn>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-6">
                {content.cta.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-lg text-neutral-300 mb-10 max-w-xl mx-auto font-light">
                {content.cta.subtitle}
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="primary" size="lg" className="h-14 px-8 text-base shadow-premium-glow rounded-2xl" asChild>
                  <Link href="/auth/signup">{content.cta.ctaPrimary}</Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md" asChild>
                  <Link href="/contact">{content.cta.ctaSecondary}</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {footer}
    </div>
  );
}
