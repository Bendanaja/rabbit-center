'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Mail,
  MessageCircle,
  Headphones
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { PageHero } from '@/components/shared';

const faqs = [
  { q: 'เวลาตอบกลับปกติเท่าไหร่?', a: 'ทีมสนับสนุนตอบกลับภายใน 24 ชั่วโมงในวันทำการ' },
  { q: 'รองรับภาษาอะไรบ้าง?', a: 'เราให้การสนับสนุนเป็นภาษาไทยและอังกฤษ' },
  { q: 'ยกเลิกแผนได้ไหม?', a: 'ได้ครับ ยกเลิกได้ทุกเมื่อ ไม่มีค่าปรับ ใช้ได้จนหมดรอบบิล' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <PageHero
          badge={{ icon: <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />, text: 'Contact' }}
          title="ติดต่อเรา"
          subtitle="มีคำถามหรือต้องการความช่วยเหลือ? เรายินดีให้บริการ"
        />

        {/* Contact Info */}
        <section className="py-12 sm:py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <div className="p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-3">
                  ส่งอีเมลถึงเรา
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  สำหรับคำถาม ข้อเสนอแนะ หรือต้องการความช่วยเหลือ
                </p>
                <a
                  href="mailto:hello@rabbithub.co"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  hello@rabbithub.co
                </a>
                <p className="text-sm text-neutral-500 mt-4">
                  เราจะตอบกลับภายใน 24 ชั่วโมงในวันทำการ
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 sm:py-20 bg-neutral-50 dark:bg-neutral-950">
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
                  className="p-5 rounded-xl bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700"
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
              <MessageCircle className="h-12 w-12 text-white/80 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
                พร้อมเริ่มใช้งาน?
              </h2>
              <p className="text-primary-100 mb-8">
                ลองใช้ RabbitHub AI ฟรีวันนี้
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 hover:bg-neutral-100 rounded-xl font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                เริ่มแชทเลย
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
