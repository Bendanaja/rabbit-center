'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronUp, X } from 'lucide-react';
import { authFetch } from '@/lib/api-client';

const PLANS = [
  { id: null, label: 'แอดมิน', color: 'bg-emerald-500', activeColor: 'ring-emerald-400' },
  { id: 'free', label: 'ฟรี', color: 'bg-neutral-500', activeColor: 'ring-neutral-400' },
  { id: 'starter', label: 'เริ่มต้น', color: 'bg-blue-500', activeColor: 'ring-blue-400' },
  { id: 'pro', label: 'โปร', color: 'bg-violet-500', activeColor: 'ring-violet-400' },
  { id: 'premium', label: 'พรีเมียม', color: 'bg-amber-500', activeColor: 'ring-amber-400' },
] as const;

export function SimulatePlanBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSim, setCurrentSim] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Read current simulation from sessionStorage
    try {
      const sim = sessionStorage.getItem('simulate_plan');
      setCurrentSim(sim);
    } catch { /* ignore */ }

    // Check admin status — use cached flag first, then verify via API
    try {
      const cached = sessionStorage.getItem('is_admin_user');
      if (cached === 'true') setIsAdmin(true);
    } catch { /* ignore */ }

    authFetch('/api/user/usage')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        // Admin is detected by: unlimited budget without simulation, or simulating field present
        const admin = !!data.budget?.unlimited || !!data.simulating;
        setIsAdmin(admin);
        try {
          sessionStorage.setItem('is_admin_user', admin ? 'true' : 'false');
        } catch { /* ignore */ }
      })
      .catch(() => {});
  }, []);

  const handleSelect = useCallback((planId: string | null) => {
    if (planId) {
      sessionStorage.setItem('simulate_plan', planId);
    } else {
      sessionStorage.removeItem('simulate_plan');
    }
    setCurrentSim(planId);
    setExpanded(false);
    window.location.reload();
  }, []);

  if (!mounted || !isAdmin) return null;

  const activePlan = PLANS.find(p => p.id === currentSim) || PLANS[0];
  const isSimulating = currentSim !== null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-[9990]">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl shadow-black/20"
          >
            {/* Header */}
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">จำลองยศ</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-amber-500" />
              </button>
            </div>

            {/* Plan buttons */}
            <div className="p-1.5 space-y-0.5">
              {PLANS.map((plan) => {
                const isActive = currentSim === plan.id;
                return (
                  <button
                    key={plan.id ?? 'admin'}
                    onClick={() => handleSelect(plan.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-800'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${plan.color} ${isActive ? 'ring-2 ring-offset-1 dark:ring-offset-neutral-900 ' + plan.activeColor : ''}`} />
                    <span className={`text-xs font-medium ${
                      isActive
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {plan.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-3 py-1.5 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 text-center">
                ไม่กระทบข้อมูลจริง
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-full shadow-lg transition-all ${
          isSimulating
            ? 'bg-amber-500 text-white shadow-amber-500/30'
            : 'bg-neutral-800 dark:bg-neutral-700 text-neutral-200 shadow-black/20'
        }`}
      >
        {isSimulating ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4 text-neutral-400" />
        )}
        <span className="text-xs font-semibold">
          {isSimulating ? activePlan.label : 'จำลอง'}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronUp className="h-3.5 w-3.5" />
        </motion.div>
      </motion.button>
    </div>
  );
}
