'use client'

import { useEffect, useState } from 'react'
import { Wrench, Rocket, ArrowRight } from 'lucide-react'

export default function MaintenancePage() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-sky-500/20">
              <Wrench className="w-12 h-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
              <Rocket className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            RabbitHub AI
          </h1>
          <div className="h-1 w-20 mx-auto bg-gradient-to-r from-sky-500 to-violet-600 rounded-full" />
        </div>

        {/* Message */}
        <div className="space-y-4">
          <p className="text-xl sm:text-2xl text-neutral-200 font-medium">
            กำลังปรับปรุงระบบ{dots}
          </p>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            เรากำลังเตรียมฟีเจอร์ใหม่ๆ ให้คุณ<br />
            เปิดให้บริการเร็วๆ นี้
          </p>
        </div>

        {/* Features coming */}
        <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl p-6 space-y-4">
          <p className="text-sm font-medium text-sky-400 uppercase tracking-wider">
            Coming Soon
          </p>
          <div className="space-y-3 text-left">
            {[
              'AI แชทอัจฉริยะ หลายโมเดล',
              'สร้างรูปภาพด้วย AI',
              'สร้างวิดีโอด้วย AI',
              'ค้นหาเว็บแบบเรียลไทม์',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-neutral-300">
                <ArrowRight className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-neutral-600 text-xs">
          &copy; 2026 RabbitHub AI. All rights reserved.
        </p>
      </div>
    </div>
  )
}
