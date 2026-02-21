import { createAdminClient } from '@/lib/supabase/admin'

// ========== Content Types ==========

export interface AboutContent {
  hero: {
    overline: string
    titleLine1: string
    titleLine2: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
  }
  stats: Array<{
    value: number
    suffix: string
    label: string
    description: string
  }>
  mission: {
    sectionLabel: string
    title: string
    titleHighlight: string
    paragraphs: string[]
    usersCount: string
    usersLabel: string
  }
  values: {
    sectionLabel: string
    title: string
    items: Array<{
      iconName: string // Lucide icon name: Users, Shield, Zap, Globe
      title: string
      description: string
    }>
  }
  timeline: {
    sectionLabel: string
    title: string
    items: Array<{
      year: string
      event: string
      detail: string
    }>
  }
  team: {
    sectionLabel: string
    title: string
    members: Array<{
      name: string
      role: string
      bio: string
      quote: string
      gradient: string
    }>
  }
  cta: {
    title: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
  }
}

export interface FeaturesContent {
  hero: {
    badge: string
    titleLine1: string
    titleLine2: string
    subtitle: string
    subtitleSecondary: string
  }
  stats: Array<{
    value: string
    label: string
  }>
  categories: Array<{
    id: string
    title: string
    subtitle: string
    description: string
    color: string // e.g. 'from-violet-500 to-purple-600'
    features: Array<{
      name: string
      desc: string
    }>
  }>
  comparison: Array<{
    feature: string
    rabbithub: boolean
    chatgpt: boolean
    claude: boolean
  }>
  cta: {
    title: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
  }
}

export interface PricingContent {
  hero: {
    title: string
    subtitle: string
  }
  faqs: Array<{
    question: string
    answer: string
  }>
  cta: {
    title: string
    subtitle: string
  }
}

export interface FooterContent {
  links: {
    product: Array<{ label: string; href: string }>
    company: Array<{ label: string; href: string }>
    legal: Array<{ label: string; href: string }>
  }
  social: Array<{
    platform: string // 'twitter' | 'github' | 'facebook'
    url: string
  }>
  sectionTitles: {
    product: string
    company: string
    legal: string
  }
}

export type PageName = 'about' | 'features' | 'pricing' | 'footer'
export type PageContent = AboutContent | FeaturesContent | PricingContent | FooterContent

// ========== Default Content ==========

export const DEFAULT_ABOUT: AboutContent = {
  hero: {
    overline: 'Established 2025',
    titleLine1: 'We Make',
    titleLine2: 'AI Simple',
    subtitle: 'เรากำลังสร้างอนาคตที่ทุกคนสามารถใช้พลังของ AI ได้อย่างง่ายดาย\nไม่ว่าคุณจะเป็นใคร อยู่ที่ไหน',
    ctaPrimary: 'เริ่มใช้งานฟรี',
    ctaSecondary: 'ร่วมงานกับเรา',
  },
  stats: [
    { value: 10, suffix: '+', label: 'AI Models', description: 'โมเดล AI ชั้นนำ' },
    { value: 99.9, suffix: '%', label: 'Uptime', description: 'ความเสถียร' },
    { value: 3, suffix: '+', label: 'Providers', description: 'ผู้ให้บริการ AI' },
    { value: 24, suffix: '/7', label: 'Available', description: 'พร้อมใช้งานตลอดเวลา' },
  ],
  mission: {
    sectionLabel: 'Our Mission',
    title: 'ทำให้ AI เป็นเรื่อง',
    titleHighlight: 'ของทุกคน',
    paragraphs: [
      'เราเชื่อว่า AI ไม่ควรเป็นเทคโนโลยีที่สงวนไว้สำหรับบริษัทใหญ่หรือผู้เชี่ยวชาญเท่านั้น',
      'RabbitHub ถูกสร้างขึ้นเพื่อให้ทุกคน—นักเรียน ฟรีแลนซ์ เจ้าของธุรกิจ หรือใครก็ตาม—สามารถใช้พลังของ AI ในราคาที่เข้าถึงได้',
    ],
    usersCount: 'เติบโตต่อเนื่อง',
    usersLabel: 'ผู้ใช้งานในไทย',
  },
  values: {
    sectionLabel: 'Our Values',
    title: 'สิ่งที่เราเชื่อมั่น',
    items: [
      { iconName: 'Users', title: 'User Obsessed', description: 'ทุกการตัดสินใจเริ่มจากผู้ใช้ เราฟัง เรียนรู้ และพัฒนาอยู่เสมอ' },
      { iconName: 'Shield', title: 'Privacy First', description: 'ข้อมูลของคุณเป็นของคุณ เราไม่ขาย ไม่แชร์ ไม่ใช้ฝึก AI' },
      { iconName: 'Zap', title: 'Speed Matters', description: 'ทุกมิลลิวินาทีมีค่า เราเร็วกว่าคู่แข่งถึง 2 เท่า' },
      { iconName: 'Globe', title: 'Global Access', description: 'AI สำหรับทุกคน ทุกภาษา ทุกอุปกรณ์ ทุกที่ทุกเวลา' },
    ],
  },
  timeline: {
    sectionLabel: 'Our Journey',
    title: 'เส้นทางของเรา',
    items: [
      { year: '2025', event: 'Founded', detail: 'เริ่มต้นพัฒนาแพลตฟอร์ม AI สำหรับคนไทย' },
      { year: '2026', event: 'Launch', detail: 'เปิดให้บริการ RabbitHub AI เวอร์ชันแรก' },
    ],
  },
  team: {
    sectionLabel: 'The Team',
    title: 'คนเบื้องหลัง',
    members: [
      { name: 'ทีมพัฒนา', role: 'Engineering', bio: 'สร้างแพลตฟอร์มที่เสถียรและรวดเร็ว', quote: 'เราสร้างเทคโนโลยีที่เพิ่มศักยภาพให้มนุษย์', gradient: 'from-rose-500 via-pink-500 to-purple-500' },
      { name: 'ทีมออกแบบ', role: 'Design', bio: 'สร้าง UI/UX ที่ใช้งานง่าย', quote: 'การออกแบบที่ดีคือสิ่งที่มองไม่เห็น มันแค่ใช้ได้', gradient: 'from-blue-500 via-cyan-500 to-teal-500' },
      { name: 'ทีม AI', role: 'AI & ML', bio: 'เชื่อมต่อกับโมเดล AI ชั้นนำ', quote: 'AI ควรเข้าถึงได้สำหรับทุกคน ไม่ใช่แค่บริษัทใหญ่', gradient: 'from-amber-500 via-orange-500 to-red-500' },
      { name: 'ทีมสนับสนุน', role: 'Support', bio: 'พร้อมช่วยเหลือผู้ใช้ทุกเวลา', quote: 'ความพึงพอใจของผู้ใช้คือสิ่งที่สำคัญที่สุด', gradient: 'from-emerald-500 via-green-500 to-lime-500' },
    ],
  },
  cta: {
    title: 'พร้อมที่จะเริ่มต้น?',
    subtitle: 'ลองใช้ RabbitHub ฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต',
    ctaPrimary: 'เริ่มใช้งานฟรี',
    ctaSecondary: 'ดูราคา',
  },
}

export const DEFAULT_FEATURES: FeaturesContent = {
  hero: {
    badge: 'ฟีเจอร์ทั้งหมด',
    titleLine1: 'AI หลายโมเดล',
    titleLine2: 'ในที่เดียว',
    subtitle: 'แชท สร้างรูป สร้างวิดีโอ ค้นหาเว็บ พูดด้วยเสียง',
    subtitleSecondary: 'ทุกอย่างในแพลตฟอร์มเดียว ใช้ภาษาไทยได้เต็มที่',
  },
  stats: [
    { value: '20+', label: 'โมเดล AI' },
    { value: 'รูป+วิดีโอ', label: 'สร้างสื่อ AI' },
    { value: '100%', label: 'ภาษาไทย' },
    { value: 'ฟรี', label: 'เริ่มต้นใช้งาน' },
  ],
  categories: [
    {
      id: 'ai-models',
      title: 'โมเดล AI 20+ ตัว',
      subtitle: 'เลือกใช้ได้ตามใจ',
      description: 'เข้าถึงโมเดลชั้นนำจากทั่วโลกผ่าน OpenRouter และ BytePlus ในแพลตฟอร์มเดียว',
      color: 'from-violet-500 to-purple-600',
      features: [
        { name: 'Claude (Anthropic)', desc: 'Claude Sonnet 4, Haiku — โมเดลที่เก่งเรื่องวิเคราะห์และเขียน' },
        { name: 'GPT (OpenAI)', desc: 'GPT-4o, GPT-4o Mini — โมเดลยอดนิยมจาก OpenAI' },
        { name: 'Gemini (Google)', desc: 'Gemini 2.0 Flash, Pro — เร็วและฉลาดจาก Google' },
        { name: 'DeepSeek, Llama, Mistral', desc: 'โมเดล open-source ชั้นนำ ใช้ได้ฟรี' },
      ],
    },
    {
      id: 'chat',
      title: 'แชทและสร้างสื่อ',
      subtitle: 'ครบในที่เดียว',
      description: 'แชทกับ AI แบบ streaming สร้างรูปภาพและวิดีโอจากข้อความ',
      color: 'from-primary-500 to-rose-500',
      features: [
        { name: 'แชท Streaming', desc: 'ตอบแบบ real-time เห็นข้อความทีละตัวอักษร' },
        { name: 'สร้างรูปภาพ (Seedream)', desc: 'พิมพ์ /image ตามด้วยคำอธิบาย ได้รูปทันที' },
        { name: 'สร้างวิดีโอ (Seedance)', desc: 'พิมพ์ /video สร้างวิดีโอจากข้อความ' },
        { name: 'ค้นหาเว็บ', desc: 'AI ค้นหาข้อมูลจากอินเทอร์เน็ตให้อัตโนมัติ' },
      ],
    },
    {
      id: 'security',
      title: 'ฟีเจอร์เสริม',
      subtitle: 'ใช้งานง่าย',
      description: 'ฟีเจอร์ที่ช่วยให้ใช้ AI ได้สะดวกยิ่งขึ้น',
      color: 'from-emerald-400 to-teal-500',
      features: [
        { name: 'แนบรูปภาพ (Vision)', desc: 'ส่งรูปให้ AI วิเคราะห์ได้ในโมเดลที่รองรับ' },
        { name: 'พูดด้วยเสียง', desc: 'กดปุ่มไมค์แล้วพูด แปลงเป็นข้อความอัตโนมัติ' },
        { name: 'แก้ไขข้อความ', desc: 'แก้ไขข้อความที่ส่งไปแล้วและสั่ง AI ตอบใหม่ได้' },
        { name: 'Markdown & Code', desc: 'AI ตอบพร้อมจัดรูปแบบสวย รองรับ code block' },
      ],
    },
    {
      id: 'integration',
      title: 'ภาษาไทย & UX',
      subtitle: 'ออกแบบมาเพื่อคนไทย',
      description: 'UI ภาษาไทยทั้งหมด ใช้งานง่ายทั้งบนมือถือและคอมพิวเตอร์',
      color: 'from-amber-400 to-orange-500',
      features: [
        { name: 'UI ภาษาไทย 100%', desc: 'ทุกหน้า ทุกปุ่ม ทุกข้อความเป็นภาษาไทย' },
        { name: 'จ่ายเป็นเงินบาท', desc: 'ราคาเป็นบาท จ่ายผ่าน PromptPay ได้' },
        { name: 'Dark Mode', desc: 'โหมดมืดที่สบายตา เปลี่ยนได้ตลอด' },
        { name: 'รองรับมือถือ', desc: 'ใช้งานได้ลื่นทั้งบน iPhone, Android และ Desktop' },
      ],
    },
  ],
  comparison: [
    { feature: 'ใช้โมเดลจากหลายค่ายในที่เดียว (Claude, GPT, Gemini, DeepSeek)', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'สร้างรูปภาพจากข้อความ', rabbithub: true, chatgpt: true, claude: false },
    { feature: 'สร้างวิดีโอจากข้อความ', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'ค้นหาเว็บอัตโนมัติ', rabbithub: true, chatgpt: true, claude: true },
    { feature: 'UI ภาษาไทยเต็มรูปแบบ', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'จ่ายเป็นเงินบาท', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'พูดด้วยเสียง (Voice Input)', rabbithub: true, chatgpt: true, claude: false },
    { feature: 'เริ่มต้นใช้ฟรี', rabbithub: true, chatgpt: true, claude: true },
  ],
  cta: {
    title: 'ลองใช้งานฟรีเลย',
    subtitle: 'สมัครง่าย ใช้ได้ทันที ไม่ต้องใช้บัตรเครดิต',
    ctaPrimary: 'เริ่มแชทฟรี',
    ctaSecondary: 'ดูราคาแพ็กเกจ',
  },
}

export const DEFAULT_PRICING: PricingContent = {
  hero: {
    title: 'เลือกแผนที่เหมาะกับคุณ',
    subtitle: 'เริ่มต้นฟรี อัปเกรดเมื่อพร้อม',
  },
  faqs: [
    { question: 'ทดลองใช้ฟรีได้ไหม?', answer: 'ได้ครับ! แผน Free ใช้งานได้ฟรีตลอดไป รวมถึงแชท AI 30 ข้อความ/วัน' },
    { question: 'รองรับการชำระเงินแบบไหน?', answer: 'รองรับ PromptPay QR Code และโอนผ่านธนาคาร สะดวกและรวดเร็ว' },
    { question: 'ยกเลิกได้ตลอดเวลาไหม?', answer: 'ได้ครับ ยกเลิกได้ทุกเมื่อ ไม่มีค่าปรับ ใช้ได้จนหมดรอบบิล' },
    { question: 'ข้อมูลของฉันปลอดภัยไหม?', answer: 'ข้อมูลทั้งหมดเข้ารหัส เราไม่เก็บข้อมูลสนทนาเพื่อฝึก AI' },
    { question: 'มี API สำหรับนักพัฒนาไหม?', answer: 'แผน Premium มี API Access เต็มรูปแบบ รองรับ REST API' },
    { question: 'สามารถเปลี่ยนแผนได้ไหม?', answer: 'ได้ครับ อัปเกรดหรือดาวน์เกรดได้ตลอดเวลา คิดค่าบริการตามสัดส่วน' },
  ],
  cta: {
    title: 'พร้อมเริ่มต้นหรือยัง?',
    subtitle: 'เริ่มต้นฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต',
  },
}

export const DEFAULT_FOOTER: FooterContent = {
  links: {
    product: [
      { label: 'ฟีเจอร์', href: '/features' },
      { label: 'ราคา', href: '/pricing' },
    ],
    company: [
      { label: 'เกี่ยวกับเรา', href: '/about' },
      { label: 'ติดต่อ', href: '/contact' },
    ],
    legal: [
      { label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
      { label: 'ข้อกำหนดการใช้งาน', href: '/terms' },
    ],
  },
  social: [],
  sectionTitles: {
    product: 'ผลิตภัณฑ์',
    company: 'บริษัท',
    legal: 'กฎหมาย',
  },
}

const DEFAULTS: Record<PageName, PageContent> = {
  about: DEFAULT_ABOUT,
  features: DEFAULT_FEATURES,
  pricing: DEFAULT_PRICING,
  footer: DEFAULT_FOOTER,
}

// ========== Server-side Functions ==========

/**
 * Get page content from system_config table.
 * Falls back to default hardcoded content if not found in DB.
 * Use this in Server Components or API routes only.
 */
export async function getPageContent<T extends PageContent>(page: PageName): Promise<T> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', `content_${page}`)
      .single()

    if (data?.value) {
      // Merge with defaults to handle any new fields added after content was saved
      const saved = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
      return { ...DEFAULTS[page], ...saved } as T
    }
  } catch {
    // DB not available or key not found, use defaults
  }

  return DEFAULTS[page] as T
}

/**
 * Save page content to system_config table.
 * Use this in API routes only.
 */
export async function setPageContent(page: PageName, content: PageContent, userId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('system_config')
    .upsert({
      key: `content_${page}`,
      value: content,
      category: 'page_content',
      description: `Content for ${page} page`,
      is_public: true,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}
