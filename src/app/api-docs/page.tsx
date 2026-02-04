'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Code,
  Copy,
  Check,
  Play,
  ChevronRight,
  Terminal,
  Key,
  MessageSquare,
  Zap,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { FadeIn } from '@/components/animations';
import { PageHero } from '@/components/shared';

const endpoints = [
  {
    method: 'POST',
    path: '/v1/chat/completions',
    description: 'สร้างการตอบกลับจาก AI',
    color: 'bg-green-500'
  },
  {
    method: 'GET',
    path: '/v1/models',
    description: 'ดึงรายการโมเดลที่พร้อมใช้งาน',
    color: 'bg-blue-500'
  },
  {
    method: 'POST',
    path: '/v1/embeddings',
    description: 'สร้าง embeddings จากข้อความ',
    color: 'bg-green-500'
  },
  {
    method: 'GET',
    path: '/v1/usage',
    description: 'ดูสถิติการใช้งาน API',
    color: 'bg-blue-500'
  },
  {
    method: 'DELETE',
    path: '/v1/conversations/:id',
    description: 'ลบบทสนทนา',
    color: 'bg-red-500'
  },
];

const codeExamples = {
  curl: `curl https://api.rabbitai.co/v1/chat/completions \\
  -H "Authorization: Bearer $RABBIT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "สวัสดี"}
    ]
  }'`,
  python: `import rabbitai

client = rabbitai.Client(api_key="your-api-key")

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "สวัสดี"}
    ]
)

print(response.choices[0].message.content)`,
  javascript: `import RabbitAI from 'rabbitai';

const client = new RabbitAI({
  apiKey: 'your-api-key'
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'สวัสดี' }
  ]
});

console.log(response.choices[0].message.content);`,
};

const responseExample = `{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "สวัสดีครับ! ยินดีต้อนรับสู่ RabbitAI 🐰"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 15,
    "total_tokens": 20
  }
}`;

// Typing animation component
function TypeWriter({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}

// Code block with copy button
function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  animate = false
}: {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  animate?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(animate);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-neutral-400 ml-2">{language}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              คัดลอกแล้ว
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              คัดลอก
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono">
          {showLineNumbers ? (
            <table className="w-full">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td className="text-neutral-600 select-none pr-4 text-right w-8">
                      {i + 1}
                    </td>
                    <td className="text-neutral-100">
                      {shouldAnimate && i === 0 ? (
                        <TypeWriter text={line} speed={20} />
                      ) : (
                        <motion.span
                          initial={shouldAnimate ? { opacity: 0 } : false}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          {line}
                        </motion.span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <code className="text-neutral-100">{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}

export default function APIDocsPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'javascript'>('curl');
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <PageHero
          badge={{ icon: <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />, text: 'API Documentation' }}
          title="API สำหรับนักพัฒนา"
          subtitle="เข้าถึงพลังของ AI ผ่าน API ที่ใช้งานง่าย รองรับหลายภาษา"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" leftIcon={<Key className="h-4 w-4" />} asChild>
              <Link href="/settings">รับ API Key</Link>
            </Button>
            <Button variant="outline" size="lg" leftIcon={<BookOpen className="h-4 w-4" />}>
              อ่านเอกสารเต็ม
            </Button>
          </div>
        </PageHero>

        {/* Quick Start */}
        <section className="py-12 sm:py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <Badge variant="primary" className="mb-4">
                <Terminal className="h-3 w-3 mr-1" />
                Quick Start
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                เริ่มต้นใน 30 วินาที
              </h2>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { step: 1, title: 'รับ API Key', desc: 'สร้างบัญชีและรับ API Key ฟรี', icon: Key },
                { step: 2, title: 'ติดตั้ง SDK', desc: 'npm install rabbitai หรือ pip install rabbitai', icon: Terminal },
                { step: 3, title: 'เรียก API', desc: 'เริ่มสร้างแอปพลิเคชันของคุณ', icon: Play },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3" />
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Code Example */}
            <FadeIn>
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {/* Language Tabs */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  {(['curl', 'python', 'javascript'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {tab === 'curl' ? 'cURL' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Code */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CodeBlock
                      code={codeExamples[activeTab]}
                      language={activeTab}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Run Button */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
                  <Button
                    onClick={() => setShowResponse(true)}
                    leftIcon={<Play className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    ทดสอบ API
                  </Button>
                </div>
              </div>
            </FadeIn>

            {/* Response Preview */}
            <AnimatePresence>
              {showResponse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="success">200 OK</Badge>
                    <span className="text-sm text-neutral-500">Response</span>
                  </div>
                  <CodeBlock code={responseExample} language="json" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Endpoints */}
        <section className="py-12 sm:py-20 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                API Endpoints
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Endpoints หลักที่คุณสามารถใช้งานได้
              </p>
            </FadeIn>

            <div className="space-y-3">
              {endpoints.map((endpoint, index) => (
                <motion.div
                  key={endpoint.path}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold text-white ${endpoint.color}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-neutral-900 dark:text-white">
                      {endpoint.path}
                    </code>
                    <span className="hidden sm:block ml-auto text-sm text-neutral-500">
                      {endpoint.description}
                    </span>
                    <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <p className="sm:hidden mt-2 text-sm text-neutral-500">{endpoint.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SDKs */}
        <section className="py-12 sm:py-20 bg-white dark:bg-neutral-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4">
                Official SDKs
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                ไลบรารีอย่างเป็นทางการสำหรับภาษาที่คุณใช้
              </p>
            </FadeIn>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Python', version: 'v1.2.0', install: 'pip install rabbitai' },
                { name: 'Node.js', version: 'v1.1.5', install: 'npm install rabbitai' },
                { name: 'Go', version: 'v0.9.2', install: 'go get rabbitai' },
                { name: 'Ruby', version: 'v0.8.0', install: 'gem install rabbitai' },
              ].map((sdk, index) => (
                <motion.div
                  key={sdk.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center"
                >
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{sdk.name}</h3>
                  <Badge variant="default" size="sm" className="mb-2">{sdk.version}</Badge>
                  <code className="text-xs text-neutral-500 block">{sdk.install}</code>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-neutral-900 to-neutral-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <MessageSquare className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
                ต้องการความช่วยเหลือ?
              </h2>
              <p className="text-neutral-400 mb-8">
                ทีมนักพัฒนาของเราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/contact">ติดต่อทีมสนับสนุน</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-neutral-600 text-white hover:bg-neutral-700"
                >
                  เข้าร่วม Discord
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
