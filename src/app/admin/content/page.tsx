'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Sparkles,
  CreditCard,
  LayoutGrid,
  ChevronDown,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Users,
  Shield,
  Zap,
  Heart,
  Star,
  Award,
  Target,
  TrendingUp,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  PenSquare,
  Columns2
} from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/api-client'
import AboutPageClient from '@/app/about/AboutPageClient'
import FeaturesPageClient from '@/app/features/FeaturesPageClient'
import { PricingPageClient } from '@/app/pricing/PricingPageClient'
import { FooterClient } from '@/components/layout/FooterClient'

// Permission constant
const PERMISSIONS = {
  EDIT_SITE_CONFIG: 'edit_site_config'
}

// Simple PermissionGate component
function PermissionGate({
  permission,
  children
}: {
  permission: string
  children: React.ReactNode
}) {
  // In a real app, check user permissions here
  // For now, just render children
  return <>{children}</>
}

// Icon options for values section
const ICON_OPTIONS = [
  { value: 'Users', label: 'ผู้ใช้', icon: Users },
  { value: 'Shield', label: 'ความปลอดภัย', icon: Shield },
  { value: 'Zap', label: 'ความเร็ว', icon: Zap },
  { value: 'Globe', label: 'โลก', icon: Globe },
  { value: 'Heart', label: 'หัวใจ', icon: Heart },
  { value: 'Star', label: 'ดาว', icon: Star },
  { value: 'Award', label: 'รางวัล', icon: Award },
  { value: 'Target', label: 'เป้าหมาย', icon: Target },
  { value: 'TrendingUp', label: 'เติบโต', icon: TrendingUp }
]

// Tabs configuration
const TABS = [
  { id: 'about', label: 'เกี่ยวกับเรา', icon: Globe },
  { id: 'features', label: 'ฟีเจอร์', icon: Sparkles },
  { id: 'pricing', label: 'ราคา', icon: CreditCard },
  { id: 'footer', label: 'ส่วนท้าย', icon: LayoutGrid }
] as const

type TabId = typeof TABS[number]['id']

// Device scale configurations for preview panel
const DEVICE_SCALES = {
  desktop: { scale: 0.5, width: '200%' },
  tablet: { scale: 0.65, width: '153.8%' },
  mobile: { scale: 0.35, width: '285.7%' },
}

// Live Preview Component
function ContentPreview({
  page,
  content,
  loading,
  previewDevice,
  setPreviewDevice
}: {
  page: TabId
  content: any
  loading: boolean
  previewDevice: 'desktop' | 'tablet' | 'mobile'
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void
}) {
  const device = DEVICE_SCALES[previewDevice]

  return (
    <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
      {/* Mock browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 px-3 py-1 bg-neutral-800 rounded-md text-xs text-neutral-400 text-center truncate">
          rabbithub.co/{page === 'footer' ? '' : page}
        </div>
        <div className="flex items-center gap-1">
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => {
            const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone
            return (
              <button
                key={d}
                onClick={() => setPreviewDevice(d)}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  previewDevice === d
                    ? "bg-primary-500/20 text-primary-400"
                    : "text-neutral-500 hover:text-neutral-300"
                )}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Scaled preview container */}
      <div
        className={cn(
          "relative overflow-auto bg-white",
          previewDevice === 'mobile' ? "mx-auto" : ""
        )}
        style={{
          height: '70vh',
          maxWidth: previewDevice === 'mobile' ? `${375 * device.scale + 40}px` : undefined,
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full bg-neutral-900">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-500">กำลังโหลด...</p>
            </div>
          </div>
        ) : !content || !(page === 'footer' ? content.sectionTitles : content.hero) ? (
          <div className="flex items-center justify-center h-full bg-neutral-900">
            <p className="text-sm text-neutral-500">ไม่พบข้อมูลเนื้อหา กรุณาบันทึกข้อมูลก่อน</p>
          </div>
        ) : (
          <div
            className="origin-top-left"
            style={{
              transform: `scale(${device.scale})`,
              width: previewDevice === 'mobile' ? '375px' : device.width,
            }}
          >
            {page === 'about' && <AboutPageClient content={content} />}
            {page === 'features' && <FeaturesPageClient content={content} />}
            {page === 'pricing' && <PricingPageClient content={content} />}
            {page === 'footer' && <FooterClient content={content} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const [content, setContent] = useState<Record<string, any>>({})
  const [originalContent, setOriginalContent] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('editor')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Fetch content for active tab
  useEffect(() => {
    const fetchContent = async () => {
      if (content[activeTab]) return // Already loaded

      setLoading(true)
      try {
        const res = await authFetch(`/api/admin/content?page=${activeTab}`)
        if (res.ok) {
          const data = await res.json()
          setContent(prev => ({ ...prev, [activeTab]: data.content }))
          setOriginalContent(prev => ({ ...prev, [activeTab]: data.content }))
        }
      } catch (error) {
        console.error('Failed to fetch content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [activeTab, content])

  // Check if content has changed
  const hasChanges = () => {
    return JSON.stringify(content[activeTab]) !== JSON.stringify(originalContent[activeTab])
  }

  // Save content
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: activeTab,
          content: content[activeTab]
        })
      })

      if (res.ok) {
        setOriginalContent(prev => ({ ...prev, [activeTab]: content[activeTab] }))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save content:', error)
    } finally {
      setSaving(false)
    }
  }

  // Reset content
  const handleReset = () => {
    setContent(prev => ({ ...prev, [activeTab]: originalContent[activeTab] }))
  }

  // Update content field
  const updateContent = (path: string[], value: any) => {
    setContent(prev => {
      const newContent = { ...prev }
      const tabContent = { ...newContent[activeTab] }

      let current: any = tabContent
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value

      newContent[activeTab] = tabContent
      return newContent
    })
  }

  const currentContent = content[activeTab] || {}

  return (
    <PermissionGate permission={PERMISSIONS.EDIT_SITE_CONFIG}>
      <div className="min-h-screen bg-neutral-950">
        <AdminHeader />

        <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-8", viewMode === 'split' ? "max-w-[100rem]" : "max-w-7xl")}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">จัดการเนื้อหา</h1>
            <p className="text-neutral-400">แก้ไขเนื้อหาหน้าเว็บไซต์</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* View Mode Toggle & Action Buttons */}
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-neutral-900/50 rounded-lg p-1 border border-neutral-800">
              <button
                onClick={() => setViewMode('editor')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'editor'
                    ? "bg-primary-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editor</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={cn(
                  "hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'split'
                    ? "bg-primary-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'preview'
                    ? "bg-primary-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Save/Reset Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!hasChanges() || saving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                  hasChanges() && !saving
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                )}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    บันทึก
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={!hasChanges()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                  hasChanges()
                    ? "bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-neutral-800"
                    : "bg-neutral-900/30 text-neutral-600 cursor-not-allowed border border-neutral-800/50"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                รีเซ็ต
              </button>

              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20"
                  >
                    <Check className="w-4 h-4" />
                    บันทึกสำเร็จ
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content Area */}
          {viewMode === 'split' ? (
            <div className="flex gap-6">
              {/* Editor Panel */}
              <div className="w-1/2 overflow-auto" style={{ maxHeight: '80vh' }}>
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {activeTab === 'about' && <AboutEditor content={currentContent} updateContent={updateContent} />}
                      {activeTab === 'features' && <FeaturesEditor content={currentContent} updateContent={updateContent} />}
                      {activeTab === 'pricing' && <PricingEditor content={currentContent} updateContent={updateContent} />}
                      {activeTab === 'footer' && <FooterEditor content={currentContent} updateContent={updateContent} />}
                    </>
                  )}
                </div>
              </div>
              {/* Preview Panel */}
              <div className="w-1/2">
                <div className="sticky top-24">
                  <ContentPreview page={activeTab} content={currentContent} loading={loading} previewDevice={previewDevice} setPreviewDevice={setPreviewDevice} />
                </div>
              </div>
            </div>
          ) : viewMode === 'preview' ? (
            <ContentPreview page={activeTab} content={currentContent} loading={loading} previewDevice={previewDevice} setPreviewDevice={setPreviewDevice} />
          ) : (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {activeTab === 'about' && <AboutEditor content={currentContent} updateContent={updateContent} />}
                  {activeTab === 'features' && <FeaturesEditor content={currentContent} updateContent={updateContent} />}
                  {activeTab === 'pricing' && <PricingEditor content={currentContent} updateContent={updateContent} />}
                  {activeTab === 'footer' && <FooterEditor content={currentContent} updateContent={updateContent} />}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  )
}

// About Page Editor
function AboutEditor({ content, updateContent }: EditorProps) {
  return (
    <div className="space-y-6">
      <Section title="Hero Section" description="ส่วนหัวหน้าแรก">
        <TextInput
          label="Overline"
          value={content.hero?.overline || ''}
          onChange={(v) => updateContent(['hero', 'overline'], v)}
        />
        <TextInput
          label="Title Line 1"
          value={content.hero?.titleLine1 || ''}
          onChange={(v) => updateContent(['hero', 'titleLine1'], v)}
        />
        <TextInput
          label="Title Line 2"
          value={content.hero?.titleLine2 || ''}
          onChange={(v) => updateContent(['hero', 'titleLine2'], v)}
        />
        <TextArea
          label="Subtitle"
          value={content.hero?.subtitle || ''}
          onChange={(v) => updateContent(['hero', 'subtitle'], v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="CTA Primary"
            value={content.hero?.ctaPrimary || ''}
            onChange={(v) => updateContent(['hero', 'ctaPrimary'], v)}
          />
          <TextInput
            label="CTA Secondary"
            value={content.hero?.ctaSecondary || ''}
            onChange={(v) => updateContent(['hero', 'ctaSecondary'], v)}
          />
        </div>
      </Section>

      <Section title="Statistics" description="สถิติ">
        <ArrayEditor
          items={content.stats || []}
          onChange={(items) => updateContent(['stats'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Value"
                value={item.value || 0}
                onChange={(v) => {
                  const newStats = [...(content.stats || [])]
                  newStats[index] = { ...item, value: v }
                  updateContent(['stats'], newStats)
                }}
              />
              <TextInput
                label="Suffix"
                value={item.suffix || ''}
                onChange={(v) => {
                  const newStats = [...(content.stats || [])]
                  newStats[index] = { ...item, suffix: v }
                  updateContent(['stats'], newStats)
                }}
              />
              <TextInput
                label="Label"
                value={item.label || ''}
                onChange={(v) => {
                  const newStats = [...(content.stats || [])]
                  newStats[index] = { ...item, label: v }
                  updateContent(['stats'], newStats)
                }}
              />
              <TextInput
                label="Description"
                value={item.description || ''}
                onChange={(v) => {
                  const newStats = [...(content.stats || [])]
                  newStats[index] = { ...item, description: v }
                  updateContent(['stats'], newStats)
                }}
              />
            </div>
          )}
          newItem={{ value: 0, suffix: '+', label: '', description: '' }}
        />
      </Section>

      <Section title="Mission" description="พันธกิจ">
        <TextInput
          label="Section Label"
          value={content.mission?.sectionLabel || ''}
          onChange={(v) => updateContent(['mission', 'sectionLabel'], v)}
        />
        <TextInput
          label="Title"
          value={content.mission?.title || ''}
          onChange={(v) => updateContent(['mission', 'title'], v)}
        />
        <TextInput
          label="Title Highlight"
          value={content.mission?.titleHighlight || ''}
          onChange={(v) => updateContent(['mission', 'titleHighlight'], v)}
        />
        <ArrayEditor
          items={content.mission?.paragraphs || []}
          onChange={(items) => updateContent(['mission', 'paragraphs'], items)}
          renderItem={(item, index) => (
            <TextArea
              label={`Paragraph ${index + 1}`}
              value={item}
              onChange={(v) => {
                const newParagraphs = [...(content.mission?.paragraphs || [])]
                newParagraphs[index] = v
                updateContent(['mission', 'paragraphs'], newParagraphs)
              }}
            />
          )}
          newItem=""
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Users Count"
            value={content.mission?.usersCount || 0}
            onChange={(v) => updateContent(['mission', 'usersCount'], v)}
          />
          <TextInput
            label="Users Label"
            value={content.mission?.usersLabel || ''}
            onChange={(v) => updateContent(['mission', 'usersLabel'], v)}
          />
        </div>
      </Section>

      <Section title="Values" description="คุณค่า">
        <TextInput
          label="Section Label"
          value={content.values?.sectionLabel || ''}
          onChange={(v) => updateContent(['values', 'sectionLabel'], v)}
        />
        <TextInput
          label="Title"
          value={content.values?.title || ''}
          onChange={(v) => updateContent(['values', 'title'], v)}
        />
        <ArrayEditor
          items={content.values?.items || []}
          onChange={(items) => updateContent(['values', 'items'], items)}
          renderItem={(item, index) => (
            <div className="space-y-4">
              <Select
                label="Icon"
                value={item.iconName || 'Users'}
                options={ICON_OPTIONS}
                onChange={(v) => {
                  const newItems = [...(content.values?.items || [])]
                  newItems[index] = { ...item, iconName: v }
                  updateContent(['values', 'items'], newItems)
                }}
              />
              <TextInput
                label="Title"
                value={item.title || ''}
                onChange={(v) => {
                  const newItems = [...(content.values?.items || [])]
                  newItems[index] = { ...item, title: v }
                  updateContent(['values', 'items'], newItems)
                }}
              />
              <TextArea
                label="Description"
                value={item.description || ''}
                onChange={(v) => {
                  const newItems = [...(content.values?.items || [])]
                  newItems[index] = { ...item, description: v }
                  updateContent(['values', 'items'], newItems)
                }}
              />
            </div>
          )}
          newItem={{ iconName: 'Users', title: '', description: '' }}
        />
      </Section>

      <Section title="Timeline" description="เส้นเวลา">
        <TextInput
          label="Section Label"
          value={content.timeline?.sectionLabel || ''}
          onChange={(v) => updateContent(['timeline', 'sectionLabel'], v)}
        />
        <TextInput
          label="Title"
          value={content.timeline?.title || ''}
          onChange={(v) => updateContent(['timeline', 'title'], v)}
        />
        <ArrayEditor
          items={content.timeline?.items || []}
          onChange={(items) => updateContent(['timeline', 'items'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-3 gap-4">
              <TextInput
                label="Year"
                value={item.year || ''}
                onChange={(v) => {
                  const newItems = [...(content.timeline?.items || [])]
                  newItems[index] = { ...item, year: v }
                  updateContent(['timeline', 'items'], newItems)
                }}
              />
              <TextInput
                label="Event"
                value={item.event || ''}
                onChange={(v) => {
                  const newItems = [...(content.timeline?.items || [])]
                  newItems[index] = { ...item, event: v }
                  updateContent(['timeline', 'items'], newItems)
                }}
              />
              <TextInput
                label="Detail"
                value={item.detail || ''}
                onChange={(v) => {
                  const newItems = [...(content.timeline?.items || [])]
                  newItems[index] = { ...item, detail: v }
                  updateContent(['timeline', 'items'], newItems)
                }}
              />
            </div>
          )}
          newItem={{ year: '', event: '', detail: '' }}
        />
      </Section>

      <Section title="Team" description="ทีมงาน">
        <TextInput
          label="Section Label"
          value={content.team?.sectionLabel || ''}
          onChange={(v) => updateContent(['team', 'sectionLabel'], v)}
        />
        <TextInput
          label="Title"
          value={content.team?.title || ''}
          onChange={(v) => updateContent(['team', 'title'], v)}
        />
        <ArrayEditor
          items={content.team?.members || []}
          onChange={(items) => updateContent(['team', 'members'], items)}
          renderItem={(item, index) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Name"
                  value={item.name || ''}
                  onChange={(v) => {
                    const newMembers = [...(content.team?.members || [])]
                    newMembers[index] = { ...item, name: v }
                    updateContent(['team', 'members'], newMembers)
                  }}
                />
                <TextInput
                  label="Role"
                  value={item.role || ''}
                  onChange={(v) => {
                    const newMembers = [...(content.team?.members || [])]
                    newMembers[index] = { ...item, role: v }
                    updateContent(['team', 'members'], newMembers)
                  }}
                />
              </div>
              <TextArea
                label="Bio"
                value={item.bio || ''}
                onChange={(v) => {
                  const newMembers = [...(content.team?.members || [])]
                  newMembers[index] = { ...item, bio: v }
                  updateContent(['team', 'members'], newMembers)
                }}
              />
              <TextArea
                label="Quote"
                value={item.quote || ''}
                onChange={(v) => {
                  const newMembers = [...(content.team?.members || [])]
                  newMembers[index] = { ...item, quote: v }
                  updateContent(['team', 'members'], newMembers)
                }}
              />
              <TextInput
                label="Gradient (Tailwind classes)"
                value={item.gradient || ''}
                onChange={(v) => {
                  const newMembers = [...(content.team?.members || [])]
                  newMembers[index] = { ...item, gradient: v }
                  updateContent(['team', 'members'], newMembers)
                }}
                placeholder="from-blue-500 to-cyan-400"
              />
            </div>
          )}
          newItem={{ name: '', role: '', bio: '', quote: '', gradient: 'from-blue-500 to-cyan-400' }}
        />
      </Section>

      <Section title="Call to Action" description="ปุ่มเรียกร้อง">
        <TextInput
          label="Title"
          value={content.cta?.title || ''}
          onChange={(v) => updateContent(['cta', 'title'], v)}
        />
        <TextArea
          label="Subtitle"
          value={content.cta?.subtitle || ''}
          onChange={(v) => updateContent(['cta', 'subtitle'], v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="CTA Primary"
            value={content.cta?.ctaPrimary || ''}
            onChange={(v) => updateContent(['cta', 'ctaPrimary'], v)}
          />
          <TextInput
            label="CTA Secondary"
            value={content.cta?.ctaSecondary || ''}
            onChange={(v) => updateContent(['cta', 'ctaSecondary'], v)}
          />
        </div>
      </Section>
    </div>
  )
}

// Features Page Editor
function FeaturesEditor({ content, updateContent }: EditorProps) {
  return (
    <div className="space-y-6">
      <Section title="Hero Section" description="ส่วนหัวหน้าแรก">
        <TextInput
          label="Badge"
          value={content.hero?.badge || ''}
          onChange={(v) => updateContent(['hero', 'badge'], v)}
        />
        <TextInput
          label="Title Line 1"
          value={content.hero?.titleLine1 || ''}
          onChange={(v) => updateContent(['hero', 'titleLine1'], v)}
        />
        <TextInput
          label="Title Line 2"
          value={content.hero?.titleLine2 || ''}
          onChange={(v) => updateContent(['hero', 'titleLine2'], v)}
        />
        <TextArea
          label="Subtitle"
          value={content.hero?.subtitle || ''}
          onChange={(v) => updateContent(['hero', 'subtitle'], v)}
        />
        <TextArea
          label="Subtitle Secondary"
          value={content.hero?.subtitleSecondary || ''}
          onChange={(v) => updateContent(['hero', 'subtitleSecondary'], v)}
        />
      </Section>

      <Section title="Statistics" description="สถิติ">
        <ArrayEditor
          items={content.stats || []}
          onChange={(items) => updateContent(['stats'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Value"
                value={item.value || ''}
                onChange={(v) => {
                  const newStats = [...(content.stats || [])]
                  newStats[index] = { ...item, value: v }
                  updateContent(['stats'], newStats)
                }}
              />
              <TextInput
                label="Label"
                value={item.label || ''}
                onChange={(v) => {
                  const newStats = [...(content.stats || [])]
                  newStats[index] = { ...item, label: v }
                  updateContent(['stats'], newStats)
                }}
              />
            </div>
          )}
          newItem={{ value: '', label: '' }}
        />
      </Section>

      <Section title="Categories" description="หมวดหมู่ฟีเจอร์">
        <ArrayEditor
          items={content.categories || []}
          onChange={(items) => updateContent(['categories'], items)}
          renderItem={(item, index) => (
            <div className="space-y-4 p-4 bg-neutral-950 rounded-lg border border-neutral-800">
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="ID"
                  value={item.id || ''}
                  onChange={(v) => {
                    const newCats = [...(content.categories || [])]
                    newCats[index] = { ...item, id: v }
                    updateContent(['categories'], newCats)
                  }}
                />
                <TextInput
                  label="Color"
                  value={item.color || ''}
                  onChange={(v) => {
                    const newCats = [...(content.categories || [])]
                    newCats[index] = { ...item, color: v }
                    updateContent(['categories'], newCats)
                  }}
                  placeholder="blue"
                />
              </div>
              <TextInput
                label="Title"
                value={item.title || ''}
                onChange={(v) => {
                  const newCats = [...(content.categories || [])]
                  newCats[index] = { ...item, title: v }
                  updateContent(['categories'], newCats)
                }}
              />
              <TextInput
                label="Subtitle"
                value={item.subtitle || ''}
                onChange={(v) => {
                  const newCats = [...(content.categories || [])]
                  newCats[index] = { ...item, subtitle: v }
                  updateContent(['categories'], newCats)
                }}
              />
              <TextArea
                label="Description"
                value={item.description || ''}
                onChange={(v) => {
                  const newCats = [...(content.categories || [])]
                  newCats[index] = { ...item, description: v }
                  updateContent(['categories'], newCats)
                }}
              />
              <div className="pt-4 border-t border-neutral-700">
                <p className="text-sm font-medium text-neutral-300 mb-3">Features</p>
                <ArrayEditor<{ name: string; desc: string }>
                  items={item.features || []}
                  onChange={(features) => {
                    const newCats = [...(content.categories || [])]
                    newCats[index] = { ...item, features }
                    updateContent(['categories'], newCats)
                  }}
                  renderItem={(feature, featureIndex) => (
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput
                        label="Name"
                        value={feature.name || ''}
                        onChange={(v) => {
                          const newCats = [...(content.categories || [])]
                          const newFeatures: { name: string; desc: string }[] = [...(item.features || [])]
                          newFeatures[featureIndex] = { ...feature, name: v }
                          newCats[index] = { ...item, features: newFeatures }
                          updateContent(['categories'], newCats)
                        }}
                      />
                      <TextInput
                        label="Description"
                        value={feature.desc || ''}
                        onChange={(v) => {
                          const newCats = [...(content.categories || [])]
                          const newFeatures: { name: string; desc: string }[] = [...(item.features || [])]
                          newFeatures[featureIndex] = { ...feature, desc: v }
                          newCats[index] = { ...item, features: newFeatures }
                          updateContent(['categories'], newCats)
                        }}
                      />
                    </div>
                  )}
                  newItem={{ name: '', desc: '' }}
                />
              </div>
            </div>
          )}
          newItem={{ id: '', title: '', subtitle: '', description: '', color: 'blue', features: [] }}
        />
      </Section>

      <Section title="Comparison Table" description="ตารางเปรียบเทียบ">
        <ArrayEditor
          items={content.comparison || []}
          onChange={(items) => updateContent(['comparison'], items)}
          renderItem={(item, index) => (
            <div className="space-y-3">
              <TextInput
                label="Feature"
                value={item.feature || ''}
                onChange={(v) => {
                  const newComp = [...(content.comparison || [])]
                  newComp[index] = { ...item, feature: v }
                  updateContent(['comparison'], newComp)
                }}
              />
              <div className="grid grid-cols-3 gap-4">
                <BooleanToggle
                  label="RabbitHub"
                  value={item.rabbithub || false}
                  onChange={(v) => {
                    const newComp = [...(content.comparison || [])]
                    newComp[index] = { ...item, rabbithub: v }
                    updateContent(['comparison'], newComp)
                  }}
                />
                <BooleanToggle
                  label="ChatGPT"
                  value={item.chatgpt || false}
                  onChange={(v) => {
                    const newComp = [...(content.comparison || [])]
                    newComp[index] = { ...item, chatgpt: v }
                    updateContent(['comparison'], newComp)
                  }}
                />
                <BooleanToggle
                  label="Claude"
                  value={item.claude || false}
                  onChange={(v) => {
                    const newComp = [...(content.comparison || [])]
                    newComp[index] = { ...item, claude: v }
                    updateContent(['comparison'], newComp)
                  }}
                />
              </div>
            </div>
          )}
          newItem={{ feature: '', rabbithub: false, chatgpt: false, claude: false }}
        />
      </Section>

      <Section title="Call to Action" description="ปุ่มเรียกร้อง">
        <TextInput
          label="Title"
          value={content.cta?.title || ''}
          onChange={(v) => updateContent(['cta', 'title'], v)}
        />
        <TextArea
          label="Subtitle"
          value={content.cta?.subtitle || ''}
          onChange={(v) => updateContent(['cta', 'subtitle'], v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="CTA Primary"
            value={content.cta?.ctaPrimary || ''}
            onChange={(v) => updateContent(['cta', 'ctaPrimary'], v)}
          />
          <TextInput
            label="CTA Secondary"
            value={content.cta?.ctaSecondary || ''}
            onChange={(v) => updateContent(['cta', 'ctaSecondary'], v)}
          />
        </div>
      </Section>
    </div>
  )
}

// Pricing Page Editor
function PricingEditor({ content, updateContent }: EditorProps) {
  return (
    <div className="space-y-6">
      <Section title="Hero Section" description="ส่วนหัวหน้าแรก">
        <TextInput
          label="Title"
          value={content.hero?.title || ''}
          onChange={(v) => updateContent(['hero', 'title'], v)}
        />
        <TextArea
          label="Subtitle"
          value={content.hero?.subtitle || ''}
          onChange={(v) => updateContent(['hero', 'subtitle'], v)}
        />
      </Section>

      <Section title="FAQs" description="คำถามที่พบบ่อย">
        <ArrayEditor
          items={content.faqs || []}
          onChange={(items) => updateContent(['faqs'], items)}
          renderItem={(item, index) => (
            <div className="space-y-4">
              <TextInput
                label="Question"
                value={item.question || ''}
                onChange={(v) => {
                  const newFaqs = [...(content.faqs || [])]
                  newFaqs[index] = { ...item, question: v }
                  updateContent(['faqs'], newFaqs)
                }}
              />
              <TextArea
                label="Answer"
                value={item.answer || ''}
                onChange={(v) => {
                  const newFaqs = [...(content.faqs || [])]
                  newFaqs[index] = { ...item, answer: v }
                  updateContent(['faqs'], newFaqs)
                }}
              />
            </div>
          )}
          newItem={{ question: '', answer: '' }}
        />
      </Section>

      <Section title="Call to Action" description="ปุ่มเรียกร้อง">
        <TextInput
          label="Title"
          value={content.cta?.title || ''}
          onChange={(v) => updateContent(['cta', 'title'], v)}
        />
        <TextArea
          label="Subtitle"
          value={content.cta?.subtitle || ''}
          onChange={(v) => updateContent(['cta', 'subtitle'], v)}
        />
      </Section>
    </div>
  )
}

// Footer Editor
function FooterEditor({ content, updateContent }: EditorProps) {
  return (
    <div className="space-y-6">
      <Section title="Section Titles" description="ชื่อส่วน">
        <div className="grid grid-cols-3 gap-4">
          <TextInput
            label="Product"
            value={content.sectionTitles?.product || ''}
            onChange={(v) => updateContent(['sectionTitles', 'product'], v)}
          />
          <TextInput
            label="Company"
            value={content.sectionTitles?.company || ''}
            onChange={(v) => updateContent(['sectionTitles', 'company'], v)}
          />
          <TextInput
            label="Legal"
            value={content.sectionTitles?.legal || ''}
            onChange={(v) => updateContent(['sectionTitles', 'legal'], v)}
          />
        </div>
      </Section>

      <Section title="Product Links" description="ลิงก์ผลิตภัณฑ์">
        <ArrayEditor
          items={content.links?.product || []}
          onChange={(items) => updateContent(['links', 'product'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Label"
                value={item.label || ''}
                onChange={(v) => {
                  const newLinks = [...(content.links?.product || [])]
                  newLinks[index] = { ...item, label: v }
                  updateContent(['links', 'product'], newLinks)
                }}
              />
              <TextInput
                label="Href"
                value={item.href || ''}
                onChange={(v) => {
                  const newLinks = [...(content.links?.product || [])]
                  newLinks[index] = { ...item, href: v }
                  updateContent(['links', 'product'], newLinks)
                }}
              />
            </div>
          )}
          newItem={{ label: '', href: '' }}
        />
      </Section>

      <Section title="Company Links" description="ลิงก์บริษัท">
        <ArrayEditor
          items={content.links?.company || []}
          onChange={(items) => updateContent(['links', 'company'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Label"
                value={item.label || ''}
                onChange={(v) => {
                  const newLinks = [...(content.links?.company || [])]
                  newLinks[index] = { ...item, label: v }
                  updateContent(['links', 'company'], newLinks)
                }}
              />
              <TextInput
                label="Href"
                value={item.href || ''}
                onChange={(v) => {
                  const newLinks = [...(content.links?.company || [])]
                  newLinks[index] = { ...item, href: v }
                  updateContent(['links', 'company'], newLinks)
                }}
              />
            </div>
          )}
          newItem={{ label: '', href: '' }}
        />
      </Section>

      <Section title="Legal Links" description="ลิงก์กฎหมาย">
        <ArrayEditor
          items={content.links?.legal || []}
          onChange={(items) => updateContent(['links', 'legal'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Label"
                value={item.label || ''}
                onChange={(v) => {
                  const newLinks = [...(content.links?.legal || [])]
                  newLinks[index] = { ...item, label: v }
                  updateContent(['links', 'legal'], newLinks)
                }}
              />
              <TextInput
                label="Href"
                value={item.href || ''}
                onChange={(v) => {
                  const newLinks = [...(content.links?.legal || [])]
                  newLinks[index] = { ...item, href: v }
                  updateContent(['links', 'legal'], newLinks)
                }}
              />
            </div>
          )}
          newItem={{ label: '', href: '' }}
        />
      </Section>

      <Section title="Social Links" description="โซเชียลมีเดีย">
        <ArrayEditor
          items={content.social || []}
          onChange={(items) => updateContent(['social'], items)}
          renderItem={(item, index) => (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Platform"
                value={item.platform || 'twitter'}
                options={[
                  { value: 'twitter', label: 'Twitter' },
                  { value: 'github', label: 'GitHub' },
                  { value: 'facebook', label: 'Facebook' },
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'linkedin', label: 'LinkedIn' }
                ]}
                onChange={(v) => {
                  const newSocial = [...(content.social || [])]
                  newSocial[index] = { ...item, platform: v }
                  updateContent(['social'], newSocial)
                }}
              />
              <TextInput
                label="URL"
                value={item.url || ''}
                onChange={(v) => {
                  const newSocial = [...(content.social || [])]
                  newSocial[index] = { ...item, url: v }
                  updateContent(['social'], newSocial)
                }}
              />
            </div>
          )}
          newItem={{ platform: 'twitter', url: '' }}
        />
      </Section>
    </div>
  )
}

// Editor Components

interface EditorProps {
  content: any
  updateContent: (path: string[], value: any) => void
}

function Section({
  title,
  description,
  children,
  defaultOpen = true
}: {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-neutral-900/30 hover:bg-neutral-800/30 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-400 mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-neutral-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-neutral-900/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
      />
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
      />
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
      />
    </div>
  )
}

function BooleanToggle({
  label,
  value,
  onChange
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
      <label className="text-sm font-medium text-neutral-300">
        {label}
      </label>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          value ? "bg-primary-500" : "bg-neutral-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform",
            value && "translate-x-5"
          )}
        />
      </button>
    </div>
  )
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: { value: string; label: string; icon?: any }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ArrayEditor<T>({
  items,
  onChange,
  renderItem,
  newItem
}: {
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  newItem: T
}) {
  const addItem = () => {
    onChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg"
        >
          <button
            onClick={() => removeItem(index)}
            className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="pr-10">
            {renderItem(item, index)}
          </div>
        </motion.div>
      ))}

      <button
        onClick={addItem}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900/30 border border-neutral-800 border-dashed rounded-lg text-neutral-400 hover:text-white hover:border-primary-500/50 hover:bg-neutral-800/30 transition-all"
      >
        <Plus className="w-4 h-4" />
        เพิ่มรายการ
      </button>
    </div>
  )
}
