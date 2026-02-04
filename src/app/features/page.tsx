'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Sparkles,
  Brain,
  Shield,
  Zap,
  MessageSquare,
  Lock,
  Globe,
  Code,
  Layers,
  RefreshCw,
  ChevronRight,
  Bot,
  Cpu,
  Eye,
  Wand2,
  Database,
  Cloud,
  Terminal,
  Fingerprint,
  BarChart3,
  Workflow,
  ArrowRight,
  Play,
  CheckCircle2
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button, Badge } from '@/components/ui';

const featureCategories = [
  {
    id: 'ai-models',
    title: 'AI Models 2026',
    subtitle: 'Next-Gen AI',
    description: 'เข้าถึงโมเดล AI รุ่นล่าสุดของปี 2026',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/20',
    features: [
      { name: 'GPT-5 & o3', desc: 'โมเดลรุ่นล่าสุดจาก OpenAI ฉลาดกว่าเดิม 10x', icon: Sparkles },
      { name: 'Claude Opus 4.5', desc: 'AI จาก Anthropic มี 1M context window', icon: Brain },
      { name: 'Gemini 3 Ultra', desc: 'โมเดลจาก Google มี multimodal ที่ดีที่สุด', icon: Eye },
      { name: 'Llama 4 & Mistral Large 3', desc: 'Open Source AI ระดับ GPT-4', icon: Wand2 },
    ]
  },
  {
    id: 'chat',
    title: 'Chat Experience',
    subtitle: 'AI-Native Interface',
    description: 'ประสบการณ์การสนทนากับ AI ที่ล้ำสมัยที่สุดในปี 2026',
    icon: MessageSquare,
    color: 'from-blue-500 to-cyan-500',
    bgGlow: 'bg-blue-500/20',
    features: [
      { name: 'Ultra-fast Streaming', desc: 'ตอบสนองภายใน 100ms แบบ real-time', icon: Zap },
      { name: '1M+ Token Context', desc: 'จำบริบทได้ยาวกว่า 1 ล้าน tokens', icon: Database },
      { name: 'Advanced Code Editor', desc: 'เขียนโค้ดพร้อม AI autocomplete', icon: Code },
      { name: 'Vision & Voice', desc: 'รองรับรูปภาพ, PDF, เสียง และวิดีโอ', icon: Layers },
    ]
  },
  {
    id: 'security',
    title: 'Security 2026',
    subtitle: 'Zero-Trust Architecture',
    description: 'ความปลอดภัยระดับ Enterprise พร้อมมาตรฐานใหม่ล่าสุด',
    icon: Shield,
    color: 'from-emerald-500 to-green-600',
    bgGlow: 'bg-emerald-500/20',
    features: [
      { name: 'Post-Quantum Encryption', desc: 'เข้ารหัสรองรับ Quantum Computing', icon: Lock },
      { name: 'SOC 2 Type II + ISO 27001', desc: 'มาตรฐานความปลอดภัยสูงสุด', icon: CheckCircle2 },
      { name: 'Zero Data Retention', desc: 'ไม่เก็บข้อมูลเลย ลบทันทีหลังใช้', icon: Fingerprint },
      { name: 'SSO + SAML + OIDC', desc: 'เชื่อมต่อ Identity Provider ทุกแบบ', icon: Globe },
    ]
  },
  {
    id: 'integration',
    title: 'Integration',
    subtitle: 'AI-First Platform',
    description: 'เชื่อมต่อกับทุก Workflow ที่คุณใช้ในปี 2026',
    icon: Layers,
    color: 'from-orange-500 to-amber-500',
    bgGlow: 'bg-orange-500/20',
    features: [
      { name: 'MCP Protocol', desc: 'รองรับ Model Context Protocol มาตรฐานใหม่', icon: Cloud },
      { name: 'AI Agents API', desc: 'สร้าง AI Agents ที่ทำงานอัตโนมัติ', icon: Workflow },
      { name: 'SDK (Python/TS/Rust)', desc: 'SDK ที่ทันสมัยรองรับ async/streaming', icon: Terminal },
      { name: '5000+ Integrations', desc: 'เชื่อมต่อ Notion, Slack, GitHub และอื่นๆ', icon: Zap },
    ]
  },
];

const highlights = [
  { icon: Brain, value: '10+', label: 'AI Models', color: 'text-violet-400' },
  { icon: Zap, value: '3x', label: 'เร็วกว่า', color: 'text-amber-400' },
  { icon: Globe, value: '99.99%', label: 'Uptime', color: 'text-emerald-400' },
  { icon: Lock, value: '1M+', label: 'Context', color: 'text-blue-400' },
];

// 3D Tilt Card Component
function FeatureCard3D({ category, index }: { category: typeof featureCategories[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const springConfig = { stiffness: 300, damping: 30 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative h-full rounded-3xl cursor-pointer group"
      >
        {/* Glow effect */}
        <motion.div
          animate={{
            opacity: isHovered ? 0.6 : 0.2,
            scale: isHovered ? 1.05 : 1
          }}
          className={`absolute -inset-1 rounded-3xl ${category.bgGlow} blur-2xl transition-all duration-500`}
        />

        {/* Card content */}
        <div className="relative h-full p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl overflow-hidden">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5`} />

          {/* Floating decorative elements */}
          <motion.div
            animate={{
              y: isHovered ? -10 : 0,
              rotate: isHovered ? 10 : 0
            }}
            className="absolute top-4 right-4 opacity-10"
          >
            <Icon className="h-32 w-32 text-white" />
          </motion.div>

          {/* Header */}
          <div className="relative z-10">
            <motion.div
              animate={{ scale: isHovered ? 1.1 : 1 }}
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg`}
              style={{ transform: 'translateZ(30px)' }}
            >
              <Icon className="h-7 w-7 text-white" />
            </motion.div>

            <motion.p
              className="text-xs uppercase tracking-wider text-neutral-500 mb-1"
              style={{ transform: 'translateZ(20px)' }}
            >
              {category.subtitle}
            </motion.p>

            <motion.h3
              className="text-2xl font-bold text-white mb-2"
              style={{ transform: 'translateZ(25px)' }}
            >
              {category.title}
            </motion.h3>

            <motion.p
              className="text-sm text-neutral-400 mb-6"
              style={{ transform: 'translateZ(15px)' }}
            >
              {category.description}
            </motion.p>
          </div>

          {/* Features list */}
          <motion.div
            className="relative z-10 space-y-3"
            style={{ transform: 'translateZ(10px)' }}
          >
            {category.features.map((feature, i) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isHovered ? 1 : 0.7, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 group/item"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} bg-opacity-20 flex items-center justify-center`}>
                  <feature.icon className="h-4 w-4 text-white/80" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white group-hover/item:text-primary-400 transition-colors">
                    {feature.name}
                  </p>
                  <p className="text-xs text-neutral-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Hover indicator */}
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="absolute bottom-6 right-6"
          >
            <div className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
              เรียนรู้เพิ่มเติม
              <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Animated stat counter
function StatCounter({ icon: Icon, value, label, color, delay }: {
  icon: typeof Zap;
  value: string;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className="text-center"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3 ${color}`}
      >
        <Icon className="h-6 w-6" />
      </motion.div>
      <motion.div
        className="text-3xl sm:text-4xl font-bold text-white font-mono mb-1"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.2 }}
      >
        {value}
      </motion.div>
      <div className="text-sm text-neutral-400">{label}</div>
    </motion.div>
  );
}

export default function FeaturesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Animated background */}
          <div className="absolute inset-0">
            {/* Central glow */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[150px]"
            />

            {/* Orbiting elements */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: 300 + i * 150,
                  height: 300 + i * 150,
                  marginLeft: -(150 + i * 75),
                  marginTop: -(150 + i * 75),
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 20 + i * 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div
                  className="absolute w-3 h-3 rounded-full bg-primary-500/50"
                  style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
                />
              </motion.div>
            ))}

            {/* Grid */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px'
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 text-primary-400" />
                </motion.div>
                <span className="text-sm text-neutral-300">ฟีเจอร์ครบครัน</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  ฟีเจอร์ที่จะ
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                  เปลี่ยนวิธีการใช้ AI
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                รวมทุกเครื่องมือ AI ที่คุณต้องการในที่เดียว
                <br />
                <span className="text-neutral-500">พร้อมความปลอดภัยระดับองค์กร</span>
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(239, 68, 68, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-semibold flex items-center gap-2 text-lg"
                  >
                    <Play className="h-5 w-5" />
                    เริ่มใช้งานฟรี
                  </motion.button>
                </Link>
                <Link href="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold flex items-center gap-2 text-lg hover:bg-white/10 transition-colors"
                  >
                    ดูแผนราคา
                    <ChevronRight className="h-5 w-5" />
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white/50"
              />
            </div>
          </motion.div>
        </motion.section>

        {/* Stats Bar */}
        <section className="py-16 border-y border-neutral-800 bg-neutral-900/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {highlights.map((stat, index) => (
                <StatCounter
                  key={stat.label}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  color={stat.color}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-400 mb-6"
              >
                <Cpu className="h-4 w-4" />
                หมวดหมู่ฟีเจอร์
              </motion.div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                สำรวจฟีเจอร์ทั้งหมด
              </h2>
              <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
                เลื่อนเมาส์ไปบนการ์ดเพื่อดูรายละเอียด
              </p>
            </motion.div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {featureCategories.map((category, index) => (
                <FeatureCard3D key={category.id} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 sm:py-32 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                ทำไมต้องเลือก RabbitAI?
              </h2>
              <p className="text-neutral-400 max-w-xl mx-auto">
                เปรียบเทียบกับ ChatGPT และบริการอื่นๆ
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-neutral-800 overflow-hidden bg-neutral-900/50 backdrop-blur-xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left p-4 text-neutral-400 font-medium">ฟีเจอร์</th>
                      <th className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Bot className="h-5 w-5 text-primary-400" />
                          <span className="font-bold text-white">RabbitAI</span>
                        </div>
                      </th>
                      <th className="p-4 text-center text-neutral-400">ChatGPT</th>
                      <th className="p-4 text-center text-neutral-400">Claude.ai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'GPT-5, Claude 4.5, Gemini 3 ในที่เดียว', rabbit: true, chatgpt: false, claude: false },
                      { feature: 'โมเดลฟรี (StepFun, Nemotron)', rabbit: true, chatgpt: false, claude: false },
                      { feature: 'ราคาถูกกว่า 50% (จ่ายเป็นบาท)', rabbit: true, chatgpt: false, claude: false },
                      { feature: 'UI ภาษาไทยเต็มรูปแบบ', rabbit: true, chatgpt: false, claude: false },
                      { feature: 'API สำหรับนักพัฒนา', rabbit: true, chatgpt: true, claude: true },
                      { feature: 'ไม่เก็บข้อมูลฝึก AI', rabbit: true, chatgpt: false, claude: true },
                      { feature: '1M+ Context Window', rabbit: true, chatgpt: true, claude: true },
                      { feature: 'Team Collaboration', rabbit: true, chatgpt: true, claude: true },
                    ].map((row, i) => (
                      <motion.tr
                        key={row.feature}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 text-neutral-300">{row.feature}</td>
                        <td className="p-4 text-center">
                          {row.rabbit ? (
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20"
                            >
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </motion.div>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.chatgpt ? (
                            <CheckCircle2 className="h-5 w-5 text-neutral-500 mx-auto" />
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {row.claude ? (
                            <CheckCircle2 className="h-5 w-5 text-neutral-500 mx-auto" />
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-rose-600 to-amber-600" />
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10" />

              {/* Animated shapes */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [0, -90, 0]
                }}
                transition={{ duration: 25, repeat: Infinity }}
                className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              />

              {/* Content */}
              <div className="relative p-8 sm:p-12 lg:p-16 text-center">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block mb-6"
                >
                  <Bot className="h-16 w-16 text-white/80" />
                </motion.div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  พร้อมลองใช้งานแล้วหรือยัง?
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                  เริ่มต้นใช้งานฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต
                </p>

                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/chat">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 rounded-2xl bg-white text-primary-600 font-bold text-lg shadow-xl shadow-black/20"
                    >
                      เริ่มใช้งานฟรี
                    </motion.button>
                  </Link>
                  <Link href="/contact">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-colors"
                    >
                      ติดต่อทีมขาย
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
