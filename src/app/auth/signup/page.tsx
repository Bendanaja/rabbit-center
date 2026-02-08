'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FadeIn } from '@/components/animations';
import { SITE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const benefits = [
  '50 ข้อความฟรีต่อวัน',
  'ใช้ GPT-3.5 Turbo ได้',
  'ประวัติแชท 7 วัน',
  'ไม่ต้องใช้บัตรเครดิต',
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();
  const { user, signUpWithEmail, signInWithOAuth, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/chat');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate password - must match server-side validation
    // At least 8 chars, with uppercase, lowercase, and number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข');
      return;
    }

    const { data, error } = await signUpWithEmail(email, password, { full_name: fullName });

    if (error) {
      if (error.message.includes('already registered')) {
        setErrorMessage('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    // Check if email confirmation is required
    if (data?.user?.identities?.length === 0) {
      setErrorMessage('อีเมลนี้ถูกใช้งานแล้ว');
      return;
    }

    if (data?.user && !data?.session) {
      // Email confirmation required
      setSuccessMessage('ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
    } else {
      // Auto-confirmed, redirect to chat
      router.push('/chat');
      router.refresh();
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    await signInWithOAuth(provider);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative flex items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white max-w-md"
          >
            <div
              className="relative inline-flex items-center justify-center h-28 w-28 rounded-3xl bg-white/20 backdrop-blur-sm mb-8 overflow-hidden animate-wiggle-slow"
            >
              <Image
                src="/images/logo.jpg"
                alt="RabbitHub"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">
              เข้าร่วม RabbitHub วันนี้
            </h2>
            <p className="text-primary-100 mb-8">
              สร้างบัญชีฟรีและเริ่มแชทกับ AI ที่ทรงพลังที่สุดในโลก
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-primary-50">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <FadeIn>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/images/logo.jpg"
                  alt="RabbitHub Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-display font-bold text-xl sm:text-2xl text-neutral-900 dark:text-white">
                {SITE_CONFIG.name}
              </span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2">
              สร้างบัญชีของคุณ
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 sm:mb-8">
              เริ่มแชทกับ AI ได้ในไม่กี่วินาที
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                </div>
              )}

              <Input
                label="ชื่อ-นามสกุล"
                type="text"
                placeholder="ชื่อของคุณ"
                leftIcon={<User className="h-4 w-4" />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="อีเมล"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="รหัสผ่าน"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="สร้างรหัสผ่าน"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
              </p>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-0.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  required
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  ฉันยอมรับ{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    เงื่อนไขการใช้บริการ
                  </a>{' '}
                  และ{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    นโยบายความเป็นส่วนตัว
                  </a>
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={loading}
              >
                สร้างบัญชี
              </Button>
            </form>
          </FadeIn>

          <FadeIn delay={0.2}>
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-neutral-950 text-neutral-500">
                  หรือสมัครด้วย
                </span>
              </div>
            </div>

            {/* Social signup buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-center"
                onClick={() => handleOAuthSignup('google')}
                type="button"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="justify-center"
                onClick={() => handleOAuthSignup('github')}
                type="button"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
              มีบัญชีอยู่แล้ว?{' '}
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
