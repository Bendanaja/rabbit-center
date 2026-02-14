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
    badge: 'ฟีเจอร์ครบครัน',
    titleLine1: 'ฟีเจอร์ที่จะ',
    titleLine2: 'เปลี่ยนวิธีการใช้ AI',
    subtitle: 'รวมทุกเครื่องมือ AI ที่คุณต้องการในที่เดียว',
    subtitleSecondary: 'พร้อมความปลอดภัยระดับองค์กร',
  },
  stats: [
    { value: '10+', label: 'AI Models' },
    { value: '3x', label: 'เร็วกว่า' },
    { value: '99.99%', label: 'Uptime' },
    { value: '1M+', label: 'Context' },
  ],
  categories: [
    {
      id: 'ai-models',
      title: 'BytePlus AI Models',
      subtitle: 'Next-Gen AI',
      description: 'เข้าถึงโมเดล AI จาก BytePlus พร้อม Text, Image และ Video Generation',
      color: 'from-violet-500 to-purple-600',
      features: [
        { name: 'DeepSeek Chat & Thinking', desc: 'โมเดลภาษาขั้นสูงจาก DeepSeek สำหรับแชทและวิเคราะห์' },
        { name: 'Doubao Pro & Lite', desc: 'โมเดลจาก ByteDance รองรับภาษาไทยและหลายภาษา' },
        { name: 'Seedream 3.0', desc: 'สร้างภาพจากข้อความ AI Image Generation คุณภาพสูง' },
        { name: 'Seedance 1.0', desc: 'สร้างวิดีโอจากข้อความ AI Video Generation' },
      ],
    },
    {
      id: 'chat',
      title: 'Chat Experience',
      subtitle: 'AI-Native Interface',
      description: 'ประสบการณ์การสนทนากับ AI ที่ล้ำสมัยที่สุดในปี 2026',
      color: 'from-blue-500 to-cyan-500',
      features: [
        { name: 'Ultra-fast Streaming', desc: 'ตอบสนองภายใน 100ms แบบ real-time' },
        { name: '1M+ Token Context', desc: 'จำบริบทได้ยาวกว่า 1 ล้าน tokens' },
        { name: 'Advanced Code Editor', desc: 'เขียนโค้ดพร้อม AI autocomplete' },
        { name: 'Vision & Voice', desc: 'รองรับรูปภาพ, PDF, เสียง และวิดีโอ' },
      ],
    },
    {
      id: 'security',
      title: 'Security 2026',
      subtitle: 'Zero-Trust Architecture',
      description: 'ความปลอดภัยระดับ Enterprise พร้อมมาตรฐานใหม่ล่าสุด',
      color: 'from-emerald-500 to-green-600',
      features: [
        { name: 'Post-Quantum Encryption', desc: 'เข้ารหัสรองรับ Quantum Computing' },
        { name: 'SOC 2 Type II + ISO 27001', desc: 'มาตรฐานความปลอดภัยสูงสุด' },
        { name: 'Zero Data Retention', desc: 'ไม่เก็บข้อมูลเลย ลบทันทีหลังใช้' },
        { name: 'SSO + SAML + OIDC', desc: 'เชื่อมต่อ Identity Provider ทุกแบบ' },
      ],
    },
    {
      id: 'integration',
      title: 'Integration',
      subtitle: 'AI-First Platform',
      description: 'เชื่อมต่อกับทุก Workflow ที่คุณใช้ในปี 2026',
      color: 'from-orange-500 to-amber-500',
      features: [
        { name: 'MCP Protocol', desc: 'รองรับ Model Context Protocol มาตรฐานใหม่' },
        { name: 'AI Agents API', desc: 'สร้าง AI Agents ที่ทำงานอัตโนมัติ' },
        { name: 'SDK (Python/TS/Rust)', desc: 'SDK ที่ทันสมัยรองรับ async/streaming' },
        { name: '5000+ Integrations', desc: 'เชื่อมต่อ Notion, Slack, GitHub และอื่นๆ' },
      ],
    },
  ],
  comparison: [
    { feature: 'DeepSeek, Doubao, Seedream, Seedance ในที่เดียว', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'สร้างรูปภาพ + วิดีโอด้วย AI', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'ราคาถูกกว่า 50% (จ่ายเป็นบาท)', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'UI ภาษาไทยเต็มรูปแบบ', rabbithub: true, chatgpt: false, claude: false },
    { feature: 'API สำหรับนักพัฒนา', rabbithub: true, chatgpt: true, claude: true },
    { feature: 'ไม่เก็บข้อมูลฝึก AI', rabbithub: true, chatgpt: false, claude: true },
    { feature: 'รองรับหลายภาษา', rabbithub: true, chatgpt: true, claude: true },
    { feature: 'Team Collaboration', rabbithub: true, chatgpt: true, claude: true },
  ],
  cta: {
    title: 'พร้อมลองใช้งานแล้วหรือยัง?',
    subtitle: 'เริ่มต้นใช้งานฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต',
    ctaPrimary: 'เริ่มใช้งานฟรี',
    ctaSecondary: 'ติดต่อทีมขาย',
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
