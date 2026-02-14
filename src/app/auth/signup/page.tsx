'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Check, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FadeIn } from '@/components/animations';
import { SITE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

const benefits = [
  '30 ข้อความฟรีต่อวัน',
  'ใช้ Seed 1.6 Flash ได้',
  'ประวัติแชท 7 วัน',
  'ไม่ต้องใช้บัตรเครดิต',
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

    // Validate phone number if provided (Thai format)
    if (phoneNumber) {
      const cleaned = phoneNumber.replace(/[-\s]/g, '');
      const thaiPhoneRegex = /^0[0-9]{8,9}$/;
      if (!thaiPhoneRegex.test(cleaned)) {
        setErrorMessage('เบอร์โทรศัพท์ไม่ถูกต้อง (รูปแบบ: 0x-xxxx-xxxx)');
        return;
      }
    }

    // Validate password - must match server-side validation
    // At least 8 chars, with uppercase, lowercase, and number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข');
      return;
    }

    const { data, error } = await signUpWithEmail(email, password, {
      full_name: fullName,
      phone_number: phoneNumber || undefined,
    });

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

  const handleOAuthSignup = async (provider: 'google' | 'github' | 'facebook') => {
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
                sizes="112px"
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
                  sizes="48px"
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

              <Input
                label="เบอร์โทรศัพท์ (ไม่บังคับ)"
                type="tel"
                placeholder="08x-xxx-xxxx"
                leftIcon={<Phone className="h-4 w-4" />}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                    เงื่อนไขการใช้บริการ
                  </Link>{' '}
                  และ{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                    นโยบายความเป็นส่วนตัว
                  </Link>
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

          {/* OAuth providers - disabled until configured */}

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
