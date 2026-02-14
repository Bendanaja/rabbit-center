'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  User,
  Search,
  Sparkles,
  TrendingUp,
  Bookmark,
  Share2,
  ChevronRight,
  X
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { Button } from '@/components/ui';

type Category = 'all' | 'tutorials' | 'news' | 'tips' | 'engineering';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: Exclude<Category, 'all'>;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  featured?: boolean;
  trending?: boolean;
  gradient: string;
}

const categories: { id: Category; label: string; emoji: string }[] = [
  { id: 'all', label: 'ทั้งหมด', emoji: '✨' },
  { id: 'tutorials', label: 'บทเรียน', emoji: '📚' },
  { id: 'news', label: 'ข่าวสาร', emoji: '📰' },
  { id: 'tips', label: 'เคล็ดลับ', emoji: '💡' },
  { id: 'engineering', label: 'Engineering', emoji: '⚙️' },
];

const categoryColors: Record<Exclude<Category, 'all'>, { bg: string; text: string; border: string }> = {
  tutorials: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  news: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  tips: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  engineering: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: '10 วิธีใช้ AI ช่วยเพิ่มประสิทธิภาพการทำงาน',
    excerpt: 'เรียนรู้เทคนิคการใช้ AI เพื่อประหยัดเวลาและเพิ่มผลผลิตในการทำงานประจำวัน ตั้งแต่การเขียนอีเมลไปจนถึงการวิเคราะห์ข้อมูล',
    category: 'tips',
    author: 'Sarah Chen',
    authorRole: 'Content Lead',
    date: '1 ก.พ. 2026',
    readTime: '5 นาที',
    featured: true,
    gradient: 'from-amber-500 via-orange-500 to-red-500'
  },
  {
    id: '2',
    title: 'เปิดตัว Claude 3.5 Sonnet บน RabbitHub',
    excerpt: 'RabbitHub รองรับ Claude 3.5 Sonnet โมเดลใหม่ล่าสุดจาก Anthropic ที่มีความสามารถในการเข้าใจบริบทได้ดียิ่งขึ้น',
    category: 'news',
    author: 'Mike Torres',
    authorRole: 'Engineering',
    date: '28 ม.ค. 2026',
    readTime: '3 นาที',
    trending: true,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500'
  },
  {
    id: '3',
    title: 'สร้าง Chatbot ด้วย RabbitHub API ใน 10 นาที',
    excerpt: 'บทเรียนสอนสร้าง Chatbot อย่างง่ายๆ โดยใช้ RabbitHub API พร้อมตัวอย่างโค้ด Python และ JavaScript',
    category: 'tutorials',
    author: 'Alex Kim',
    authorRole: 'Developer Advocate',
    date: '25 ม.ค. 2026',
    readTime: '10 นาที',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500'
  },
  {
    id: '4',
    title: 'การออกแบบ Prompt ที่ดี: หลักการและตัวอย่าง',
    excerpt: 'เทคนิคการเขียน Prompt ให้ได้ผลลัพธ์ที่ต้องการ พร้อมตัวอย่างจริงจากการใช้งาน',
    category: 'tips',
    author: 'Lisa Wang',
    authorRole: 'AI Specialist',
    date: '20 ม.ค. 2026',
    readTime: '7 นาที',
    gradient: 'from-pink-500 via-rose-500 to-red-500'
  },
  {
    id: '5',
    title: 'ทำไมเราถึงเลือกใช้ Next.js 15 สำหรับ RabbitHub',
    excerpt: 'เบื้องหลังการตัดสินใจทางเทคนิคของทีม Engineering และประสบการณ์การอัพเกรดจาก Next.js 14',
    category: 'engineering',
    author: 'James Lee',
    authorRole: 'Tech Lead',
    date: '15 ม.ค. 2026',
    readTime: '12 นาที',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500'
  },
  {
    id: '6',
    title: 'เปรียบเทียบ GPT-4 vs Claude 3 vs Gemini Pro',
    excerpt: 'วิเคราะห์ข้อดีข้อเสียของแต่ละโมเดล เพื่อช่วยให้คุณเลือกใช้ได้ถูกกับงาน',
    category: 'tutorials',
    author: 'Emma Davis',
    authorRole: 'Research',
    date: '10 ม.ค. 2026',
    readTime: '8 นาที',
    trending: true,
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500'
  },
  {
    id: '7',
    title: 'RabbitHub ได้รับรางวัล Best AI Startup 2025',
    excerpt: 'เราภูมิใจที่ได้รับการยอมรับจากวงการเทคโนโลยีไทย ขอบคุณผู้ใช้งานทุกคน',
    category: 'news',
    author: 'RabbitHub Team',
    authorRole: 'Official',
    date: '5 ม.ค. 2026',
    readTime: '2 นาที',
    gradient: 'from-green-500 via-emerald-500 to-teal-500'
  },
  {
    id: '8',
    title: 'วิธีการ Scale AI Application ของคุณ',
    excerpt: 'บทเรียนจากประสบการณ์จริงในการรองรับผู้ใช้หลายแสนคนต่อวัน',
    category: 'engineering',
    author: 'Kevin Park',
    authorRole: 'Infrastructure',
    date: '1 ม.ค. 2026',
    readTime: '15 นาที',
    gradient: 'from-orange-500 via-red-500 to-rose-500'
  },
];

// Featured hero card
function FeaturedHeroCard({ post }: { post: BlogPost }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <motion.div
      ref={cardRef}
      style={{ scale }}
      className="relative"
    >
      <Link href={`/blog/${post.id}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8 }}
          transition={{ duration: 0.5 }}
          className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-500"
        >
          <div className="grid lg:grid-cols-2 min-h-[400px]">
            {/* Left - Content */}
            <div className="p-8 lg:p-12 flex flex-col justify-center relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${categoryColors[post.category].bg} ${categoryColors[post.category].text} ${categoryColors[post.category].border}`}>
                  {categories.find(c => c.id === post.category)?.emoji} {categories.find(c => c.id === post.category)?.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </span>
              </div>

              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-red-400 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {post.title}
              </h2>

              <p className="text-lg text-neutral-400 mb-8 leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 border border-white/10" />
                  <div>
                    <p className="text-sm font-medium text-white">{post.author}</p>
                    <p className="text-xs text-neutral-500">{post.authorRole}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </span>
                  <span>{post.date}</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-2 text-red-400 font-medium">
                อ่านบทความ
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative hidden lg:block">
              <motion.div style={{ y }} className="absolute inset-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-20`} />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0a0a0a]" />
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border border-dashed border-white/10 animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-48 h-48 rounded-full border border-white/5 animate-[spin_30s_linear_infinite_reverse]" />
                <div className={`absolute w-24 h-24 rounded-2xl bg-gradient-to-br ${post.gradient} opacity-80 shadow-2xl`} />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Blog card with glassmorphism
function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/blog/${post.id}`}>
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="group h-full rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
        >
          {/* Image area */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <motion.div
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-30`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

            {/* Category & trending */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${categoryColors[post.category].bg} ${categoryColors[post.category].text} ${categoryColors[post.category].border}`}>
                {categories.find(c => c.id === post.category)?.emoji} {categories.find(c => c.id === post.category)?.label}
              </span>

              {post.trending && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </span>
              )}
            </div>

            {/* Hover actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute bottom-4 right-4 flex items-center gap-2"
            >
              <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                <Bookmark className="h-4 w-4 text-white" />
              </button>
              <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                <Share2 className="h-4 w-4 text-white" />
              </button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {post.title}
            </h3>
            <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800" />
                <span className="text-xs text-neutral-400">{post.author}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.article>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-neutral-400 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              อัพเดทล่าสุด
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <span className="text-white">RabbitHub</span>
              <span className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent"> Blog</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto"
            >
              เรียนรู้เทคนิค AI, ข่าวสารล่าสุด, และเบื้องหลังการพัฒนา
            </motion.p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            {/* Search bar */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  boxShadow: isSearchFocused
                    ? '0 0 0 2px rgba(239, 68, 68, 0.3), 0 0 30px rgba(239, 68, 68, 0.1)'
                    : '0 0 0 0px transparent'
                }}
                className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="ค้นหาบทความ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full bg-transparent pl-14 pr-12 py-4 text-white placeholder-neutral-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4 text-neutral-500" />
                  </button>
                )}
              </motion.div>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  onClick={() => setActiveCategory(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <span className="mr-1.5">{category.emoji}</span>
                  {category.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && activeCategory === 'all' && !searchQuery && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedHeroCard post={featuredPost} />
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {filteredPosts.length > 0 ? (
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {regularPosts.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-neutral-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">ไม่พบบทความ</h3>
                <p className="text-neutral-500 mb-6">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่น</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="border-white/10 hover:bg-white/5"
                >
                  ดูบทความทั้งหมด
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Load more */}
          {filteredPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button
                variant="outline"
                size="lg"
                className="border-white/10 hover:bg-white/5 group"
              >
                โหลดเพิ่มเติม
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-purple-600/10 to-blue-600/20" />
          <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-block mb-6 animate-wiggle-slow">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ไม่พลาดบทความใหม่
            </h2>
            <p className="text-lg text-neutral-400 mb-8 max-w-xl mx-auto">
              สมัครรับข่าวสารเพื่อรับบทความ เคล็ดลับ AI และอัพเดทล่าสุดส่งตรงถึงอีเมลของคุณ
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <Button size="lg" className="bg-red-500 hover:bg-red-600 px-8 whitespace-nowrap">
                สมัครรับ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-neutral-600 mt-4">
              ไม่มีสแปม ยกเลิกได้ทุกเมื่อ
            </p>
          </motion.div>
        </div>
      </section>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
