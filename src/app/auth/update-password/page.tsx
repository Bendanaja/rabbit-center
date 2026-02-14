'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FadeIn } from '@/components/animations';
import { SITE_CONFIG } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase will automatically pick up the token from the URL hash
    // when using localStorage-based auth with detectSessionInUrl: true
    const supabase = createClient();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Listen for auth state changes (token from URL)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setSessionReady(true);
          }
        });
        return () => subscription.unsubscribe();
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านไม่ตรงกัน');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-neutral-950">
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

          {success ? (
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                เปลี่ยนรหัสผ่านสำเร็จ
              </h1>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">
                  รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว กำลังพาคุณไปหน้าเข้าสู่ระบบ...
                </p>
              </div>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full justify-center mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ไปหน้าเข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2">
                ตั้งรหัสผ่านใหม่
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 sm:mb-8">
                กรอกรหัสผ่านใหม่ของคุณ
              </p>

              {!sessionReady && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    กำลังตรวจสอบลิงก์... กรุณารอสักครู่
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                  </div>
                )}

                <div className="relative">
                  <Input
                    label="รหัสผ่านใหม่"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="ใส่รหัสผ่านใหม่"
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

                <Input
                  label="ยืนยันรหัสผ่านใหม่"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="ใส่รหัสผ่านใหม่อีกครั้ง"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร พร้อมตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข
                </p>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  isLoading={loading}
                  disabled={!sessionReady}
                >
                  เปลี่ยนรหัสผ่าน
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                <Link
                  href="/auth/login"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </p>
            </>
          )}
        </FadeIn>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}
