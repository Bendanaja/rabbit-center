'use client';

import { motion } from 'framer-motion';
import { ImagePlus, Video, Film, Blend, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudioViewProps } from '../StudioWorkspace';

const TOOLS = [
  {
    id: 'image',
    icon: ImagePlus,
    title: 'สร้างรูปภาพ',
    subtitle: 'Text to Image',
    description: 'สร้างภาพสวยงามจากข้อความด้วย AI — รองรับ Imagen 4, Nano Banana',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15 border-violet-500/20',
    accentColor: 'text-violet-300',
  },
  {
    id: 'video',
    icon: Video,
    title: 'สร้างวิดีโอ',
    subtitle: 'Text to Video',
    description: 'สร้างวิดีโอจากข้อความด้วย Veo 3.1 — ความละเอียดสูง, สมจริง',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15 border-cyan-500/20',
    accentColor: 'text-cyan-300',
  },
  {
    id: 'frame_to_video',
    icon: Film,
    title: 'ภาพเป็นวิดีโอ',
    subtitle: 'Image to Video',
    description: 'เปลี่ยนภาพนิ่งให้เป็นวิดีโอเคลื่อนไหว — กำหนดเฟรมเริ่มต้นและสิ้นสุดได้',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border-emerald-500/20',
    accentColor: 'text-emerald-300',
  },
  {
    id: 'video_mix',
    icon: Blend,
    title: 'ผสมวิดีโอ',
    subtitle: 'Video Mix',
    description: 'ผสมผสานวิดีโอด้วย AI — สร้างเอฟเฟกต์และสไตล์ใหม่ๆ',
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15 border-orange-500/20',
    accentColor: 'text-orange-300',
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function ToolsView({ onNavigate }: StudioViewProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4 text-violet-400" />
          </div>
          <h1 className="text-lg font-semibold text-white">เครื่องมือ AI</h1>
        </div>
        <p className="text-sm text-neutral-500 ml-11">เลือกเครื่องมือที่ต้องการใช้งาน</p>
      </div>

      {/* Tools grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6"
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              variants={cardVariants}
              onClick={() => onNavigate('create')}
              className={cn(
                'group text-left rounded-2xl border border-white/[0.06] overflow-hidden',
                `bg-gradient-to-br ${tool.gradient}`,
                'p-6 hover:border-white/[0.12] transition-all duration-200',
                'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40'
              )}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon box */}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl border flex items-center justify-center mb-4',
                  tool.iconBg
                )}
              >
                <Icon className={cn('h-6 w-6', tool.iconColor)} />
              </div>

              {/* Title + subtitle */}
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white leading-tight">{tool.title}</h3>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block',
                    'bg-white/[0.06] text-neutral-400'
                  )}
                >
                  {tool.subtitle}
                </span>
              </div>

              {/* Description */}
              <p className="text-[13px] text-neutral-500 leading-relaxed mb-4">
                {tool.description}
              </p>

              {/* CTA */}
              <div
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-all',
                  'opacity-70 group-hover:opacity-100',
                  tool.accentColor
                )}
              >
                ลองเลย
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
