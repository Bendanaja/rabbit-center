'use client';

import Link from 'next/link';
import {
  Home,
  Compass,
  Wand2,
  Layers,
  Wrench,
  Settings,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudioView } from './StudioWorkspace';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioSidebarProps {
  activeView: StudioView;
  onNavigate: (view: StudioView) => void;
  activeJobCount: number;
}

// ─── Nav item config ──────────────────────────────────────────────────────────

const NAV_ITEMS: { id: StudioView; icon: typeof Compass; label: string }[] = [
  { id: 'explore', icon: Compass, label: 'สำรวจ' },
  { id: 'create', icon: Wand2, label: 'สร้าง' },
  { id: 'assets', icon: Layers, label: 'ผลงาน' },
  { id: 'tools', icon: Wrench, label: 'เครื่องมือ' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioSidebar({
  activeView,
  onNavigate,
  activeJobCount,
}: StudioSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-[60px] bg-[#111214] border-r border-white/[0.06] py-3 items-center shrink-0">
      {/* Home link */}
      <Link
        href="/"
        className="mb-3 p-2 w-14 flex flex-col items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
        title="หน้าหลัก"
      >
        <Home className="h-5 w-5" />
      </Link>

      {/* Divider */}
      <div className="w-8 h-px bg-white/[0.06] mb-3" />

      {/* Navigation items */}
      <nav className="flex flex-col items-center gap-1 w-full px-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-1 rounded-xl w-14 transition-all duration-150',
                isActive
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active jobs indicator */}
      {activeJobCount > 0 && (
        <button
          onClick={() => onNavigate('assets')}
          title={`${activeJobCount} งานกำลังสร้าง`}
          className="mt-3 relative p-2 rounded-xl text-violet-400 hover:bg-white/5 transition-colors"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 text-[9px] text-white flex items-center justify-center font-bold leading-none">
            {activeJobCount > 9 ? '9+' : activeJobCount}
          </span>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <Link
        href="/settings"
        title="ตั้งค่า"
        className="p-2 w-14 flex flex-col items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </aside>
  );
}
