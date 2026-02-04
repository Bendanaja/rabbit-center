'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Menu, X, Sparkles, ArrowRight, Zap, MessageSquare, CreditCard, Settings, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { NAV_LINKS, SITE_CONFIG } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

// Nav link icons
const navIcons: Record<string, React.ReactNode> = {
  '/': <Zap className="h-4 w-4" />,
  '/chat': <MessageSquare className="h-4 w-4" />,
  '/pricing': <CreditCard className="h-4 w-4" />,
  '/settings': <Settings className="h-4 w-4" />,
};

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // Check if scrolled
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  // Auth state
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav
          className={cn(
            'relative max-w-6xl mx-auto rounded-2xl transition-all duration-500',
            isScrolled
              ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-neutral-200/50 dark:border-neutral-700/50'
              : 'bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm'
          )}
        >
          {/* Animated gradient border when scrolled */}
          {isScrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20 -z-10"
            />
          )}

          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-300" />
                <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/50 dark:ring-neutral-800/50">
                  <Image
                    src="/images/logo.jpg"
                    alt="RabbitAI Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Online dot */}
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-neutral-900 dark:text-white leading-tight">
                  {SITE_CONFIG.name}
                </span>
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-medium tracking-wide">
                  AI Chat Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-1 p-1.5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = navIcons[link.href];

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                        isActive
                          ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                      )}
                    >
                      <span className={cn(
                        'transition-transform duration-200',
                        isActive && 'scale-110'
                      )}>
                        {Icon}
                      </span>
                      <span>{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-dot"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary-500"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side - CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/chat" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      เริ่มแชท
                    </Link>
                  </Button>
                  <Link href="/settings">
                    <Avatar
                      name={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้'}
                      size="sm"
                      status="online"
                    />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    asChild
                  >
                    <Link href="/auth/login" className="flex items-center gap-1.5">
                      <LogIn className="h-4 w-4" />
                      เข้าสู่ระบบ
                    </Link>
                  </Button>

                  {/* Premium signup button with shimmer */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl opacity-70 group-hover:opacity-100 blur transition-opacity" />
                    <Button
                      variant="primary"
                      size="sm"
                      className="relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-lg overflow-hidden"
                      asChild
                    >
                      <Link href="/auth/signup" className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        สมัครฟรี
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'md:hidden relative p-2.5 rounded-xl transition-all duration-300',
                mobileMenuOpen
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              )}
              aria-label="เปิด/ปิดเมนู"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation - Full Screen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-white dark:bg-neutral-900 shadow-2xl md:hidden overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary-500/10 to-transparent rounded-full blur-3xl" />

              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200/50 dark:border-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src="/images/logo.jpg"
                        alt="RabbitAI Logo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                        {SITE_CONFIG.name}
                      </span>
                      <p className="text-xs text-neutral-500">เมนูนำทาง</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="space-y-2">
                    {NAV_LINKS.map((link, index) => {
                      const isActive = pathname === link.href;
                      const Icon = navIcons[link.href];

                      return (
                        <motion.div
                          key={link.href}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200',
                              isActive
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg',
                              isActive
                                ? 'bg-white/20'
                                : 'bg-neutral-100 dark:bg-neutral-800'
                            )}>
                              {Icon}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{link.label}</span>
                              {link.href === '/chat' && (
                                <p className={cn(
                                  'text-xs mt-0.5',
                                  isActive ? 'text-white/70' : 'text-neutral-500'
                                )}>
                                  แชทกับ AI 7+ โมเดล
                                </p>
                              )}
                              {link.href === '/pricing' && (
                                <p className={cn(
                                  'text-xs mt-0.5',
                                  isActive ? 'text-white/70' : 'text-neutral-500'
                                )}>
                                  ดูแพ็กเกจราคา
                                </p>
                              )}
                            </div>
                            <ArrowRight className={cn(
                              'h-4 w-4 transition-transform',
                              isActive ? 'text-white' : 'text-neutral-400'
                            )} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50 space-y-3">
                  {isLoggedIn ? (
                    <>
                      {/* User info when logged in */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800"
                      >
                        <Avatar
                          name={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้'}
                          size="md"
                          status="online"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-white truncate">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ผู้ใช้'}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative group"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl opacity-70 blur" />
                        <Button
                          variant="primary"
                          size="lg"
                          className="relative w-full justify-center bg-gradient-to-r from-primary-500 to-primary-600"
                          asChild
                        >
                          <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            เริ่มแชทเลย
                          </Link>
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full justify-center"
                          asChild
                        >
                          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                            <LogIn className="h-4 w-4 mr-2" />
                            เข้าสู่ระบบ
                          </Link>
                        </Button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative group"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl opacity-70 blur" />
                        <Button
                          variant="primary"
                          size="lg"
                          className="relative w-full justify-center bg-gradient-to-r from-primary-500 to-primary-600"
                          asChild
                        >
                          <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            สมัครฟรีเลย
                          </Link>
                        </Button>
                      </motion.div>
                    </>
                  )}

                  {/* Version info */}
                  <p className="text-center text-xs text-neutral-400 mt-4">
                    RabbitAI v1.0 • Made with ❤️
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
