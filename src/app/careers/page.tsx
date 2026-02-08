'use client';

import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { useState, useRef } from 'react';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  Heart,
  Coffee,
  Laptop,
  Globe,
  Plane,
  GraduationCap,
  Users,
  Sparkles,
  Building2,
  Rocket,
  ArrowRight,
  Zap,
  Star,
  CheckCircle2,
  Code,
  Palette,
  TrendingUp,
  Megaphone,
  Settings
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button, Badge } from '@/components/ui';

type Department = 'all' | 'engineering' | 'product' | 'design' | 'marketing' | 'operations';

interface Job {
  id: string;
  title: string;
  department: Exclude<Department, 'all'>;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  level: string;
  salary?: string;
  description: string;
  requirements: string[];
  hot?: boolean;
}

const departments: { id: Department; label: string; icon: typeof Code; color: string }[] = [
  { id: 'all', label: 'ทุกแผนก', icon: Sparkles, color: 'from-primary-500 to-rose-500' },
  { id: 'engineering', label: 'Engineering', icon: Code, color: 'from-blue-500 to-cyan-500' },
  { id: 'product', label: 'Product', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
  { id: 'design', label: 'Design', icon: Palette, color: 'from-pink-500 to-rose-500' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'from-green-500 to-emerald-500' },
  { id: 'operations', label: 'Operations', icon: Settings, color: 'from-amber-500 to-orange-500' },
];

const departmentColors: Record<Exclude<Department, 'all'>, string> = {
  engineering: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  product: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  design: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  marketing: 'bg-green-500/20 text-green-400 border-green-500/30',
  operations: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const jobs: Job[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Engineer',
    department: 'engineering',
    location: 'กรุงเทพฯ / Remote',
    type: 'full-time',
    level: 'Senior',
    salary: '80,000 - 150,000 บาท',
    description: 'พัฒนาและดูแลระบบ Core Platform ของ RabbitHub ทำงานกับ Next.js, Python และ AI Infrastructure',
    requirements: ['5+ ปีประสบการณ์', 'TypeScript/Python', 'AI/ML Background (เป็นข้อดี)'],
    hot: true,
  },
  {
    id: '2',
    title: 'Machine Learning Engineer',
    department: 'engineering',
    location: 'กรุงเทพฯ / Remote',
    type: 'full-time',
    level: 'Mid-Senior',
    salary: '70,000 - 130,000 บาท',
    description: 'พัฒนาและปรับปรุง AI Models สำหรับ Chat และ Analysis Features',
    requirements: ['3+ ปีประสบการณ์ ML', 'PyTorch/TensorFlow', 'LLM Experience'],
    hot: true,
  },
  {
    id: '3',
    title: 'Product Manager',
    department: 'product',
    location: 'กรุงเทพฯ',
    type: 'full-time',
    level: 'Senior',
    description: 'กำหนดทิศทางผลิตภัณฑ์ ทำงานใกล้ชิดกับทีม Engineering และ Design',
    requirements: ['5+ ปีประสบการณ์ PM', 'Tech/AI Product Background', 'Data-driven'],
  },
  {
    id: '4',
    title: 'Senior UI/UX Designer',
    department: 'design',
    location: 'กรุงเทพฯ / Hybrid',
    type: 'full-time',
    level: 'Senior',
    salary: '60,000 - 100,000 บาท',
    description: 'ออกแบบ User Experience สำหรับ AI Chat Platform ที่ใช้งานง่ายและสวยงาม',
    requirements: ['5+ ปีประสบการณ์', 'Figma Expert', 'Portfolio Required'],
  },
  {
    id: '5',
    title: 'Content Marketing Specialist',
    department: 'marketing',
    location: 'กรุงเทพฯ / Remote',
    type: 'full-time',
    level: 'Junior-Mid',
    description: 'สร้าง Content ที่น่าสนใจเกี่ยวกับ AI และ RabbitHub สำหรับ Blog และ Social Media',
    requirements: ['2+ ปีประสบการณ์', 'เขียนไทยและอังกฤษได้ดี', 'สนใจ AI'],
  },
  {
    id: '6',
    title: 'DevOps Engineer',
    department: 'engineering',
    location: 'กรุงเทพฯ / Remote',
    type: 'full-time',
    level: 'Mid',
    salary: '60,000 - 100,000 บาท',
    description: 'ดูแล Infrastructure และ CI/CD Pipeline รองรับการ Scale ของระบบ',
    requirements: ['3+ ปีประสบการณ์', 'AWS/GCP', 'Kubernetes'],
  },
  {
    id: '7',
    title: 'Customer Success Manager',
    department: 'operations',
    location: 'กรุงเทพฯ',
    type: 'full-time',
    level: 'Mid',
    description: 'ดูแลลูกค้า Enterprise ให้ใช้งาน RabbitHub ได้อย่างมีประสิทธิภาพ',
    requirements: ['3+ ปีประสบการณ์ CS', 'Tech Background', 'Communication Skills'],
  },
];

const benefits = [
  { icon: Laptop, title: 'Work from Anywhere', description: 'ทำงานจากที่ไหนก็ได้', color: 'from-blue-500 to-cyan-500' },
  { icon: Heart, title: 'สวัสดิการสุขภาพ', description: 'ประกันสุขภาพครอบครัว', color: 'from-pink-500 to-rose-500' },
  { icon: Plane, title: 'วันลาพักผ่อน', description: '20 วัน/ปี + วันลาฉุกเฉิน', color: 'from-purple-500 to-indigo-500' },
  { icon: Coffee, title: 'อาหารและเครื่องดื่ม', description: 'กาแฟ ขนม อาหารฟรี', color: 'from-amber-500 to-orange-500' },
  { icon: GraduationCap, title: 'Learning Budget', description: '50,000 บาท/ปี', color: 'from-green-500 to-emerald-500' },
  { icon: Globe, title: 'International Team', description: 'ทีมงานหลายประเทศ', color: 'from-cyan-500 to-teal-500' },
];

const stats = [
  { value: '50+', label: 'ทีมงาน' },
  { value: '100K+', label: 'ผู้ใช้งาน' },
  { value: '4.9', label: 'Glassdoor Rating' },
  { value: '95%', label: 'Employee Happiness' },
];

// Job Card Component
function JobCard({ job, index }: { job: Job; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const dept = departments.find(d => d.id === job.department);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        whileHover={{ y: -4 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative p-6 rounded-2xl border cursor-pointer transition-all ${
          job.hot
            ? 'bg-gradient-to-br from-primary-950/50 to-rose-950/30 border-primary-500/30'
            : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
        }`}
      >
        {/* Hot badge */}
        {job.hot && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 -right-3"
          >
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
              <Zap className="h-3 w-3" />
              Hot
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${departmentColors[job.department]}`}>
                {dept?.label}
              </span>
              <span className="px-2 py-1 rounded-full text-xs bg-neutral-800 text-neutral-400">
                {job.level}
              </span>
              <span className="px-2 py-1 rounded-full text-xs bg-neutral-800 text-neutral-400">
                {job.type === 'full-time' ? 'Full-time' : job.type}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {job.title}
            </h3>

            <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              // Handle apply
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-medium text-sm flex items-center gap-2 shrink-0"
          >
            สมัคร
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-400 mb-4">
          {job.description}
        </p>

        {/* Expandable requirements */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-neutral-800">
                <h4 className="text-sm font-semibold text-white mb-3">คุณสมบัติที่ต้องการ:</h4>
                <div className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-neutral-300"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      {req}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          className="absolute bottom-4 right-4 text-neutral-500"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Benefit Card Component
function BenefitCard({ benefit, index }: { benefit: typeof benefits[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="relative p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden group"
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 shadow-lg animate-float-slow`}
        style={{ animationDelay: `${index * 0.2}s` }}
      >
        <benefit.icon className="h-6 w-6 text-white" />
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{benefit.title}</h3>
      <p className="text-sm text-neutral-400">{benefit.description}</p>
    </motion.div>
  );
}

export default function CareersPage() {
  const [activeDepartment, setActiveDepartment] = useState<Department>('all');
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const filteredJobs = jobs.filter(
    job => activeDepartment === 'all' || job.department === activeDepartment
  );

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
          {/* Background */}
          <div className="absolute inset-0">
            <div
              className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[150px] animate-[spin_60s_linear_infinite]"
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[150px] animate-[spin_80s_linear_infinite_reverse]"
            />

            {/* Grid */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          {/* Content */}
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
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-neutral-300">
                  {jobs.length} ตำแหน่งที่เปิดรับ
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                  ร่วมสร้างอนาคต
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                  ของ AI ไปด้วยกัน
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                เราตามหาคนที่มีความหลงใหลใน AI
                <br />
                <span className="text-neutral-500">และอยากสร้างผลิตภัณฑ์ที่ยอดเยี่ยม</span>
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.a
                  href="#positions"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(239, 68, 68, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-rose-500 text-white font-semibold text-lg"
                >
                  ดูตำแหน่งงาน
                  <ArrowRight className="h-5 w-5" />
                </motion.a>
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
        <section className="py-16 border-y border-neutral-800 bg-neutral-900/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 sm:py-32">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-400 mb-6">
                <Heart className="h-4 w-4 text-rose-400" />
                สวัสดิการ
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                สิ่งที่คุณจะได้รับ
              </h2>
              <p className="text-neutral-400 max-w-xl mx-auto">
                เราดูแลทีมงานเหมือนครอบครัว
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {benefits.map((benefit, index) => (
                <BenefitCard key={benefit.title} benefit={benefit} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Positions Section */}
        <section id="positions" className="py-20 sm:py-32 bg-gradient-to-b from-transparent via-primary-950/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-400 mb-6">
                <Rocket className="h-4 w-4 text-primary-400" />
                เปิดรับสมัคร
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                ตำแหน่งที่เปิดรับ
              </h2>
            </motion.div>

            {/* Department Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-2 justify-center mb-12"
            >
              {departments.map((dept) => {
                const Icon = dept.icon;
                const isActive = activeDepartment === dept.id;
                return (
                  <motion.button
                    key={dept.id}
                    onClick={() => setActiveDepartment(dept.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${dept.color} text-white shadow-lg`
                        : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {dept.label}
                    {dept.id === 'all' && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                        {jobs.length}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Job List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDepartment}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredJobs.map((job, index) => (
                  <JobCard key={job.id} job={job} index={index} />
                ))}

                {filteredJobs.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Briefcase className="h-16 w-16 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-400 text-lg">
                      ยังไม่มีตำแหน่งในแผนกนี้
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-8 sm:p-12 lg:p-16 rounded-3xl overflow-hidden"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-rose-600/20 backdrop-blur-xl" />
              <div className="absolute inset-0 border border-primary-500/20 rounded-3xl" />

              <div className="relative text-center">
                <div className="inline-block mb-6 animate-float-slow">
                  <Building2 className="h-16 w-16 text-primary-400" />
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                  ไม่เห็นตำแหน่งที่เหมาะสม?
                </h2>
                <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">
                  ส่ง Resume มาให้เราได้เลย เราสนใจคนเก่งที่มี passion เสมอ
                </p>

                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-2xl bg-white text-neutral-900 font-bold text-lg"
                  >
                    ส่ง Resume
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
