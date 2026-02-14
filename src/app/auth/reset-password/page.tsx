'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FadeIn } from '@/components/animations';
import { SITE_CONFIG } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSent(true);
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

          {sent ? (
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                ตรวจสอบอีเมลของคุณ
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่ <strong className="text-neutral-900 dark:text-white">{email}</strong> แล้ว กรุณาตรวจสอบอีเมลของคุณ
              </p>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">
                  หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์สแปม
                </p>
              </div>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full justify-center mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับไปหน้าเข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2">
                ลืมรหัสผ่าน?
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 sm:mb-8">
                กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้
              </p>

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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  isLoading={loading}
                >
                  ส่งลิงก์รีเซ็ตรหัสผ่าน
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
