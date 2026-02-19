'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
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
  RefreshCw,
  Upload,
  FileImage,
  Loader2,
  X,
  Zap,
  Crown,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  ArrowRight,
  CreditCard,
  Gem,
  Receipt,
  PartyPopper,
  Star,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { PRICING_PLANS } from '@/lib/constants';
import { authFetch } from '@/lib/api-client';

type PaymentStep = 'pay' | 'verify' | 'success';

const planIcons: Record<string, React.ElementType> = {
  starter: Zap,
  pro: Crown,
  premium: Gem,
};

const planThemes: Record<string, {
  gradient: string;
  headerGradient: string;
  accentColor: string;
  rgb: string;
  buttonClass: string;
  glowColor: string;
  orbColor1: string;
  orbColor2: string;
}> = {
  starter: {
    gradient: 'from-blue-500/15 via-blue-600/8 to-transparent',
    headerGradient: 'from-blue-400 to-cyan-400',
    accentColor: 'text-blue-400',
    rgb: '96,165,250',
    buttonClass: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white',
    glowColor: 'rgba(96,165,250,0.4)',
    orbColor1: 'rgba(96,165,250,0.08)',
    orbColor2: 'rgba(34,211,238,0.06)',
  },
  pro: {
    gradient: 'from-red-500/18 via-rose-500/10 to-transparent',
    headerGradient: 'from-red-400 via-rose-400 to-orange-400',
    accentColor: 'text-red-400',
    rgb: '248,113,113',
    buttonClass: 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white',
    glowColor: 'rgba(248,113,113,0.4)',
    orbColor1: 'rgba(248,113,113,0.08)',
    orbColor2: 'rgba(251,146,60,0.06)',
  },
  premium: {
    gradient: 'from-amber-500/15 via-amber-600/8 to-transparent',
    headerGradient: 'from-amber-400 via-yellow-400 to-orange-400',
    accentColor: 'text-amber-400',
    rgb: '251,191,36',
    buttonClass: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold',
    glowColor: 'rgba(251,191,36,0.4)',
    orbColor1: 'rgba(251,191,36,0.08)',
    orbColor2: 'rgba(249,115,22,0.06)',
  },
};

/* ─── Copy Button ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <motion.button
      onClick={copy}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-all border border-white/[0.06] hover:border-white/[0.12]"
    >
      {copied ? (
        <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">คัดลอกแล้ว</span></>
      ) : (
        <><Copy className="h-3.5 w-3.5" /><span>คัดลอก</span></>
      )}
    </motion.button>
  );
}

/* ─── Animated Progress Steps ─── */
function ProgressSteps({ currentStep, planRgb }: { currentStep: PaymentStep; planRgb: string }) {
  const steps = [
    { key: 'pay', label: 'ชำระเงิน', icon: CreditCard },
    { key: 'verify', label: 'ยืนยันสลิป', icon: FileImage },
    { key: 'success', label: 'สำเร็จ', icon: CheckCircle2 },
  ] as const;
  const currentIdx = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        const StepIcon = s.icon;

        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{
                  scale: isActive ? 1 : isDone ? 0.95 : 0.9,
                  opacity: isActive || isDone ? 1 : 0.4,
                }}
                className="relative flex items-center justify-center"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500"
                  style={{
                    background: isDone
                      ? `rgb(${planRgb})`
                      : isActive
                        ? `rgba(${planRgb}, 0.15)`
                        : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isDone ? `rgb(${planRgb})` : isActive ? `rgba(${planRgb}, 0.35)` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isDone
                      ? `0 0 20px rgba(${planRgb}, 0.3), 0 4px 12px rgba(${planRgb}, 0.2)`
                      : isActive
                        ? `0 0 16px rgba(${planRgb}, 0.15)`
                        : 'none',
                  }}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <StepIcon
                      className="h-4 w-4 transition-colors"
                      style={{ color: isActive ? `rgb(${planRgb})` : '#525252' }}
                    />
                  )}
                </div>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ border: `1px solid rgba(${planRgb}, 0.3)` }}
                  />
                )}
              </motion.div>
              <span className={`text-sm font-medium transition-colors hidden sm:block ${
                isActive ? 'text-white' : isDone ? 'text-neutral-400' : 'text-neutral-600'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 mx-3 sm:mx-4">
                <div className="h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: isDone ? '100%' : '0%' }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    style={{
                      background: `linear-gradient(90deg, rgb(${planRgb}), rgba(${planRgb}, 0.5))`,
                      boxShadow: `0 0 8px rgba(${planRgb}, 0.4)`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Celebration particles ─── */
function CelebrationParticles({ rgb }: { rgb: string }) {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 6,
    angle: (i / 30) * 360,
    distance: 80 + Math.random() * 120,
    type: i % 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        const colors = [`rgb(${rgb})`, '#ffffff', `rgba(${rgb}, 0.6)`, '#fbbf24', '#a78bfa'];
        const color = colors[p.id % colors.length];
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: '50%',
              top: '50%',
              background: p.type === 2 ? 'transparent' : color,
              border: p.type === 2 ? `1.5px solid ${color}` : 'none',
              borderRadius: p.type === 1 ? '3px' : '50%',
              rotate: p.type === 1 ? '45deg' : '0deg',
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: tx,
              y: ty,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.3, 1, 0.5],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Animated background orbs ─── */
function BackgroundOrbs({ theme }: { theme: typeof planThemes.pro }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Primary orb */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
          background: `radial-gradient(ellipse, ${theme.orbColor1} 0%, transparent 70%)`,
        }}
        transition={{
          x: { duration: 20, repeat: Infinity, ease: 'linear' },
          y: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 20, repeat: Infinity, ease: 'linear' },
          background: { duration: 0.8, ease: 'easeInOut' },
        }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[150px]"
      />
      {/* Secondary orb */}
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 30, -20, 0],
          background: `radial-gradient(ellipse, ${theme.orbColor2} 0%, transparent 70%)`,
        }}
        transition={{
          x: { duration: 25, repeat: Infinity, ease: 'linear' },
          y: { duration: 25, repeat: Infinity, ease: 'linear' },
          background: { duration: 0.8, ease: 'easeInOut' },
        }}
        className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full blur-[120px]"
      />
      {/* Subtle cross-hatch texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.08) 60px, rgba(255,255,255,0.08) 61px)`,
      }} />
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 0.5px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />
    </div>
  );
}

/* ─── Glassmorphism Card Wrapper ─── */
function GlassCard({
  children,
  planRgb,
  className = '',
  noBorder = false,
}: {
  children: React.ReactNode;
  planRgb: string;
  className?: string;
  noBorder?: boolean;
}) {
  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      animate={{
        boxShadow: `0 0 0 1px rgba(${planRgb}, 0.08), 0 2px 4px rgba(0,0,0,0.2), 0 12px 40px -8px rgba(0,0,0,0.4), 0 24px 60px -16px rgba(0,0,0,0.3)`,
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Animated top accent line */}
      {!noBorder && (
        <div className="h-[2px] relative overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: `linear-gradient(90deg, transparent 2%, rgba(${planRgb}, 0.4) 25%, rgb(${planRgb}) 50%, rgba(${planRgb}, 0.4) 75%, transparent 98%)`,
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
              width: '40%',
            }}
          />
        </div>
      )}
      {children}
    </motion.div>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  const initialPlan = PRICING_PLANS.find(p => p.id === planParam) || PRICING_PLANS.find(p => p.id === 'pro') || PRICING_PLANS[1];

  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [step, setStep] = useState<PaymentStep>('pay');
  const [qrImageBase64, setQrImageBase64] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    data?: { transactionId: string; amount: number; planName: string; sender: { name: string; bank: string }; periodEnd: string };
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PlanIcon = planIcons[selectedPlan.id] || Sparkles;
  const theme = planThemes[selectedPlan.id] || planThemes.pro;
  const bankName = process.env.NEXT_PUBLIC_PAYMENT_BANK || 'ธนาคารกสิกรไทย';
  const accountName = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || 'แรบบิท อินโฟร์ทาวเวอร์ เทคโนโลยี';
  const accountNumber = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER || '208-8-23322-3';

  useEffect(() => {
    if (step !== 'pay' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateQR = async () => {
    setQrLoading(true);
    try {
      const response = await authFetch('/api/payment/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedPlan.price }),
      });
      if (!response.ok) { setQrImageBase64(''); return; }
      const data = await response.json();
      setQrImageBase64(data.image_base64);
      setTimeLeft(900);
    } catch {
      setQrImageBase64('');
    } finally {
      setQrLoading(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSlipPreview(result);
      setSlipImage(result.split(',')[1]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const verifySlip = async () => {
    if (!slipImage) return;
    setVerifying(true);
    setError(null);
    try {
      const response = await authFetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: slipImage, planId: selectedPlan.id, checkDuplicate: true }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) { setError(data.error || 'ไม่สามารถตรวจสอบสลิปได้'); return; }
      setVerifyResult(data);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setVerifying(false);
    }
  };

  const planLabel: Record<string, string> = {
    starter: 'เริ่มต้น',
    pro: 'โปร',
    premium: 'พรีเมียม',
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <Navbar />
      <BackgroundOrbs theme={theme} />

      <main className="relative pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">

          {/* Back navigation */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white group transition-all duration-300"
            >
              <motion.div whileHover={{ x: -3 }} className="flex items-center">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </motion.div>
              <span>กลับไปหน้าราคา</span>
            </Link>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <ProgressSteps currentStep={step} planRgb={theme.rgb} />
          </motion.div>

          {/* Plan switcher */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 backdrop-blur-sm"
          >
            {PRICING_PLANS.filter(p => p.price > 0).map((p) => {
              const t = planThemes[p.id] || planThemes.pro;
              const isSelected = p.id === selectedPlan.id;
              const PIcon = planIcons[p.id] || Sparkles;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlan(p);
                    setStep('pay');
                    setError(null);
                    setSlipImage(null);
                    setSlipPreview(null);
                    setVerifyResult(null);
                    window.history.replaceState(null, '', `/payment?plan=${p.id}`);
                  }}
                  className={`relative flex-1 text-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSelected ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="plan-tab"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, rgba(${t.rgb}, 0.2), rgba(${t.rgb}, 0.06))`,
                        border: `1px solid rgba(${t.rgb}, 0.2)`,
                        boxShadow: `0 0 20px rgba(${t.rgb}, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)`,
                      }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative flex items-center justify-center gap-1.5">
                    <PIcon className="h-3.5 w-3.5" />
                    {p.name} ฿{p.price}
                  </span>
                </button>
              );
            })}
          </motion.div>

          {/* Error toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                className="mb-5"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-sm text-red-300 flex-1">{error}</p>
                  <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-300 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════ */}
          <AnimatePresence mode="wait">

            {/* ─── SUCCESS CELEBRATION ─── */}
            {step === 'success' ? (
              <motion.div
                key={`success-${selectedPlan.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="py-6"
              >
                {/* Hero celebration */}
                <div className="relative flex flex-col items-center mb-8">
                  <CelebrationParticles rgb={theme.rgb} />

                  {/* Radiating rings */}
                  <div className="relative mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      initial={{ scale: 0.8, opacity: 0.6 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 2, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.5 }}
                      style={{ border: `2px solid rgba(${theme.rgb}, 0.25)` }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      initial={{ scale: 0.8, opacity: 0.4 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 2, ease: 'easeOut', delay: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
                      style={{ border: `1.5px solid rgba(${theme.rgb}, 0.15)` }}
                    />

                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.1 }}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, rgb(${theme.rgb}), rgba(${theme.rgb}, 0.6))`,
                        boxShadow: `0 0 60px rgba(${theme.rgb}, 0.35), 0 12px 40px rgba(${theme.rgb}, 0.25)`,
                      }}
                    >
                      <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-center"
                  >
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
                      ชำระเงินสำเร็จ!
                    </h1>
                    <p className="text-base sm:text-lg text-neutral-400">
                      ขอบคุณที่ไว้วางใจ RabbitHub AI
                    </p>
                  </motion.div>
                </div>

                {/* Plan activated badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring', bounce: 0.3 }}
                >
                  <GlassCard planRgb={theme.rgb} className="mb-5">
                    <div
                      className="px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-4"
                      style={{ background: `linear-gradient(135deg, rgba(${theme.rgb}, 0.08), rgba(${theme.rgb}, 0.02))` }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: `linear-gradient(135deg, rgba(${theme.rgb}, 0.2), rgba(${theme.rgb}, 0.06))`,
                          border: `1px solid rgba(${theme.rgb}, 0.2)`,
                          boxShadow: `0 0 20px rgba(${theme.rgb}, 0.15)`,
                        }}
                      >
                        <PlanIcon className="h-7 w-7" style={{ color: `rgb(${theme.rgb})` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-500 mb-0.5">แพ็คเกจของคุณ</p>
                        <p className="font-display font-bold text-xl text-white">
                          แผน{planLabel[selectedPlan.id] || selectedPlan.name}
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="ml-2 text-sm font-normal"
                            style={{ color: `rgb(${theme.rgb})` }}
                          >
                            เปิดใช้งานแล้ว
                          </motion.span>
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                      >
                        <PartyPopper className="h-7 w-7" style={{ color: `rgb(${theme.rgb})` }} />
                      </motion.div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Transaction receipt */}
                {verifyResult?.data && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                  >
                    <GlassCard planRgb={theme.rgb} className="mb-5">
                      {/* Left accent stripe */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] z-10" style={{
                        background: `linear-gradient(to bottom, rgb(${theme.rgb}), rgba(${theme.rgb}, 0.2))`,
                      }} />

                      <div className="bg-neutral-950/80 backdrop-blur-sm pl-6 pr-5 py-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <Receipt className="h-4 w-4 text-neutral-500" />
                          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">รายละเอียดธุรกรรม</p>
                        </div>

                        <div className="space-y-0">
                          {[
                            { label: 'รหัสรายการ', value: verifyResult.data.transactionId, mono: true },
                            { label: 'จำนวนเงิน', value: `฿${verifyResult.data.amount?.toLocaleString()}`, accent: true },
                            { label: 'ผู้โอน', value: verifyResult.data.sender.name },
                            { label: 'แผน', value: `${selectedPlan.name} (${selectedPlan.price} บาท/เดือน)` },
                            { label: 'ใช้งานได้ถึง', value: new Date(verifyResult.data.periodEnd).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) },
                          ].map((row, i) => (
                            <div key={row.label}>
                              {i > 0 && <div className="h-px bg-white/[0.04] my-3" />}
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-sm text-neutral-500 shrink-0">{row.label}</span>
                                <span
                                  className={`text-sm font-medium text-right truncate ${
                                    row.mono ? 'font-mono text-neutral-300' : row.accent ? '' : 'text-white'
                                  }`}
                                  style={row.accent ? { color: `rgb(${theme.rgb})`, fontWeight: 700, fontSize: '16px' } : undefined}
                                >
                                  {row.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* Tax invoice */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 sm:p-5 mb-7 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">ต้องการใบกำกับภาษี?</p>
                      <p className="text-xs text-neutral-500">ติดต่อเราเพื่อรับใบกำกับภาษี</p>
                    </div>
                    <Link
                      href="/contact"
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-all border border-white/[0.08] hover:border-white/[0.15]"
                    >
                      ติดต่อ
                    </Link>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 }}
                  className="flex flex-col gap-3"
                >
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/chat"
                      className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-2.5 transition-all ${theme.buttonClass}`}
                      style={{ boxShadow: `0 8px 32px -4px rgba(${theme.rgb}, 0.35), 0 0 0 1px rgba(${theme.rgb}, 0.15)` }}
                    >
                      <Sparkles className="h-5 w-5" />
                      เริ่มใช้งาน RabbitHub AI
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                  <Link
                    href="/settings"
                    className="w-full py-3 rounded-2xl text-center text-sm text-neutral-500 hover:text-neutral-300 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08] transition-all"
                  >
                    ดูการสมัครสมาชิก
                  </Link>
                </motion.div>
              </motion.div>

            ) : step === 'pay' ? (
              /* ─── STEP 1: PAY ─── */
              <motion.div
                key={`pay-${selectedPlan.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Main payment card */}
                <GlassCard planRgb={theme.rgb}>
                  {/* Plan header */}
                  <div className={`relative px-6 py-5 sm:px-7 sm:py-6 bg-gradient-to-b ${theme.gradient}`}>
                    {/* Subtle noise */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)`,
                      backgroundSize: '20px 20px',
                    }} />

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <motion.div
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                          className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.headerGradient}`}
                          style={{ boxShadow: `0 4px 16px rgba(${theme.rgb}, 0.3)` }}
                        >
                          <PlanIcon className="h-6 w-6 text-white" />
                        </motion.div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-display font-bold text-lg sm:text-xl text-white truncate">แผน {selectedPlan.name}</h3>
                            {selectedPlan.popular && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shrink-0">
                                <Star className="h-2.5 w-2.5 text-amber-900 fill-amber-900" />
                                <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wider">ยอดนิยม</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 truncate">{selectedPlan.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-4">
                        <p
                          className="text-3xl sm:text-4xl font-display font-bold tracking-tight"
                          style={{ color: `rgb(${theme.rgb})` }}
                        >
                          ฿{selectedPlan.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-600">ต่อเดือน</p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px" style={{
                    background: `linear-gradient(90deg, transparent, rgba(${theme.rgb}, 0.1) 20%, rgba(${theme.rgb}, 0.15) 50%, rgba(${theme.rgb}, 0.1) 80%, transparent)`,
                  }} />

                  {/* Bank details */}
                  <div className="relative bg-neutral-950/90 px-6 py-5 sm:px-7 sm:py-6 space-y-5">
                    {/* Bank identity */}
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl overflow-hidden bg-white p-1 shadow-md ring-1 ring-white/10 shrink-0">
                        <Image src="/images/banks/KBANK.png" alt="KBank" width={36} height={36} className="object-contain w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white truncate">{accountName}</p>
                        <p className="text-sm text-neutral-500">{bankName}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 shrink-0">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400">พร้อมรับโอน</span>
                      </div>
                    </div>

                    {/* Account number */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-neutral-600 font-medium flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          เลขที่บัญชี
                        </p>
                        <CopyButton text={accountNumber.replace(/-/g, '')} />
                      </div>
                      <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-[0.1em] leading-none">
                        {accountNumber}
                      </p>
                    </div>

                    {/* Terms link */}
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500/50 shrink-0" />
                      <p>
                        <Link href="/terms" className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors">เงื่อนไขการใช้บริการ</Link>
                      </p>
                    </div>
                  </div>

                  {/* QR section */}
                  {qrLoading ? (
                    <div className="bg-neutral-950/90 border-t border-white/[0.04] flex items-center justify-center py-10">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
                        <p className="text-sm text-neutral-600">กำลังสร้าง QR Code...</p>
                      </div>
                    </div>
                  ) : qrImageBase64 ? (
                    <div className="bg-neutral-950/90 border-t border-white/[0.04] px-6 py-6 sm:px-7 sm:py-7">
                      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                        {/* QR Code - prominent */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, type: 'spring', bounce: 0.2 }}
                          className="relative shrink-0"
                        >
                          {/* Glow behind QR */}
                          <div
                            className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                            style={{ background: `rgba(${theme.rgb}, 0.2)` }}
                          />
                          <div className="relative bg-white p-3 rounded-2xl shadow-2xl shadow-black/40">
                            <img
                              src={`data:image/png;base64,${qrImageBase64}`}
                              alt="PromptPay QR"
                              className="w-36 h-36 sm:w-44 sm:h-44"
                            />
                          </div>
                        </motion.div>

                        {/* QR info */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                            <QrCode className="h-5 w-5" style={{ color: `rgb(${theme.rgb})` }} />
                            <p className="text-base font-semibold text-white">สแกน QR PromptPay</p>
                          </div>
                          <p className="text-sm text-neutral-500 mb-3">
                            เปิดแอปธนาคาร แล้วสแกน QR Code เพื่อชำระเงิน
                          </p>
                          <Image
                            src="/images/banks/PromptPay.png"
                            alt="PromptPay"
                            width={80}
                            height={24}
                            className="object-contain h-5 w-auto opacity-40 mb-3 mx-auto sm:mx-0"
                          />
                          <div className="flex items-center justify-center sm:justify-start gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                              <Clock className="h-4 w-4" />
                              <span className={`font-mono ${timeLeft < 300 ? 'text-amber-400' : ''}`}>
                                {formatTime(timeLeft)}
                              </span>
                            </div>
                            <button
                              onClick={generateQR}
                              className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-white transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>รีเฟรช</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </GlassCard>

                {/* CTA */}
                <div className="mt-6 space-y-3">
                  <motion.button
                    onClick={() => setStep('verify')}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2.5 ${theme.buttonClass}`}
                    style={{ boxShadow: `0 8px 32px -4px rgba(${theme.rgb}, 0.35), 0 0 0 1px rgba(${theme.rgb}, 0.15)` }}
                  >
                    ชำระเงินแล้ว — อัปโหลดสลิป
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                  <p className="text-center text-xs text-neutral-600 flex items-center justify-center gap-1.5 py-1">
                    <Shield className="h-3.5 w-3.5" />
                    ตรวจสอบสลิปอัตโนมัติ &middot; เปิดใช้งานทันที
                  </p>

                  {/* Dev test button - simulate successful payment */}
                  {process.env.NODE_ENV === 'development' && (
                    <motion.button
                      onClick={() => {
                        const now = new Date();
                        const periodEnd = new Date(now);
                        periodEnd.setMonth(periodEnd.getMonth() + 1);
                        setVerifyResult({
                          success: true,
                          data: {
                            transactionId: `TEST-${Date.now().toString(36).toUpperCase()}`,
                            amount: selectedPlan.price,
                            planName: selectedPlan.name,
                            sender: { name: 'ทดสอบ ระบบชำระเงิน', bank: 'ธนาคารกสิกรไทย' },
                            periodEnd: periodEnd.toISOString(),
                          },
                        });
                        setStep('success');
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-2xl text-sm font-medium border-2 border-dashed border-amber-500/30 text-amber-400/70 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      [DEV] จำลองชำระเงินสำเร็จ
                    </motion.button>
                  )}
                </div>
              </motion.div>

            ) : (
              /* ─── STEP 2: VERIFY ─── */
              <motion.div
                key={`verify-${selectedPlan.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              >
                <GlassCard planRgb={theme.rgb}>
                  <div className="relative bg-neutral-950/90 p-6 sm:p-7">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: `rgba(${theme.rgb}, 0.1)`,
                          border: `1.5px solid rgba(${theme.rgb}, 0.15)`,
                          boxShadow: `0 0 20px rgba(${theme.rgb}, 0.1)`,
                        }}
                      >
                        <FileImage className="h-6 w-6" style={{ color: `rgb(${theme.rgb})` }} />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-xl text-white">อัปโหลดสลิปการโอนเงิน</h2>
                        <p className="text-sm text-neutral-500">ถ่ายรูปหรือแคปหน้าจอสลิปจากแอปธนาคาร</p>
                      </div>
                    </div>

                    {/* Upload zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      className={`
                        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer min-h-[200px] sm:min-h-[240px] flex items-center justify-center
                        ${slipImage
                          ? 'border-transparent'
                          : isDragging
                            ? 'border-white/25 bg-white/[0.06]'
                            : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04]'
                        }
                      `}
                      style={slipImage ? {
                        borderColor: `rgba(${theme.rgb}, 0.25)`,
                        background: `rgba(${theme.rgb}, 0.04)`,
                      } : undefined}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleSlipUpload} className="hidden" />

                      {slipImage && slipPreview ? (
                        <div className="p-5 flex items-center gap-5 w-full">
                          <div
                            className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0"
                            style={{
                              boxShadow: `0 0 0 1px rgba(${theme.rgb}, 0.2), 0 8px 24px rgba(0,0,0,0.4)`,
                            }}
                          >
                            <img src={slipPreview} alt="สลิป" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: `rgba(${theme.rgb}, 0.15)` }}
                              >
                                <Check className="h-3.5 w-3.5" style={{ color: `rgb(${theme.rgb})` }} />
                              </div>
                              <p className="text-base font-semibold" style={{ color: `rgb(${theme.rgb})` }}>
                                อัปโหลดสลิปแล้ว
                              </p>
                            </div>
                            <p className="text-sm text-neutral-500">คลิกเพื่อเปลี่ยนรูป</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 p-6">
                          <motion.div
                            animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{
                              background: isDragging ? `rgba(${theme.rgb}, 0.1)` : 'rgba(255,255,255,0.04)',
                              border: `1.5px solid ${isDragging ? `rgba(${theme.rgb}, 0.25)` : 'rgba(255,255,255,0.06)'}`,
                              boxShadow: isDragging ? `0 0 30px rgba(${theme.rgb}, 0.15)` : 'none',
                            }}
                          >
                            <Upload
                              className="h-7 w-7 transition-colors"
                              style={{ color: isDragging ? `rgb(${theme.rgb})` : '#525252' }}
                            />
                          </motion.div>
                          <div className="text-center">
                            <p className="text-base font-medium text-neutral-300 mb-1">
                              {isDragging ? 'วางไฟล์ที่นี่' : 'คลิกหรือลากสลิปมาวาง'}
                            </p>
                            <p className="text-sm text-neutral-600">PNG, JPG &middot; ไม่เกิน 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <motion.button
                    onClick={verifySlip}
                    disabled={!slipImage || verifying}
                    whileHover={{ scale: slipImage ? 1.01 : 1, y: slipImage ? -1 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed ${theme.buttonClass}`}
                    style={{
                      boxShadow: slipImage
                        ? `0 8px 32px -4px rgba(${theme.rgb}, 0.35), 0 0 0 1px rgba(${theme.rgb}, 0.15)`
                        : undefined,
                    }}
                  >
                    {verifying ? (
                      <><Loader2 className="h-5 w-5 animate-spin" />กำลังตรวจสอบสลิป...</>
                    ) : (
                      <><Shield className="h-5 w-5" />ตรวจสอบสลิป</>
                    )}
                  </motion.button>
                  <button
                    onClick={() => setStep('pay')}
                    className="w-full text-center text-sm text-neutral-600 hover:text-neutral-300 transition-colors flex items-center justify-center gap-1.5 py-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    กลับไปดูข้อมูลการโอนเงิน
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
          <p className="text-sm text-neutral-600">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
