'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Shield,
  Eye,
  Database,
  Lock,
  Share2,
  Clock,
  FileText,
  ChevronDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { PageHero } from '@/components/shared';

interface PolicySection {
  id: string;
  icon: typeof Shield;
  title: string;
  content: string[];
  highlights?: string[];
}

const policySections: PolicySection[] = [
  {
    id: 'collection',
    icon: Database,
    title: 'ข้อมูลที่เราเก็บรวบรวม',
    content: [
      'เมื่อคุณสร้างบัญชี: ชื่อ, อีเมล, รหัสผ่าน (เข้ารหัส)',
      'เมื่อคุณใช้บริการ: ข้อความแชท, การตั้งค่า, ประวัติการใช้งาน',
      'ข้อมูลอุปกรณ์: ประเภทเบราว์เซอร์, IP address, ข้อมูลการเข้าถึง',
      'ข้อมูลการชำระเงิน: ข้อมูลบัตรเครดิต (จัดเก็บโดย Stripe อย่างปลอดภัย)',
    ],
    highlights: ['เราไม่เก็บข้อความแชทเพื่อฝึก AI โมเดล', 'รหัสผ่านถูกเข้ารหัสด้วย bcrypt']
  },
  {
    id: 'usage',
    icon: Eye,
    title: 'วิธีที่เราใช้ข้อมูล',
    content: [
      'ให้บริการแชท AI และฟีเจอร์ต่างๆ ของ RabbitHub',
      'ปรับปรุงและพัฒนาบริการของเรา',
      'ส่งการแจ้งเตือนสำคัญเกี่ยวกับบัญชีและบริการ',
      'วิเคราะห์การใช้งานเพื่อปรับปรุงประสบการณ์ผู้ใช้',
      'ป้องกันการฉ้อโกงและการใช้งานที่ไม่เหมาะสม',
    ]
  },
  {
    id: 'sharing',
    icon: Share2,
    title: 'การแบ่งปันข้อมูล',
    content: [
      'เราไม่ขายข้อมูลส่วนบุคคลของคุณให้บุคคลที่สาม',
      'เราอาจแบ่งปันข้อมูลกับ:',
      '• ผู้ให้บริการ AI (OpenAI, Anthropic, Google) เพื่อประมวลผลคำขอ',
      '• ผู้ให้บริการชำระเงิน (Stripe) เพื่อดำเนินการธุรกรรม',
      '• หน่วยงานกฎหมายตามคำสั่งศาล',
    ],
    highlights: ['ข้อมูลถูกส่งไปยัง AI providers เฉพาะเพื่อตอบคำถามของคุณเท่านั้น']
  },
  {
    id: 'security',
    icon: Lock,
    title: 'ความปลอดภัยของข้อมูล',
    content: [
      'ข้อมูลทั้งหมดถูกเข้ารหัสด้วย TLS 1.3 ระหว่างการส่งข้อมูล',
      'ข้อมูลที่เก็บไว้ถูกเข้ารหัสด้วย AES-256',
      'เราใช้มาตรการรักษาความปลอดภัยระดับองค์กร',
      'มีการตรวจสอบความปลอดภัยอย่างสม่ำเสมอ',
      'เรามีนโยบาย Zero-Knowledge สำหรับข้อมูลที่ละเอียดอ่อน',
    ],
    highlights: ['SOC 2 Type II Certified', 'GDPR Compliant']
  },
  {
    id: 'retention',
    icon: Clock,
    title: 'การเก็บรักษาข้อมูล',
    content: [
      'ข้อความแชท: เก็บรักษาตามแผนของคุณ (Free: 7 วัน, Pro: ไม่จำกัด)',
      'ข้อมูลบัญชี: เก็บรักษาตราบเท่าที่บัญชียังใช้งานอยู่',
      'ข้อมูลการชำระเงิน: เก็บรักษาตามข้อกำหนดทางกฎหมาย',
      'คุณสามารถขอให้ลบข้อมูลได้ตลอดเวลา',
    ]
  },
  {
    id: 'rights',
    icon: FileText,
    title: 'สิทธิ์ของคุณ',
    content: [
      'เข้าถึง: คุณมีสิทธิ์ขอสำเนาข้อมูลส่วนบุคคลของคุณ',
      'แก้ไข: คุณสามารถอัปเดตข้อมูลส่วนบุคคลได้ตลอดเวลา',
      'ลบ: คุณสามารถขอให้ลบบัญชีและข้อมูลของคุณ',
      'ส่งออก: คุณสามารถดาวน์โหลดข้อมูลของคุณในรูปแบบมาตรฐาน',
      'คัดค้าน: คุณสามารถคัดค้านการประมวลผลข้อมูลบางประเภท',
    ],
    highlights: ['ติดต่อ privacy@rabbithub.co เพื่อใช้สิทธิ์เหล่านี้']
  },
];

// Accordion item component
function AccordionItem({ section, isOpen, onToggle }: {
  section: PolicySection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 0, scale: isOpen ? 1.1 : 1 }}
          className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0"
        >
          <Icon className={`h-5 w-5 ${isOpen ? 'text-primary-600 dark:text-primary-400' : 'text-primary-500'}`} />
        </motion.div>
        <span className="flex-1 font-semibold text-neutral-900 dark:text-white">
          {section.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-neutral-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                {section.content.map((item, i) => (
                  <li key={i} className={item.startsWith('•') ? 'pl-4' : ''}>
                    {item}
                  </li>
                ))}
              </ul>

              {section.highlights && section.highlights.length > 0 && (
                <div className="mt-4 space-y-2">
                  {section.highlights.map((highlight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {highlight}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Table of contents component
function TableOfContents({ sections, activeSection, onSelect }: {
  sections: PolicySection[];
  activeSection: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="hidden lg:block sticky top-24">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
        สารบัญ
      </h3>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => onSelect(section.id)}
              className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function PrivacyPage() {
  const [openSection, setOpenSection] = useState<string | null>('collection');

  const handleToggle = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <PageHero
          badge={{ icon: <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />, text: 'Privacy' }}
          title="นโยบายความเป็นส่วนตัว"
          subtitle="เราให้ความสำคัญกับความเป็นส่วนตัวและความปลอดภัยของข้อมูลคุณ"
        />

        {/* Last Updated */}
        <section className="py-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Clock className="h-4 w-4" />
                อัปเดตล่าสุด: 1 กุมภาพันธ์ 2026
              </div>
              <div className="animate-pulse">
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  GDPR Compliant
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 sm:py-20 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Table of Contents - Desktop */}
              <div className="lg:col-span-1">
                <TableOfContents
                  sections={policySections}
                  activeSection={openSection}
                  onSelect={handleToggle}
                />
              </div>

              {/* Policy Sections */}
              <div className="lg:col-span-3 space-y-4">
                {/* Important Notice */}
                <FadeIn>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                        สิ่งสำคัญที่ควรทราบ
                      </p>
                      <p className="text-amber-700 dark:text-amber-400">
                        RabbitHub ไม่เก็บข้อความแชทของคุณเพื่อฝึกโมเดล AI ข้อมูลของคุณถูกใช้เพื่อให้บริการเท่านั้น
                      </p>
                    </div>
                  </div>
                </FadeIn>

                {/* Accordion Sections */}
                {policySections.map((section) => (
                  <AccordionItem
                    key={section.id}
                    section={section}
                    isOpen={openSection === section.id}
                    onToggle={() => handleToggle(section.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 sm:py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <Shield className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                มีคำถามเกี่ยวกับความเป็นส่วนตัว?
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                หากคุณมีคำถามหรือต้องการใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคล กรุณาติดต่อ:
              </p>
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">Data Protection Officer</p>
                <a
                  href="mailto:privacy@rabbithub.co"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  privacy@rabbithub.co
                </a>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
