'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Clock,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Smartphone,
  RefreshCw,
  Upload,
  FileImage,
  Loader2,
  X,
  Zap,
  Star,
  Crown,
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { Button, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { PRICING_PLANS } from '@/lib/constants';

type PaymentStep = 'phone' | 'qr' | 'verify' | 'success';

const planIcons: Record<string, React.ElementType> = {
  starter: Zap,
  pro: Star,
  premium: Crown,
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');

  // Find the plan based on query parameter, default to pro
  const selectedPlan = PRICING_PLANS.find(p => p.id === planParam) || PRICING_PLANS.find(p => p.id === 'pro') || PRICING_PLANS[1];

  const [step, setStep] = useState<PaymentStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrImageBase64, setQrImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    data?: { transactionId: string; amount: number; sender: { name: string; bank: string } };
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PlanIcon = planIcons[selectedPlan.id] || Sparkles;

  useEffect(() => {
    if (step !== 'qr' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const isPhoneValid = /^0\d{9}$/.test(phoneNumber);

  const generateQR = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PROMPTPAY',
          msisdn: phoneNumber,
          amount: selectedPlan.price,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'ไม่สามารถสร้าง QR Code ได้');
      }

      const data = await response.json();
      setQrImageBase64(data.image_base64);
      setTimeLeft(900);
      setStep('qr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setSlipImage(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const verifySlip = async () => {
    if (!slipImage) return;

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: slipImage,
          checkDuplicate: true,
          planId: selectedPlan.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถตรวจสอบสลิปได้');
      }

      setVerifyResult(data);

      if (data.success) {
        setStep('success');
      } else {
        setError(data.error || 'การตรวจสอบสลิปไม่สำเร็จ');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <FadeIn>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              กลับไปหน้าราคา
            </Link>
          </FadeIn>

          {/* Success State */}
          <AnimatePresence mode="wait">
            {step === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </motion.div>
                <h1 className="text-3xl font-display font-bold text-neutral-900 dark:text-white mb-3">
                  ชำระเงินสำเร็จ!
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-2 max-w-md mx-auto">
                  ขอบคุณสำหรับการสมัครแผน {selectedPlan.name}
                </p>
                {verifyResult?.data && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
                    <p>รหัสรายการ: {verifyResult.data.transactionId}</p>
                    <p>จำนวน: {verifyResult.data.amount?.toLocaleString()} บาท</p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/settings">ดูการสมัครสมาชิก</Link>
                  </Button>
                  <Button variant="primary" asChild>
                    <Link href="/chat">
                      <Sparkles className="h-4 w-4 mr-2" />
                      เริ่มใช้งานเลย
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <FadeIn className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                    ชำระเงินด้วย PromptPay
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    สแกน QR Code ผ่านแอปธนาคารของคุณ
                  </p>
                </FadeIn>

                {/* Order Summary Card */}
                <FadeIn delay={0.1} className="mb-6">
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
                        <PlanIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            แผน {selectedPlan.name}
                          </h3>
                          {selectedPlan.popular && (
                            <Badge variant="primary" size="sm">ยอดนิยม</Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {selectedPlan.description} - 1 {selectedPlan.period}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
                          {selectedPlan.currency}{selectedPlan.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>

                {/* Plan switcher */}
                <FadeIn delay={0.15} className="mb-6">
                  <div className="flex gap-2">
                    {PRICING_PLANS.filter(p => p.price > 0).map((p) => (
                      <Link
                        key={p.id}
                        href={`/payment?plan=${p.id}`}
                        className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          p.id === selectedPlan.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {p.name} - {p.currency}{p.price}
                      </Link>
                    ))}
                  </div>
                </FadeIn>

                {/* Error Alert */}
                {error && (
                  <FadeIn className="mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                      <button onClick={() => setError(null)} className="ml-auto">
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </FadeIn>
                )}

                {/* Step 1: Phone Number */}
                {step === 'phone' && (
                  <FadeIn delay={0.2}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                        <h2 className="font-display font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-primary-500" />
                          กรอกเบอร์โทรศัพท์ PromptPay
                        </h2>
                      </div>

                      <div className="p-6 space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            เบอร์โทรศัพท์ที่ผูกกับ PromptPay
                          </label>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                            placeholder="0812345678"
                            maxLength={10}
                            className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                          />
                          <p className="text-xs text-neutral-500 mt-2">
                            เบอร์โทรศัพท์ 10 หลักที่ขึ้นต้นด้วย 0
                          </p>
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full"
                          onClick={generateQR}
                          isLoading={loading}
                          disabled={!isPhoneValid}
                          leftIcon={<QrCode className="h-4 w-4" />}
                        >
                          สร้าง QR Code ({selectedPlan.currency}{selectedPlan.price.toLocaleString()})
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                          <Shield className="h-4 w-4" />
                          <span>การชำระเงินปลอดภัยผ่านระบบ PromptPay</span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Step 2: QR Code */}
                {step === 'qr' && (
                  <FadeIn delay={0.2}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <h2 className="font-display font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-primary-500" />
                          สแกน QR Code เพื่อชำระเงิน
                        </h2>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-neutral-500" />
                          <span className={`font-mono font-medium ${
                            timeLeft < 300 ? 'text-amber-600' : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col items-center">
                        {timeLeft < 300 && timeLeft > 0 && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4 w-full">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              เหลือเวลาอีก {formatTime(timeLeft)} นาที
                            </p>
                          </div>
                        )}

                        <div className="relative">
                          <div className="absolute -inset-3 bg-gradient-to-br from-primary-500/20 via-transparent to-primary-500/20 rounded-3xl" />
                          <div className="relative bg-white p-4 rounded-2xl shadow-lg">
                            {qrImageBase64 && (
                              <img
                                src={`data:image/png;base64,${qrImageBase64}`}
                                alt="PromptPay QR Code"
                                width={240}
                                height={240}
                                className="w-60 h-60"
                              />
                            )}
                            <div className="mt-4 flex items-center justify-center">
                              <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                                <Image
                                  src="/images/banks/PromptPay.png"
                                  alt="PromptPay"
                                  width={120}
                                  height={32}
                                  className="object-contain h-8 w-auto"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 text-center">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">จำนวนเงิน</p>
                          <p className="text-3xl font-display font-bold text-neutral-900 dark:text-white">
                            {selectedPlan.currency}{selectedPlan.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            แผน {selectedPlan.name} - 1 {selectedPlan.period}
                          </p>
                        </div>

                        <div className="mt-4 space-y-2 text-center">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            เปิดแอปธนาคารของคุณ แล้วสแกน QR Code นี้
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                            <Shield className="h-4 w-4" />
                            <span>การชำระเงินปลอดภัยผ่านระบบ PromptPay</span>
                          </div>
                        </div>

                        <div className="mt-6 flex gap-3 w-full max-w-xs">
                          <Button
                            variant="outline"
                            className="flex-1"
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                            onClick={generateQR}
                            isLoading={loading}
                          >
                            สร้าง QR ใหม่
                          </Button>
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => setStep('verify')}
                          >
                            ชำระแล้ว
                          </Button>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Step 3: Slip Verification */}
                {step === 'verify' && (
                  <FadeIn delay={0.2}>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                        <h2 className="font-display font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <FileImage className="h-4 w-4 text-primary-500" />
                          อัปโหลดสลิปเพื่อยืนยันการชำระเงิน
                        </h2>
                      </div>

                      <div className="p-6 space-y-5">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                            slipImage
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                              : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600 bg-neutral-50 dark:bg-neutral-800/50'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSlipUpload}
                            className="hidden"
                          />

                          {slipImage ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                อัปโหลดสลิปแล้ว
                              </p>
                              <p className="text-xs text-neutral-500">
                                คลิกเพื่อเปลี่ยนรูป
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                                <Upload className="h-8 w-8 text-neutral-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  คลิกเพื่ออัปโหลดสลิปการโอนเงิน
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  รองรับ PNG, JPG ขนาดไม่เกิน 5MB
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full"
                          onClick={verifySlip}
                          isLoading={verifying}
                          disabled={!slipImage}
                          leftIcon={verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                        >
                          {verifying ? 'กำลังตรวจสอบสลิป...' : 'ตรวจสอบสลิป'}
                        </Button>

                        <button
                          onClick={() => setStep('qr')}
                          className="w-full text-center text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                        >
                          กลับไปดู QR Code
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
