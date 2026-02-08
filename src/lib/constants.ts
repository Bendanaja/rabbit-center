export const AI_MODELS = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    icon: '/images/models/openai.svg',
    description: 'โมเดลที่ทรงพลังที่สุดสำหรับงานซับซ้อน',
    tier: 'pro'
  },
  {
    id: 'gpt-3.5',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    icon: '/images/models/openai.svg',
    description: 'เร็วและมีประสิทธิภาพสำหรับงานทั่วไป',
    tier: 'free'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    icon: '/images/models/claude.svg',
    description: 'เหมาะสำหรับคำตอบที่ละเอียดและรอบคอบ',
    tier: 'pro'
  },
  {
    id: 'claude-2',
    name: 'Claude 2',
    provider: 'Anthropic',
    icon: '/images/models/claude.svg',
    description: 'ผู้ช่วย AI ที่เชื่อถือได้',
    tier: 'pro'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    icon: '/images/models/gemini.svg',
    description: 'โมเดลขั้นสูงจาก Google',
    tier: 'pro'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    icon: '/images/models/mistral.svg',
    description: 'AI จากยุโรปที่มีความสามารถในการใช้เหตุผล',
    tier: 'pro'
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'Meta',
    icon: '/images/models/llama.svg',
    description: 'โมเดล Open-source ที่ทรงพลัง',
    tier: 'pro'
  },
] as const;

export type AIModel = typeof AI_MODELS[number];
export type ModelId = AIModel['id'];

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'ฟรี',
    price: 0,
    currency: '฿',
    period: 'เดือน',
    description: 'เหมาะสำหรับทดลองใช้งาน',
    features: [
      '50 ข้อความต่อวัน',
      'ใช้ได้เฉพาะ GPT-3.5 Turbo',
      'ประวัติแชท 7 วัน',
      'ความเร็วปกติ',
    ],
    limitations: [
      'จำกัดการเข้าถึงโมเดล',
      'ไม่มีการสนับสนุนพิเศษ',
    ],
    cta: 'เริ่มต้นใช้งาน',
    popular: false,
  },
  {
    id: 'pro',
    name: 'โปร',
    price: 299,
    currency: '฿',
    period: 'เดือน',
    description: 'สำหรับผู้ใช้งานจริงจัง',
    features: [
      'ข้อความไม่จำกัด',
      'ใช้ได้ทุกโมเดล AI',
      'ประวัติแชทไม่จำกัด',
      'ความเร็วสูงสุด',
      'ส่งออกบทสนทนา',
      'คำสั่งกำหนดเอง',
    ],
    limitations: [],
    cta: 'อัปเกรดเป็น Pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'องค์กร',
    price: 1499,
    currency: '฿',
    period: 'เดือน',
    description: 'สำหรับทีมและธุรกิจ',
    features: [
      'ทุกอย่างใน Pro',
      'เข้าถึง API',
      'สมาชิกทีม (สูงสุด 10 คน)',
      'แดชบอร์ดผู้ดูแล',
      'เชื่อมต่อ SSO',
      'การสนับสนุนเฉพาะ',
      'ปรับแต่งโมเดลได้',
      'SLA รับประกัน',
    ],
    limitations: [],
    cta: 'ติดต่อฝ่ายขาย',
    popular: false,
  },
] as const;

export type PricingPlan = typeof PRICING_PLANS[number];

export const MOCK_RESPONSES = [
  "คำถามดีมากครับ! ให้ผมคิดดูสักครู่...",
  "ผมเข้าใจสิ่งที่คุณต้องการ นี่คือความเห็นของผม:",
  "น่าสนใจมากครับ! นี่คือสิ่งที่ผมอยากจะแบ่งปัน:",
  "ขอบคุณที่ถามครับ! จากความรู้ของผม:",
  "ให้ผมอธิบายให้ฟังนะครับ:",
];

export const NAV_LINKS = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/chat', label: 'แชท' },
  { href: '/pricing', label: 'ราคา' },
] as const;

export const SITE_CONFIG = {
  name: 'RabbitHub',
  tagline: 'แชทกับ AI ที่ดีที่สุดในโลก',
  description: 'เข้าถึง GPT-5, Claude, Gemini และอื่นๆ ในที่เดียว ราคาเรียบง่าย ฟีเจอร์ครบครัน',
} as const;
