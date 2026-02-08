'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronUp,
  Printer,
  Download,
  Scale
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { PageHero } from '@/components/shared';

interface TermsSection {
  id: string;
  number: string;
  title: string;
  content: string[];
  important?: boolean;
}

const termsSections: TermsSection[] = [
  {
    id: 'acceptance',
    number: '1',
    title: 'การยอมรับข้อตกลง',
    content: [
      'โดยการเข้าถึงหรือใช้บริการ RabbitHub คุณตกลงที่จะผูกพันตามข้อกำหนดการใช้งานนี้',
      'หากคุณไม่ยอมรับข้อกำหนดทั้งหมด คุณไม่มีสิทธิ์ใช้บริการ',
      'การใช้บริการต่อไปหลังจากมีการเปลี่ยนแปลงข้อกำหนด ถือว่าคุณยอมรับการเปลี่ยนแปลงนั้น',
    ]
  },
  {
    id: 'eligibility',
    number: '2',
    title: 'คุณสมบัติผู้ใช้',
    content: [
      'คุณต้องมีอายุอย่างน้อย 13 ปี เพื่อใช้บริการ',
      'หากคุณอายุต่ำกว่า 18 ปี คุณต้องได้รับความยินยอมจากผู้ปกครอง',
      'หากคุณใช้บริการในนามองค์กร คุณรับรองว่ามีอำนาจในการยอมรับข้อกำหนดนี้',
    ]
  },
  {
    id: 'account',
    number: '3',
    title: 'บัญชีผู้ใช้',
    content: [
      'คุณต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการลงทะเบียน',
      'คุณรับผิดชอบในการรักษาความลับของรหัสผ่าน',
      'คุณต้องแจ้งเราทันทีหากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต',
      'เราสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดข้อกำหนด',
    ]
  },
  {
    id: 'acceptable-use',
    number: '4',
    title: 'การใช้งานที่ยอมรับได้',
    content: [
      'ห้ามใช้บริการเพื่อกิจกรรมที่ผิดกฎหมาย',
      'ห้ามสร้างเนื้อหาที่เป็นอันตราย หลอกลวง หรือละเมิดสิทธิ์ผู้อื่น',
      'ห้ามพยายามเข้าถึงระบบหรือข้อมูลโดยไม่ได้รับอนุญาต',
      'ห้ามใช้บริการในลักษณะที่อาจทำให้ระบบเสียหายหรือขัดข้อง',
      'ห้ามใช้ bot หรือ scraper โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร',
    ],
    important: true
  },
  {
    id: 'ai-content',
    number: '5',
    title: 'เนื้อหาที่สร้างโดย AI',
    content: [
      'เนื้อหาที่สร้างโดย AI อาจไม่ถูกต้องเสมอไป คุณควรตรวจสอบข้อมูลสำคัญ',
      'คุณรับผิดชอบในการใช้งานเนื้อหาที่ AI สร้างขึ้น',
      'ห้ามใช้เนื้อหา AI เพื่อแอบอ้างเป็นบุคคลจริง',
      'เราไม่รับประกันว่าเนื้อหา AI จะปลอดจากข้อผิดพลาดหรืออคติ',
    ],
    important: true
  },
  {
    id: 'intellectual-property',
    number: '6',
    title: 'ทรัพย์สินทางปัญญา',
    content: [
      'RabbitHub และโลโก้เป็นเครื่องหมายการค้าของบริษัท',
      'คุณเป็นเจ้าของเนื้อหาที่คุณสร้างขึ้นผ่านบริการ',
      'คุณให้สิทธิ์เราในการใช้เนื้อหาของคุณเพื่อให้บริการ',
      'เราไม่อ้างสิทธิ์ในเนื้อหาที่คุณสร้างด้วย AI',
    ]
  },
  {
    id: 'payment',
    number: '7',
    title: 'การชำระเงินและการสมัครสมาชิก',
    content: [
      'แผนแบบชำระเงินจะเรียกเก็บเงินล่วงหน้าเป็นรายเดือนหรือรายปี',
      'การสมัครสมาชิกจะต่ออายุอัตโนมัติเว้นแต่คุณยกเลิก',
      'การคืนเงินเป็นไปตามนโยบายคืนเงินของเรา',
      'เราสงวนสิทธิ์ในการเปลี่ยนแปลงราคาโดยแจ้งล่วงหน้า 30 วัน',
    ]
  },
  {
    id: 'termination',
    number: '8',
    title: 'การยุติการให้บริการ',
    content: [
      'คุณสามารถยกเลิกบัญชีได้ตลอดเวลาผ่านการตั้งค่า',
      'เราอาจระงับหรือยุติบริการหากคุณละเมิดข้อกำหนด',
      'เมื่อยุติบริการ สิทธิ์ในการใช้บริการของคุณจะสิ้นสุดลง',
      'ข้อมูลของคุณอาจถูกลบภายใน 30 วันหลังการยุติ',
    ]
  },
  {
    id: 'disclaimer',
    number: '9',
    title: 'ข้อจำกัดความรับผิด',
    content: [
      'บริการให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ',
      'เราไม่รับประกันว่าบริการจะไม่มีข้อผิดพลาดหรือไม่หยุดชะงัก',
      'เราไม่รับผิดต่อความเสียหายทางอ้อมหรือความเสียหายที่เป็นผลสืบเนื่อง',
      'ความรับผิดสูงสุดของเราจำกัดอยู่ที่จำนวนเงินที่คุณชำระในช่วง 12 เดือนที่ผ่านมา',
    ],
    important: true
  },
  {
    id: 'changes',
    number: '10',
    title: 'การเปลี่ยนแปลงข้อกำหนด',
    content: [
      'เราอาจปรับปรุงข้อกำหนดเหล่านี้เป็นครั้งคราว',
      'การเปลี่ยนแปลงที่สำคัญจะแจ้งให้ทราบล่วงหน้า 30 วัน',
      'การใช้บริการต่อไปหลังการเปลี่ยนแปลง ถือว่าคุณยอมรับข้อกำหนดใหม่',
    ]
  },
  {
    id: 'governing-law',
    number: '11',
    title: 'กฎหมายที่บังคับใช้',
    content: [
      'ข้อกำหนดนี้อยู่ภายใต้กฎหมายของราชอาณาจักรไทย',
      'ข้อพิพาทจะได้รับการระงับโดยศาลไทยที่มีเขตอำนาจ',
      'หากข้อกำหนดใดไม่สามารถบังคับใช้ได้ ข้อกำหนดอื่นยังคงมีผลบังคับ',
    ]
  },
];

// Scroll progress indicator
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-16 left-0 right-0 h-1 bg-primary-600 dark:bg-primary-500 origin-left z-50"
      style={{ scaleX }}
    />
  );
}

// Jump to navigation
function JumpNavigation({ sections, activeSection }: {
  sections: TermsSection[];
  activeSection: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-20 right-4 z-40">
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden"
      >
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg max-h-64 overflow-y-auto">
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`block text-sm py-1.5 px-2 rounded transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {section.number}. {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        className="shadow-lg"
      >
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Table of contents for desktop
function TableOfContents({ sections, activeSection }: {
  sections: TermsSection[];
  activeSection: string;
}) {
  return (
    <nav className="hidden lg:block sticky top-24">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
        สารบัญ
      </h3>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="text-xs text-neutral-400">{section.number}</span>
              <span className="truncate">{section.title}</span>
              {section.important && (
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
              )}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2">
        <Button variant="outline" size="sm" className="w-full" leftIcon={<Printer className="h-4 w-4" />}>
          พิมพ์
        </Button>
        <Button variant="outline" size="sm" className="w-full" leftIcon={<Download className="h-4 w-4" />}>
          ดาวน์โหลด PDF
        </Button>
      </div>
    </nav>
  );
}

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance');
  const mainRef = useRef<HTMLDivElement>(null);

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = termsSections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }));

      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ScrollProgress />

      <main className="flex-1 pt-16" ref={mainRef}>
        <PageHero
          badge={{ icon: <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />, text: 'Legal' }}
          title="ข้อกำหนดการใช้งาน"
          subtitle="กรุณาอ่านข้อกำหนดเหล่านี้อย่างละเอียดก่อนใช้บริการ RabbitHub"
        />

        {/* Last Updated */}
        <section className="py-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Clock className="h-4 w-4" />
                มีผลบังคับใช้: 1 กุมภาพันธ์ 2026
              </div>
              <Badge variant="info">
                <FileText className="h-3 w-3 mr-1" />
                Version 2.0
              </Badge>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 sm:py-20 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Table of Contents - Desktop */}
              <div className="lg:col-span-1">
                <TableOfContents sections={termsSections} activeSection={activeSection} />
              </div>

              {/* Terms Content */}
              <div className="lg:col-span-3 space-y-8">
                {termsSections.map((section, index) => (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border ${
                      section.important
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold text-sm shrink-0">
                        {section.number}
                      </span>
                      <div className="flex-1">
                        <h2 className="text-lg font-display font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                          {section.title}
                          {section.important && (
                            <Badge variant="warning" size="sm">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              สำคัญ
                            </Badge>
                          )}
                        </h2>
                      </div>
                    </div>

                    <ul className="space-y-3 pl-12">
                      {section.content.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.section>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 sm:py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn>
              <Scale className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                มีคำถามเกี่ยวกับข้อกำหนด?
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                หากคุณมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อทีมกฎหมายของเรา
              </p>
              <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">ฝ่ายกฎหมาย</p>
                <a
                  href="mailto:legal@rabbithub.co"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  legal@rabbithub.co
                </a>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* Mobile Jump Navigation */}
      <JumpNavigation sections={termsSections} activeSection={activeSection} />

      <Footer />
    </div>
  );
}
