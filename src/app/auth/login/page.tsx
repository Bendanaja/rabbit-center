'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FadeIn } from '@/components/animations';
import { SITE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/chat';

  const { user, signInWithEmail, signInWithOAuth, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/chat');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const { error, data } = await signInWithEmail(email, password);

    if (error) {
      setErrorMessage(
        error.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : error.message
      );
      return;
    }

    // Redirect after successful login
    // Session is stored in localStorage, so router.push works
    if (data?.session) {
      console.log('[Login] Success, redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'facebook') => {
    await signInWithOAuth(provider);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
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
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <span className="font-display font-bold text-xl sm:text-2xl text-neutral-900 dark:text-white">
                {SITE_CONFIG.name}
              </span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2">
              ยินดีต้อนรับกลับ
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 sm:mb-8">
              เข้าสู่ระบบเพื่อแชทกับ AI ต่อ
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

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
                  placeholder="ใส่รหัสผ่านของคุณ"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    จดจำฉัน
                  </span>
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={loading}
              >
                เข้าสู่ระบบ
              </Button>
            </form>
          </FadeIn>

          {/* OAuth providers - disabled until configured */}

          <FadeIn delay={0.3}>
            <p className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
              ยังไม่มีบัญชี?{' '}
              <Link
                href="/auth/signup"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                สมัครฟรี
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Right side - Hero image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative flex items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center text-white max-w-md"
          >
            <div
              className="relative inline-flex items-center justify-center h-28 w-28 rounded-3xl bg-white/20 backdrop-blur-sm mb-8 overflow-hidden animate-wiggle-slow"
            >
              <Image
                src="/images/logo.jpg"
                alt="RabbitHub"
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">
              เริ่มแชทกับ AI วันนี้
            </h2>
            <p className="text-primary-100">
              เข้าถึง DeepSeek, Doubao และ AI อื่นๆ ในที่เดียว ราคาเรียบง่าย
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-200" />
                <span className="text-sm">7+ AI โมเดล</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-200" />
                <span className="text-sm">แชทไม่จำกัด</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
