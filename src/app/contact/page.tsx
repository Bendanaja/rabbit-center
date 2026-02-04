'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
  Building2,
  Headphones
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { PageHero } from '@/components/shared';

const contactMethods = [
  {
    icon: Mail,
    title: 'อีเมล',
    description: 'ส่งอีเมลถึงเรา',
    value: 'hello@rabbitai.co',
    action: 'mailto:hello@rabbitai.co',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'สนทนากับทีมสนับสนุน',
    value: 'ตอบกลับภายใน 5 นาที',
    action: '#chat',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Phone,
    title: 'โทรศัพท์',
    description: 'โทรหาเรา',
    value: '02-XXX-XXXX',
    action: 'tel:+6621234567',
    color: 'from-purple-500 to-pink-500'
  },
];

const officeInfo = {
  address: '123 อาคาร AI Tower ชั้น 15\nถนนสีลม แขวงสีลม\nเขตบางรัก กรุงเทพฯ 10500',
  hours: 'จันทร์ - ศุกร์: 9:00 - 18:00',
  email: 'hello@rabbitai.co',
  phone: '02-XXX-XXXX'
};

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#', handle: '@RabbitAI_TH' },
  { icon: Github, label: 'GitHub', href: '#', handle: 'rabbitai' },
  { icon: Linkedin, label: 'LinkedIn', href: '#', handle: 'RabbitAI' },
];

const faqs = [
  { q: 'เวลาตอบกลับปกติเท่าไหร่?', a: 'ทีมสนับสนุนตอบกลับภายใน 24 ชั่วโมงในวันทำการ สำหรับลูกค้า Pro และ Enterprise จะได้รับการตอบกลับภายใน 4 ชั่วโมง' },
  { q: 'รองรับภาษาอะไรบ้าง?', a: 'เราให้การสนับสนุนเป็นภาษาไทยและอังกฤษ' },
  { q: 'มี Office Hours ไหม?', a: 'มีครับ ทุกวันพุธ 14:00-15:00 เราจัดเซสชัน Q&A สดทาง Discord' },
];

// Floating label input component
function FloatingInput({ label, type = 'text', required = false, textarea = false }: {
  label: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');

  const isActive = isFocused || value.length > 0;

  const inputClasses = `w-full px-4 pt-6 pb-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <motion.label
        className={`absolute left-4 transition-all pointer-events-none ${
          isActive
            ? 'top-2 text-xs text-primary-600 dark:text-primary-400'
            : 'top-4 text-neutral-500'
        }`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </motion.label>

      {textarea ? (
        <textarea
          className={`${inputClasses} min-h-[120px] resize-none`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setValue(e.target.value)}
          required={required}
        />
      ) : (
        <input
          type={type}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setValue(e.target.value)}
          required={required}
        />
      )}
    </motion.div>
  );
}

// Success animation component
function SuccessAnimation() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
      >
        <CheckCircle className="h-10 w-10 text-green-500" />
      </motion.div>

      {/* Confetti effect */}
      <div className="relative">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'][i % 4]
            }}
            initial={{ opacity: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 0.5) * 200,
              scale: 0
            }}
            transition={{ duration: 1, delay: i * 0.05 }}
          />
        ))}
      </div>

      <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-white mb-2">
        ส่งข้อความสำเร็จ!
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400">
        เราจะตอบกลับภายใน 24 ชั่วโมง
      </p>
    </motion.div>
  );
}

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <PageHero
          badge={{ icon: <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />, text: 'Contact' }}
          title="ติดต่อเรา"
          subtitle="มีคำถามหรือต้องการความช่วยเหลือ? เรายินดีให้บริการ"
        />

        {/* Contact Methods */}
        <section className="py-8 bg-white dark:bg-neutral-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contactMethods.map((method) => (
                <StaggerItem key={method.title}>
                  <motion.a
                    href={method.action}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="block p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-lg transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4`}>
                      <method.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                      {method.title}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-2">{method.description}</p>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {method.value}
                    </p>
                  </motion.a>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 sm:py-20 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <FadeIn>
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
                    ส่งข้อความถึงเรา
                  </h2>

                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <SuccessAnimation />
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FloatingInput label="ชื่อ" required />
                          <FloatingInput label="นามสกุล" required />
                        </div>
                        <FloatingInput label="อีเมล" type="email" required />
                        <FloatingInput label="หัวข้อ" required />
                        <FloatingInput label="ข้อความ" textarea required />

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          isLoading={isLoading}
                          rightIcon={!isLoading && <Send className="h-4 w-4" />}
                        >
                          {isLoading ? 'กำลังส่ง...' : 'ส่งข้อความ'}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>

              {/* Office Info & Map */}
              <div className="space-y-6">
                {/* Map Placeholder */}
                <FadeIn delay={0.1}>
                  <div className="relative h-64 rounded-3xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                    {/* Map placeholder with ping animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: [1, 2, 2],
                            opacity: [0.5, 0.3, 0]
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 rounded-full bg-primary-500"
                        />
                        <div className="w-4 h-4 rounded-full bg-primary-500 relative z-10" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/50 to-neutral-200/50 dark:from-neutral-700/50 dark:to-neutral-800/50" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="p-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          RabbitAI Headquarters
                        </p>
                        <p className="text-xs text-neutral-500">กรุงเทพมหานคร</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>

                {/* Office Details */}
                <FadeIn delay={0.2}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="h-5 w-5 text-primary-500" />
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        สำนักงานใหญ่
                      </h3>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-neutral-400 mt-1 shrink-0" />
                        <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                          {officeInfo.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-neutral-400 shrink-0" />
                        <p className="text-neutral-600 dark:text-neutral-400">
                          {officeInfo.hours}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>

                {/* Social Links */}
                <FadeIn delay={0.3}>
                  <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                      ติดตามเรา
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {socialLinks.map((social) => (
                        <motion.a
                          key={social.label}
                          href={social.href}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <social.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{social.handle}</span>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 sm:py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <Badge variant="default" className="mb-4">
                <Headphones className="h-3 w-3 mr-1" />
                FAQ
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
                คำถามที่พบบ่อย
              </h2>
            </FadeIn>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700"
                >
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-primary-600 to-primary-700">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Headphones className="h-12 w-12 text-white/80 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
                ต้องการความช่วยเหลือทันที?
              </h2>
              <p className="text-primary-100 mb-8">
                ทีมสนับสนุนของเราพร้อมช่วยเหลือคุณตลอด 24/7
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-primary-700 hover:bg-neutral-100"
                leftIcon={<MessageCircle className="h-4 w-4" />}
              >
                เริ่ม Live Chat
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
