export const AI_MODELS = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    icon: '/images/models/deepseek.svg',
    description: 'โมเดลเหตุผลขั้นสูง คิดวิเคราะห์เชิงลึก',
    tier: 'free'
  },
  {
    id: 'deepseek-v3-2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    icon: '/images/models/deepseek.svg',
    description: 'โมเดลรุ่นใหม่ล่าสุด เร็วและแม่นยำ',
    tier: 'free'
  },
  {
    id: 'deepseek-v3-1',
    name: 'DeepSeek V3.1',
    provider: 'DeepSeek',
    icon: '/images/models/deepseek.svg',
    description: 'โมเดลอเนกประสงค์ประสิทธิภาพสูง',
    tier: 'free'
  },
  {
    id: 'seed-1-8',
    name: 'Seed 1.8',
    provider: 'ByteDance',
    icon: '/images/models/byteplus.svg',
    description: 'โมเดลล่าสุดจาก ByteDance ทรงพลังรอบด้าน',
    tier: 'free'
  },
  {
    id: 'seed-1-6',
    name: 'Seed 1.6',
    provider: 'ByteDance',
    icon: '/images/models/byteplus.svg',
    description: 'โมเดลสมดุลระหว่างความเร็วและคุณภาพ',
    tier: 'free'
  },
  {
    id: 'seed-1-6-flash',
    name: 'Seed 1.6 Flash',
    provider: 'ByteDance',
    icon: '/images/models/byteplus.svg',
    description: 'เวอร์ชันเร็วพิเศษ เหมาะกับงานทั่วไป',
    tier: 'free'
  },
  {
    id: 'kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'Moonshot',
    icon: '/images/models/kimi.svg',
    description: 'โมเดลเหตุผลจาก Moonshot คิดก่อนตอบ',
    tier: 'free'
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    provider: 'Moonshot',
    icon: '/images/models/kimi.svg',
    description: 'โมเดลสนทนาอัจฉริยะจาก Moonshot',
    tier: 'free'
  },
  {
    id: 'glm-4',
    name: 'GLM-4.7',
    provider: 'Zhipu AI',
    icon: '/images/models/zhipu.svg',
    description: 'โมเดลภาษาขั้นสูงจาก Zhipu AI',
    tier: 'free'
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'BytePlus',
    icon: '/images/models/gpt-oss.svg',
    description: 'โมเดล 120B พารามิเตอร์ ประสิทธิภาพเยี่ยม',
    tier: 'free'
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
      '30 ข้อความต่อวัน',
      'ใช้ได้เฉพาะ Seed 1.6 Flash',
      'ค้นหาเว็บไม่จำกัด',
      'ประวัติแชท 7 วัน',
      'ความเร็วปกติ',
    ],
    limitations: [
      'จำกัดการเข้าถึงโมเดล',
      'ไม่สามารถสร้างรูปภาพได้',
      'ไม่สามารถสร้างวิดีโอได้',
      'ไม่มีการสนับสนุนพิเศษ',
    ],
    cta: 'เริ่มต้นใช้งาน',
    popular: false,
  },
  {
    id: 'starter',
    name: 'เริ่มต้น',
    price: 199,
    currency: '฿',
    period: 'เดือน',
    description: 'เหมาะสำหรับผู้เริ่มใช้งาน',
    features: [
      '100 ข้อความต่อวัน',
      'ใช้ได้ 3 โมเดล (Seed 1.6 Flash, DeepSeek V3.2, GLM-4.7)',
      'สร้างรูปได้ 3 รูป/วัน',
      'สร้างวิดีโอได้ 1 ชิ้น/วัน',
      'ค้นหาเว็บไม่จำกัด',
      'ประวัติแชท 30 วัน',
      'ความเร็วปกติ',
    ],
    limitations: [
      'จำกัดจำนวนโมเดล',
      'วิดีโอเฉพาะ Seedance Lite/Fast',
    ],
    cta: 'เริ่มต้นใช้งาน',
    popular: false,
  },
  {
    id: 'pro',
    name: 'โปร',
    price: 499,
    currency: '฿',
    period: 'เดือน',
    description: 'สำหรับผู้ใช้งานจริงจัง',
    features: [
      '200 ข้อความต่อวัน',
      'ใช้ได้ทุกโมเดล AI',
      'สร้างรูปได้ 8 รูป/วัน',
      'สร้างวิดีโอได้ 2 ชิ้น/วัน',
      'ค้นหาเว็บไม่จำกัด',
      'ประวัติแชทไม่จำกัด',
      'ความเร็วสูง',
    ],
    limitations: [],
    cta: 'อัปเกรดเป็น Pro',
    popular: true,
  },
  {
    id: 'premium',
    name: 'พรีเมียม',
    price: 799,
    currency: '฿',
    period: 'เดือน',
    description: 'สำหรับผู้ใช้ระดับมืออาชีพ',
    features: [
      '400 ข้อความต่อวัน',
      'ใช้ได้ทุกโมเดล AI',
      'สร้างรูปได้ 10 รูป/วัน',
      'สร้างวิดีโอได้ 3 ชิ้น/วัน',
      'ค้นหาเว็บไม่จำกัด',
      'ความเร็วสูงสุด',
      'การสนับสนุนพิเศษ',
      'เข้าถึง API',
    ],
    limitations: [],
    cta: 'อัปเกรดเป็น Premium',
    popular: false,
  },
] as const;

export type PricingPlan = typeof PRICING_PLANS[number];

export const NAV_LINKS = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/chat', label: 'แชท' },
  { href: '/pricing', label: 'ราคา' },
] as const;

export const SITE_CONFIG = {
  name: 'RabbitHub AI',
  tagline: 'แพลตฟอร์ม AI อัจฉริยะ',
  description: 'แพลตฟอร์ม AI ครบวงจร แชทอัจฉริยะ สร้างรูปภาพ สร้างวิดีโอ ด้วย AI ชั้นนำ DeepSeek, Kimi, Seed, GLM และอื่นๆ ในที่เดียว',
  url: 'https://rabbithub.ai',
} as const;
