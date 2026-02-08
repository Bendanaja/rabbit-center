'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Sparkles,
  ArrowLeft,
  Palette,
  Eye,
  Zap,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';

type Theme = 'light' | 'dark' | 'system';

const themeOptions = [
  {
    id: 'light' as Theme,
    label: 'โหมดกลางวัน',
    description: 'สว่าง สบายตา เหมาะกับการใช้งานกลางวัน',
    icon: Sun,
    gradient: 'from-amber-400 via-orange-300 to-yellow-400',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    preview: {
      bg: 'bg-white',
      sidebar: 'bg-neutral-100',
      card: 'bg-neutral-50',
      text: 'text-neutral-900',
      accent: 'bg-red-500',
    },
  },
  {
    id: 'dark' as Theme,
    label: 'โหมดกลางคืน',
    description: 'มืด ไม่แยงตา เหมาะกับการใช้งานกลางคืน',
    icon: Moon,
    gradient: 'from-indigo-600 via-purple-600 to-violet-700',
    bg: 'bg-gradient-to-br from-indigo-950 to-purple-950',
    preview: {
      bg: 'bg-neutral-900',
      sidebar: 'bg-neutral-800',
      card: 'bg-neutral-800',
      text: 'text-white',
      accent: 'bg-red-500',
    },
  },
  {
    id: 'system' as Theme,
    label: 'ตามระบบ',
    description: 'ปรับอัตโนมัติตามการตั้งค่าอุปกรณ์',
    icon: Monitor,
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    bg: 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950',
    preview: {
      bg: 'bg-gradient-to-r from-white to-neutral-900',
      sidebar: 'bg-gradient-to-r from-neutral-100 to-neutral-800',
      card: 'bg-gradient-to-r from-neutral-50 to-neutral-800',
      text: 'text-neutral-900',
      accent: 'bg-red-500',
    },
  },
];

export default function AppearancePage() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>('system');
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleThemeChange = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsApplying(true);

    // Simulate applying theme
    setTimeout(() => {
      setIsApplying(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-12 lg:py-16 overflow-hidden">
          {/* Animated gradient background */}
          <div
            className="absolute inset-0 animate-gradient-shift-slow"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 33%, rgba(220, 38, 38, 0.1) 66%, rgba(251, 191, 36, 0.1) 100%)',
              backgroundSize: '300% 300%',
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <FadeIn>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าตั้งค่า
              </Link>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-primary-500 shadow-lg"
                >
                  <Palette className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white">
                    ธีมและการแสดงผล
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    ปรับแต่งหน้าตา RabbitHub ให้ตรงใจคุณ
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Theme Selection */}
        <section className="py-8 lg:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-xl font-display font-semibold text-neutral-900 dark:text-white mb-6">
                เลือกธีมที่ต้องการ
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {themeOptions.map((theme, index) => (
                <FadeIn key={theme.id} delay={index * 0.1}>
                  <motion.button
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`relative w-full p-1 rounded-2xl transition-all duration-300 ${
                      selectedTheme === theme.id
                        ? 'bg-gradient-to-br ' + theme.gradient + ' shadow-xl'
                        : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    <div className={`rounded-xl ${theme.bg} p-4`}>
                      {/* Selected indicator */}
                      <AnimatePresence>
                        {selectedTheme === theme.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Icon */}
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${theme.gradient} mb-4 shadow-md`}>
                        <theme.icon className="h-6 w-6 text-white" />
                      </div>

                      {/* Text */}
                      <h3 className="text-lg font-display font-semibold text-neutral-900 dark:text-white mb-1 text-left">
                        {theme.label}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 text-left">
                        {theme.description}
                      </p>
                    </div>
                  </motion.button>
                </FadeIn>
              ))}
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-emerald-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    บันทึกการตั้งค่าธีมเรียบร้อยแล้ว!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Live Preview */}
        <section className="py-8 lg:py-12 bg-white dark:bg-neutral-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-5 w-5 text-primary-500" />
                <h2 className="text-xl font-display font-semibold text-neutral-900 dark:text-white">
                  ตัวอย่างการแสดงผล
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card className="overflow-hidden p-0">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-neutral-200 dark:bg-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      rabbit.ai/chat
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                <motion.div
                  key={selectedTheme}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 ${
                    selectedTheme === 'dark'
                      ? 'bg-neutral-900'
                      : selectedTheme === 'light'
                      ? 'bg-neutral-50'
                      : 'bg-neutral-50 dark:bg-neutral-900'
                  }`}
                >
                  <div className="flex gap-4 min-h-[280px]">
                    {/* Sidebar Preview */}
                    <div
                      className={`w-48 rounded-xl p-3 space-y-2 hidden sm:block ${
                        selectedTheme === 'dark'
                          ? 'bg-neutral-800'
                          : selectedTheme === 'light'
                          ? 'bg-white border border-neutral-200'
                          : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary-500/10">
                        <div className="w-5 h-5 rounded bg-primary-500" />
                        <div
                          className={`h-3 rounded flex-1 ${
                            selectedTheme === 'dark' ? 'bg-neutral-600' : 'bg-neutral-200'
                          }`}
                        />
                      </div>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2 p-2">
                          <div
                            className={`w-5 h-5 rounded ${
                              selectedTheme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-100'
                            }`}
                          />
                          <div
                            className={`h-3 rounded flex-1 ${
                              selectedTheme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-100'
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Chat Preview */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 space-y-3">
                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="max-w-[70%] px-4 py-2 rounded-2xl rounded-br-md bg-primary-500 text-white text-sm">
                            สวัสดีครับ วันนี้อากาศเป็นอย่างไรบ้าง?
                          </div>
                        </div>

                        {/* AI message */}
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center text-white text-xs shrink-0">
                            AI
                          </div>
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl rounded-bl-md text-sm ${
                              selectedTheme === 'dark'
                                ? 'bg-neutral-800 text-neutral-200'
                                : selectedTheme === 'light'
                                ? 'bg-white text-neutral-800 border border-neutral-200'
                                : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-transparent'
                            }`}
                          >
                            สวัสดีครับ! วันนี้อากาศในกรุงเทพฯ ค่อนข้างร้อน อุณหภูมิประมาณ 34°C มีเมฆบางส่วน
                          </div>
                        </div>

                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="max-w-[70%] px-4 py-2 rounded-2xl rounded-br-md bg-primary-500 text-white text-sm">
                            ขอบคุณครับ!
                          </div>
                        </div>
                      </div>

                      {/* Input Preview */}
                      <div
                        className={`mt-4 flex items-center gap-2 p-2 rounded-xl ${
                          selectedTheme === 'dark'
                            ? 'bg-neutral-800'
                            : selectedTheme === 'light'
                            ? 'bg-white border border-neutral-200'
                            : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-transparent'
                        }`}
                      >
                        <div
                          className={`flex-1 h-8 rounded-lg ${
                            selectedTheme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-100'
                          }`}
                        />
                        <div className="w-8 h-8 rounded-lg bg-primary-500" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Card>
            </FadeIn>
          </div>
        </section>

        {/* Additional Options */}
        <section className="py-8 lg:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-xl font-display font-semibold text-neutral-900 dark:text-white mb-6">
                ตัวเลือกเพิ่มเติม
              </h2>
            </FadeIn>

            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  title: 'อนิเมชันและทรานซิชัน',
                  description: 'เปิด/ปิด animation ต่างๆ เพื่อประสิทธิภาพ',
                  enabled: true,
                },
                {
                  icon: MessageSquare,
                  title: 'ฟองข้อความแบบ Compact',
                  description: 'แสดงข้อความในขนาดเล็กลงเพื่อดูได้มากขึ้น',
                  enabled: false,
                },
                {
                  icon: Sparkles,
                  title: 'เอฟเฟกต์พิเศษ',
                  description: 'แสดงเอฟเฟกต์ประกายและการเคลื่อนไหวพิเศษ',
                  enabled: true,
                },
              ].map((option, index) => (
                <FadeIn key={option.title} delay={index * 0.05}>
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30">
                          <option.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {option.title}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={option.enabled}
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600" />
                      </label>
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </div>

            {/* Save Button */}
            <FadeIn delay={0.2}>
              <div className="mt-8 flex justify-end gap-3">
                <Button variant="ghost" asChild>
                  <Link href="/settings">ยกเลิก</Link>
                </Button>
                <Button
                  leftIcon={isApplying ? undefined : <Check className="h-4 w-4" />}
                  isLoading={isApplying}
                >
                  {isApplying ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
