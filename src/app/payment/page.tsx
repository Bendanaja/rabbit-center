'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Building2,
  Clock,
  CheckCircle2,
  Copy,
  Shield,
  ArrowLeft,
  Sparkles,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Smartphone,
  RefreshCw,
  Lock,
  Calendar,
  User,
  Info,
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { PRICING_PLANS } from '@/lib/constants';

// Thai Banks Configuration with real logos
const THAI_BANKS = [
  {
    id: 'scb',
    name: 'ไทยพาณิชย์',
    nameEn: 'SCB',
    color: '#543186',
    logo: '/images/banks/SCB.png'
  },
  {
    id: 'kbank',
    name: 'กสิกรไทย',
    nameEn: 'KBANK',
    color: '#1DA858',
    logo: '/images/banks/KBANK.png'
  },
  {
    id: 'bbl',
    name: 'กรุงเทพ',
    nameEn: 'BBL',
    color: '#29449D',
    logo: '/images/banks/BBL.png'
  },
  {
    id: 'ktb',
    name: 'กรุงไทย',
    nameEn: 'KTB',
    color: '#1DA8E6',
    logo: '/images/banks/KTB.png'
  },
  {
    id: 'bay',
    name: 'กรุงศรี',
    nameEn: 'BAY',
    color: '#FFD51C',
    logo: '/images/banks/BAY.png'
  },
  {
    id: 'ttb',
    name: 'ทีทีบี',
    nameEn: 'TTB',
    color: '#0C55F2',
    logo: '/images/banks/TTB.png'
  },
  {
    id: 'cimb',
    name: 'ซีไอเอ็มบี',
    nameEn: 'CIMB',
    color: '#BD1325',
    logo: '/images/banks/CIMB.png'
  },
  {
    id: 'uob',
    name: 'ยูโอบี',
    nameEn: 'UOB',
    color: '#E41A26',
    logo: '/images/banks/UOB.png'
  },
  {
    id: 'lhbank',
    name: 'แลนด์ แอนด์ เฮ้าส์',
    nameEn: 'LH',
    color: '#727375',
    logo: '/images/banks/LHB.png'
  },
  {
    id: 'kkp',
    name: 'เกียรตินาคินภัทร',
    nameEn: 'KKP',
    color: '#5A547C',
    logo: '/images/banks/KKP.png'
  },
  {
    id: 'tisco',
    name: 'ทิสโก้',
    nameEn: 'TISCO',
    color: '#267CBC',
    logo: '/images/banks/TISCO.png'
  },
  {
    id: 'gsb',
    name: 'ออมสิน',
    nameEn: 'GSB',
    color: '#ED1891',
    logo: '/images/banks/GSB.png'
  },
  {
    id: 'baac',
    name: 'ธ.ก.ส.',
    nameEn: 'BAAC',
    color: '#CCA41C',
    logo: '/images/banks/BAAC.png'
  },
  {
    id: 'ghb',
    name: 'อาคารสงเคราะห์',
    nameEn: 'GHB',
    color: '#FF8614',
    logo: '/images/banks/GHB.png'
  },
];

// Mock account info for bank transfer
const BANK_ACCOUNT = {
  bank: 'ไทยพาณิชย์ (SCB)',
  accountNumber: '123-456-7890',
  accountName: 'บริษัท แรบบิท เอไอ จำกัด',
};

type PaymentMethod = 'card' | 'promptpay' | 'bank';
type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

// Card brand detection
const getCardBrand = (number: string): string => {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^62/.test(cleaned)) return 'unionpay';
  if (/^35/.test(cleaned)) return 'jcb';
  return '';
};

// Bank Logo Component with real images
function BankLogo({ bank, size = 'md' }: { bank: typeof THAI_BANKS[0]; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'w-8 h-8', image: 32 },
    md: { container: 'w-12 h-12', image: 48 },
    lg: { container: 'w-16 h-16', image: 64 },
  };

  return (
    <div
      className={`${sizes[size].container} rounded-xl overflow-hidden shadow-sm transition-transform bg-white flex items-center justify-center p-1`}
      title={bank.name}
    >
      <Image
        src={bank.logo}
        alt={bank.name}
        width={sizes[size].image}
        height={sizes[size].image}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

// Card Brand Icons
function CardBrandIcon({ brand, className = '' }: { brand: string; className?: string }) {
  switch (brand) {
    case 'visa':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#1A1F71"/>
          <path d="M19.5 21H17L19 11H21.5L19.5 21Z" fill="white"/>
          <path d="M28.5 11.2C28 11 27 11 26 11C23.5 11 21.5 12.5 21.5 14.5C21.5 16 23 17 24 17.5C25 18 25.5 18.5 25.5 19C25.5 19.8 24.5 20.2 23.5 20.2C22.2 20.2 21.5 20 20.5 19.5L20 19.3L19.5 22C20.5 22.4 22 22.7 23.5 22.7C26.2 22.7 28 21.2 28 19C28 17.8 27.2 17 25.5 16.2C24.5 15.7 24 15.4 24 14.8C24 14.3 24.5 13.8 25.8 13.8C26.8 13.8 27.5 14 28 14.2L28.3 14.4L28.5 11.2Z" fill="white"/>
          <path d="M33 11H31C30.3 11 29.8 11.2 29.5 12L25.5 21H28.2L28.7 19.5H32L32.3 21H34.7L32.5 11H33ZM29.5 17.5L31 13.5L31.8 17.5H29.5Z" fill="white"/>
          <path d="M16 11L13.5 18L13.2 16.8C12.5 14.5 10.5 12 8 11L10.2 21H13L18 11H16Z" fill="white"/>
          <path d="M11 11H7L7 11.2C10.2 12 12.5 14.2 13.2 16.8L12.5 12C12.3 11.3 11.8 11 11 11Z" fill="#F9A533"/>
        </svg>
      );
    case 'mastercard':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#000"/>
          <circle cx="18" cy="16" r="8" fill="#EB001B"/>
          <circle cx="30" cy="16" r="8" fill="#F79E1B"/>
          <path d="M24 9.5C25.8 11 27 13.4 27 16C27 18.6 25.8 21 24 22.5C22.2 21 21 18.6 21 16C21 13.4 22.2 11 24 9.5Z" fill="#FF5F00"/>
        </svg>
      );
    case 'amex':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#006FCF"/>
          <path d="M8 16H11L12 13L13 16H16V12H14L15 10H17V12H19L20 10H22V14H20V15H22V19H20L19 17H17V19H15L14 17H12V19H8V16Z" fill="white"/>
          <path d="M24 10H30L31 12H33L34 10H40V14H38V13H36V14H34V13H32V15H40V19H34L33 17H31L30 19H24V10ZM26 12V17H28V15H30V17H32V12H30V14H28V12H26Z" fill="white"/>
        </svg>
      );
    case 'jcb':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#fff"/>
          <rect x="8" y="6" width="10" height="20" rx="2" fill="#0B4EA2"/>
          <rect x="19" y="6" width="10" height="20" rx="2" fill="#BF1E2D"/>
          <rect x="30" y="6" width="10" height="20" rx="2" fill="#00943E"/>
          <text x="13" y="20" fill="white" fontSize="6" fontWeight="bold">J</text>
          <text x="24" y="20" fill="white" fontSize="6" fontWeight="bold">C</text>
          <text x="35" y="20" fill="white" fontSize="6" fontWeight="bold">B</text>
        </svg>
      );
    case 'unionpay':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none">
          <rect width="48" height="32" rx="4" fill="#1A3E6D"/>
          <path d="M8 8H16L20 24H12L8 8Z" fill="#01579B"/>
          <path d="M14 8H22L26 24H18L14 8Z" fill="#D32F2F"/>
          <path d="M20 8H28L32 24H24L20 8Z" fill="#0D47A1"/>
          <text x="30" y="20" fill="white" fontSize="5" fontWeight="bold">银联</text>
        </svg>
      );
    default:
      return (
        <div className={`${className} bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center`}>
          <CreditCard className="w-1/2 h-1/2 text-neutral-400" />
        </div>
      );
  }
}

export default function PaymentPage() {
  const [selectedPlan] = useState(PRICING_PLANS[1]); // Pro plan
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [copied, setCopied] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardFocused, setCardFocused] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(true);

  const cardBrand = getCardBrand(cardNumber);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').slice(0, 19) : '';
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || paymentStatus !== 'pending') return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, paymentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Mock payment simulation
  const simulatePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => setPaymentStatus('success'), 3000);
  };

  const isCardValid = cardNumber.replace(/\s/g, '').length >= 15 &&
                      cardExpiry.length === 5 &&
                      cardCvc.length >= 3 &&
                      cardName.length >= 2;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Payment Success State */}
          <AnimatePresence mode="wait">
            {paymentStatus === 'success' ? (
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
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                  ขอบคุณสำหรับการสมัครแผน {selectedPlan.name} คุณสามารถเริ่มใช้งานได้ทันที
                </p>
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
                    ชำระเงิน
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    เลือกวิธีชำระเงินที่สะดวกสำหรับคุณ
                  </p>
                </FadeIn>

                <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Left Column - Payment Methods */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Timer Warning */}
                    {timeLeft < 300 && timeLeft > 0 && paymentMethod !== 'card' && (
                      <FadeIn>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              เหลือเวลาอีก {formatTime(timeLeft)} นาที
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              กรุณาชำระเงินก่อนหมดเวลา
                            </p>
                          </div>
                        </div>
                      </FadeIn>
                    )}

                    {/* Payment Method Selection */}
                    <FadeIn delay={0.1}>
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                          <h2 className="font-display font-semibold text-neutral-900 dark:text-white">
                            เลือกวิธีชำระเงิน
                          </h2>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Credit/Debit Card Option (Stripe style) */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setPaymentMethod('card')}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              paymentMethod === 'card'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  paymentMethod === 'card'
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                    : 'bg-neutral-100 dark:bg-neutral-800'
                                }`}>
                                  <CreditCard className={`h-6 w-6 ${
                                    paymentMethod === 'card'
                                      ? 'text-white'
                                      : 'text-neutral-600 dark:text-neutral-400'
                                  }`} />
                                </div>
                                {paymentMethod === 'card' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-neutral-900 dark:text-white">
                                    บัตรเครดิต / เดบิต
                                  </span>
                                  <Badge variant="info" size="sm">Stripe</Badge>
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  Visa, Mastercard, Amex, JCB, UnionPay
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <CardBrandIcon brand="visa" className="w-8 h-5" />
                                <CardBrandIcon brand="mastercard" className="w-8 h-5" />
                                <CardBrandIcon brand="amex" className="w-8 h-5" />
                              </div>
                            </div>
                          </motion.button>

                          {/* PromptPay/ThaiQR Option */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setPaymentMethod('promptpay')}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              paymentMethod === 'promptpay'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  paymentMethod === 'promptpay'
                                    ? 'bg-primary-100 dark:bg-primary-800'
                                    : 'bg-neutral-100 dark:bg-neutral-800'
                                }`}>
                                  <QrCode className={`h-6 w-6 ${
                                    paymentMethod === 'promptpay'
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-neutral-600 dark:text-neutral-400'
                                  }`} />
                                </div>
                                {paymentMethod === 'promptpay' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-neutral-900 dark:text-white">
                                    Thai QR / พร้อมเพย์
                                  </span>
                                  <Badge variant="success" size="sm">แนะนำ</Badge>
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  สแกน QR ผ่านแอปธนาคาร • รวดเร็วทันใจ
                                </p>
                              </div>
                              <ChevronRight className={`h-5 w-5 ${
                                paymentMethod === 'promptpay'
                                  ? 'text-primary-500'
                                  : 'text-neutral-400'
                              }`} />
                            </div>
                          </motion.button>

                          {/* Bank Transfer Option */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setPaymentMethod('bank')}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                              paymentMethod === 'bank'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  paymentMethod === 'bank'
                                    ? 'bg-primary-100 dark:bg-primary-800'
                                    : 'bg-neutral-100 dark:bg-neutral-800'
                                }`}>
                                  <Building2 className={`h-6 w-6 ${
                                    paymentMethod === 'bank'
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-neutral-600 dark:text-neutral-400'
                                  }`} />
                                </div>
                                {paymentMethod === 'bank' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-neutral-900 dark:text-white">
                                  โอนผ่านธนาคาร
                                </span>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  โอนเงินผ่านบัญชีธนาคาร • รองรับทุกธนาคาร
                                </p>
                              </div>
                              <ChevronRight className={`h-5 w-5 ${
                                paymentMethod === 'bank'
                                  ? 'text-primary-500'
                                  : 'text-neutral-400'
                              }`} />
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </FadeIn>

                    {/* Payment Details */}
                    <AnimatePresence mode="wait">
                      {/* Credit Card Form (Stripe Style) */}
                      {paymentMethod === 'card' && (
                        <FadeIn key="card" delay={0.2}>
                          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                              <h2 className="font-display font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary-500" />
                                ข้อมูลบัตร
                              </h2>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Lock className="h-3.5 w-3.5" />
                                <span>ปลอดภัยด้วย Stripe</span>
                              </div>
                            </div>

                            <div className="p-6 space-y-5">
                              {/* Card Preview */}
                              <motion.div
                                className="relative h-48 w-full max-w-sm mx-auto perspective-1000"
                                animate={{ rotateY: cardFocused === 'cvc' ? 180 : 0 }}
                                transition={{ duration: 0.6 }}
                                style={{ transformStyle: 'preserve-3d' }}
                              >
                                {/* Front of card */}
                                <div
                                  className="absolute inset-0 rounded-2xl p-6 text-white"
                                  style={{
                                    backfaceVisibility: 'hidden',
                                    background: cardBrand === 'visa'
                                      ? 'linear-gradient(135deg, #1a1f71 0%, #4a50a7 100%)'
                                      : cardBrand === 'mastercard'
                                      ? 'linear-gradient(135deg, #1a1a1a 0%, #434343 100%)'
                                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  }}
                                >
                                  <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md" />
                                    <CardBrandIcon brand={cardBrand} className="w-14 h-9" />
                                  </div>
                                  <div className="font-mono text-xl tracking-widest mb-6">
                                    {cardNumber || '•••• •••• •••• ••••'}
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div>
                                      <p className="text-xs text-white/60 mb-1">ชื่อผู้ถือบัตร</p>
                                      <p className="font-medium uppercase tracking-wide text-sm">
                                        {cardName || 'YOUR NAME'}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-white/60 mb-1">หมดอายุ</p>
                                      <p className="font-mono">{cardExpiry || 'MM/YY'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Back of card */}
                                <div
                                  className="absolute inset-0 rounded-2xl text-white"
                                  style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                                  }}
                                >
                                  <div className="h-12 bg-neutral-800 mt-6" />
                                  <div className="p-6">
                                    <div className="bg-neutral-200 h-10 rounded flex items-center justify-end pr-4">
                                      <span className="font-mono text-neutral-800 text-lg">
                                        {cardCvc || '•••'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-white/60 mt-2 text-right">CVV/CVC</p>
                                  </div>
                                </div>
                              </motion.div>

                              {/* Card Number */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                  หมายเลขบัตร
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    onFocus={() => setCardFocused('number')}
                                    onBlur={() => setCardFocused(null)}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 font-mono text-lg transition-all ${
                                      cardFocused === 'number'
                                        ? 'border-primary-500 ring-4 ring-primary-500/10'
                                        : 'border-neutral-200 dark:border-neutral-700'
                                    } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white`}
                                  />
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    {cardBrand ? (
                                      <CardBrandIcon brand={cardBrand} className="w-7 h-5" />
                                    ) : (
                                      <CreditCard className="w-5 h-5 text-neutral-400" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expiry & CVC */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    วันหมดอายุ
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={cardExpiry}
                                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                      onFocus={() => setCardFocused('expiry')}
                                      onBlur={() => setCardFocused(null)}
                                      placeholder="MM/YY"
                                      maxLength={5}
                                      className={`w-full px-4 py-3 pl-12 rounded-xl border-2 font-mono text-lg transition-all ${
                                        cardFocused === 'expiry'
                                          ? 'border-primary-500 ring-4 ring-primary-500/10'
                                          : 'border-neutral-200 dark:border-neutral-700'
                                      } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white`}
                                    />
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    CVC
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={cardCvc}
                                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                      onFocus={() => setCardFocused('cvc')}
                                      onBlur={() => setCardFocused(null)}
                                      placeholder="123"
                                      maxLength={4}
                                      className={`w-full px-4 py-3 pl-12 rounded-xl border-2 font-mono text-lg transition-all ${
                                        cardFocused === 'cvc'
                                          ? 'border-primary-500 ring-4 ring-primary-500/10'
                                          : 'border-neutral-200 dark:border-neutral-700'
                                      } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white`}
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                  </div>
                                </div>
                              </div>

                              {/* Card Name */}
                              <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                  ชื่อบนบัตร
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                    onFocus={() => setCardFocused('name')}
                                    onBlur={() => setCardFocused(null)}
                                    placeholder="SOMCHAI DEEJAI"
                                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 text-lg transition-all ${
                                      cardFocused === 'name'
                                        ? 'border-primary-500 ring-4 ring-primary-500/10'
                                        : 'border-neutral-200 dark:border-neutral-700'
                                    } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white uppercase`}
                                  />
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                </div>
                              </div>

                              {/* Save Card */}
                              <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={saveCard}
                                  onChange={(e) => setSaveCard(e.target.checked)}
                                  className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                                    บันทึกบัตรสำหรับการชำระครั้งถัดไป
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    ข้อมูลบัตรจะถูกเก็บอย่างปลอดภัยโดย Stripe
                                  </p>
                                </div>
                              </label>

                              {/* Pay Button */}
                              <Button
                                variant="primary"
                                size="lg"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                onClick={simulatePayment}
                                isLoading={paymentStatus === 'processing'}
                                disabled={!isCardValid}
                                leftIcon={<Lock className="h-4 w-4" />}
                              >
                                {paymentStatus === 'processing'
                                  ? 'กำลังดำเนินการ...'
                                  : `ชำระเงิน ฿${selectedPlan.price.toLocaleString()}`
                                }
                              </Button>

                              {/* Test Card Info */}
                              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                <div className="text-xs">
                                  <p className="font-medium">ทดสอบด้วยบัตร Stripe:</p>
                                  <p className="font-mono mt-1">4242 4242 4242 4242</p>
                                  <p className="text-blue-600 dark:text-blue-400">วันหมดอายุ: อะไรก็ได้ในอนาคต, CVC: 3 หลักใดก็ได้</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </FadeIn>
                      )}

                      {/* PromptPay QR */}
                      {paymentMethod === 'promptpay' && (
                        <FadeIn key="promptpay" delay={0.2}>
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
                              {/* QR Code Display */}
                              <div className="relative">
                                <div className="absolute -inset-3 bg-gradient-to-br from-primary-500/20 via-transparent to-primary-500/20 rounded-3xl" />
                                <div className="relative bg-white p-4 rounded-2xl shadow-lg">
                                  {/* Realistic QR Code Pattern */}
                                  <div className="w-52 h-52 relative bg-white">
                                    {/* QR Code corners */}
                                    <div className="absolute top-2 left-2 w-12 h-12 border-4 border-neutral-900 rounded-lg">
                                      <div className="absolute inset-2 bg-neutral-900 rounded-sm" />
                                    </div>
                                    <div className="absolute top-2 right-2 w-12 h-12 border-4 border-neutral-900 rounded-lg">
                                      <div className="absolute inset-2 bg-neutral-900 rounded-sm" />
                                    </div>
                                    <div className="absolute bottom-2 left-2 w-12 h-12 border-4 border-neutral-900 rounded-lg">
                                      <div className="absolute inset-2 bg-neutral-900 rounded-sm" />
                                    </div>

                                    {/* QR Pattern */}
                                    <div className="absolute inset-16 grid grid-cols-8 gap-0.5">
                                      {Array.from({ length: 64 }).map((_, i) => (
                                        <div
                                          key={i}
                                          className={`rounded-sm ${
                                            Math.random() > 0.5 ? 'bg-neutral-900' : 'bg-white'
                                          }`}
                                          style={{
                                            backgroundColor: (i + Math.floor(i / 8)) % 2 === 0
                                              ? '#171717'
                                              : '#fff'
                                          }}
                                        />
                                      ))}
                                    </div>

                                    {/* Center logo */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg border-4 border-white">
                                        <span className="text-white font-display font-bold text-2xl">R</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* PromptPay Logo */}
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

                              {/* Amount */}
                              <div className="mt-6 text-center">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">จำนวนเงิน</p>
                                <p className="text-3xl font-display font-bold text-neutral-900 dark:text-white">
                                  ฿{selectedPlan.price.toLocaleString()}
                                </p>
                              </div>

                              {/* Instructions */}
                              <div className="mt-4 space-y-2 text-center">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  เปิดแอปธนาคารของคุณ แล้วสแกน QR Code นี้
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                                  <Shield className="h-4 w-4" />
                                  <span>การชำระเงินปลอดภัยผ่านระบบ PromptPay</span>
                                </div>
                              </div>

                              {/* Supported Banks */}
                              <div className="mt-6 w-full">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-3">
                                  รองรับทุกธนาคาร
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                  {THAI_BANKS.slice(0, 8).map((bank) => (
                                    <BankLogo key={bank.id} bank={bank} size="sm" />
                                  ))}
                                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                    +{THAI_BANKS.length - 8}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="mt-6 flex gap-3 w-full max-w-xs">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  leftIcon={<RefreshCw className="h-4 w-4" />}
                                  onClick={() => setTimeLeft(900)}
                                >
                                  รีเฟรช QR
                                </Button>
                                <Button
                                  variant="primary"
                                  className="flex-1"
                                  onClick={simulatePayment}
                                  isLoading={paymentStatus === 'processing'}
                                >
                                  {paymentStatus === 'processing' ? 'ตรวจสอบ...' : 'ชำระแล้ว'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </FadeIn>
                      )}

                      {/* Bank Transfer */}
                      {paymentMethod === 'bank' && (
                        <FadeIn key="bank" delay={0.2}>
                          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                              <h2 className="font-display font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary-500" />
                                เลือกธนาคารของคุณ
                              </h2>
                            </div>

                            <div className="p-4">
                              {/* Bank Grid */}
                              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-6">
                                {THAI_BANKS.map((bank) => (
                                  <motion.button
                                    key={bank.id}
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedBank(bank.id)}
                                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all bg-white dark:bg-neutral-800 border-2 ${
                                      selectedBank === bank.id
                                        ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-lg shadow-primary-500/20'
                                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md'
                                    }`}
                                    title={bank.name}
                                  >
                                    <div className="w-10 h-10 flex items-center justify-center">
                                      <Image
                                        src={bank.logo}
                                        alt={bank.name}
                                        width={40}
                                        height={40}
                                        className="object-contain w-full h-full"
                                      />
                                    </div>
                                    <span className="text-[9px] font-medium text-neutral-600 dark:text-neutral-400 mt-1 leading-tight text-center truncate w-full">
                                      {bank.nameEn}
                                    </span>
                                    {selectedBank === bank.id && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-500 shadow-md flex items-center justify-center"
                                      >
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                      </motion.div>
                                    )}
                                  </motion.button>
                                ))}
                              </div>

                              {/* Bank Account Details */}
                              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                  ข้อมูลบัญชีสำหรับโอนเงิน
                                </h3>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">ธนาคาร</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-white p-0.5">
                                        <Image
                                          src="/images/banks/SCB.png"
                                          alt="SCB"
                                          width={24}
                                          height={24}
                                          className="object-contain w-full h-full"
                                        />
                                      </div>
                                      <span className="font-medium text-neutral-900 dark:text-white">{BANK_ACCOUNT.bank}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between py-2 border-t border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">เลขบัญชี</span>
                                    <button
                                      onClick={() => copyToClipboard(BANK_ACCOUNT.accountNumber.replace(/-/g, ''), 'account')}
                                      className="flex items-center gap-2 font-mono font-semibold text-neutral-900 dark:text-white hover:text-primary-600 transition-colors"
                                    >
                                      {BANK_ACCOUNT.accountNumber}
                                      <motion.div whileTap={{ scale: 0.9 }}>
                                        {copied === 'account' ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Copy className="h-4 w-4 text-neutral-400" />
                                        )}
                                      </motion.div>
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between py-2 border-t border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">ชื่อบัญชี</span>
                                    <span className="font-medium text-neutral-900 dark:text-white text-right text-sm">{BANK_ACCOUNT.accountName}</span>
                                  </div>

                                  <div className="flex items-center justify-between py-3 border-t-2 border-neutral-200 dark:border-neutral-700">
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">จำนวนเงิน</span>
                                    <button
                                      onClick={() => copyToClipboard(selectedPlan.price.toString(), 'amount')}
                                      className="flex items-center gap-2 text-2xl font-display font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
                                    >
                                      ฿{selectedPlan.price.toLocaleString()}
                                      <motion.div whileTap={{ scale: 0.9 }}>
                                        {copied === 'amount' ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                          <Copy className="h-5 w-5 text-neutral-400" />
                                        )}
                                      </motion.div>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Timer */}
                              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                                <Clock className="h-4 w-4" />
                                <span>กรุณาชำระภายใน</span>
                                <span className={`font-mono font-semibold ${timeLeft < 300 ? 'text-amber-600' : ''}`}>
                                  {formatTime(timeLeft)}
                                </span>
                              </div>

                              <Button
                                variant="primary"
                                size="lg"
                                className="w-full mt-4"
                                onClick={simulatePayment}
                                isLoading={paymentStatus === 'processing'}
                                disabled={!selectedBank}
                              >
                                {paymentStatus === 'processing' ? 'กำลังตรวจสอบ...' : 'ฉันโอนเงินแล้ว'}
                              </Button>
                            </div>
                          </div>
                        </FadeIn>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Column - Order Summary */}
                  <div className="lg:col-span-1">
                    <FadeIn delay={0.3} className="sticky top-28">
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/30 dark:to-neutral-900">
                          <h2 className="font-display font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary-500" />
                            สรุปคำสั่งซื้อ
                          </h2>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Plan Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
                              <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-neutral-900 dark:text-white">
                                  แผน {selectedPlan.name}
                                </h3>
                                {selectedPlan.popular && (
                                  <Badge variant="primary" size="sm">ยอดนิยม</Badge>
                                )}
                              </div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {selectedPlan.description}
                              </p>
                            </div>
                          </div>

                          {/* Features Preview */}
                          <div className="space-y-2">
                            {selectedPlan.features.slice(0, 4).map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span className="text-neutral-600 dark:text-neutral-400">{feature}</span>
                              </div>
                            ))}
                            {selectedPlan.features.length > 4 && (
                              <p className="text-xs text-primary-600 dark:text-primary-400 pl-6">
                                +{selectedPlan.features.length - 4} ฟีเจอร์เพิ่มเติม
                              </p>
                            )}
                          </div>

                          {/* Price Breakdown */}
                          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-neutral-500 dark:text-neutral-400">ราคาแผน</span>
                              <span className="text-neutral-900 dark:text-white">฿{selectedPlan.price}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-neutral-500 dark:text-neutral-400">ระยะเวลา</span>
                              <span className="text-neutral-900 dark:text-white">1 {selectedPlan.period}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                              <span>ส่วนลด</span>
                              <span>-฿0</span>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-neutral-900 dark:text-white">ยอดรวม</span>
                              <span className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
                                ฿{selectedPlan.price.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              ต่ออายุอัตโนมัติทุกเดือน • ยกเลิกได้ตลอดเวลา
                            </p>
                          </div>
                        </div>

                        {/* Security Badge */}
                        <div className="px-4 pb-4">
                          <div className="flex items-center justify-center gap-2 py-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-neutral-600 dark:text-neutral-400">
                              การชำระเงินปลอดภัย 100%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods Accepted */}
                      <div className="mt-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">รับชำระผ่าน</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardBrandIcon brand="visa" className="w-10 h-6" />
                          <CardBrandIcon brand="mastercard" className="w-10 h-6" />
                          <CardBrandIcon brand="amex" className="w-10 h-6" />
                          <CardBrandIcon brand="jcb" className="w-10 h-6" />
                          <div className="h-6 bg-white rounded overflow-hidden">
                            <Image
                              src="/images/banks/PromptPay.png"
                              alt="PromptPay"
                              width={60}
                              height={24}
                              className="object-contain h-6 w-auto"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Help */}
                      <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          ต้องการความช่วยเหลือ?{' '}
                          <Link href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                            ติดต่อเรา
                          </Link>
                        </p>
                      </div>
                    </FadeIn>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
