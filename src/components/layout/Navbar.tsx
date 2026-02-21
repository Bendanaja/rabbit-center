'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, ArrowRight, Zap, MessageSquare, CreditCard, Settings, LogIn } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  // Throttled scroll handler with RAF - prevents re-render per pixel
  useEffect(() => {
    let lastScrolled = false;

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const scrolled = window.scrollY > 50;
        if (scrolled !== lastScrolled) {
          lastScrolled = scrolled;
          setIsScrolled(scrolled);
        }
        rafRef.current = undefined;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Auth state
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav
          className={cn(
            'relative max-w-6xl mx-auto rounded-2xl transition-all duration-300',
            isScrolled
              ? 'glass-premium'
              : 'bg-white/30 dark:bg-neutral-900/30 backdrop-blur-md'
          )}
        >
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/50 dark:ring-neutral-800/50">
                  <Image
                    src="/images/logo.jpg"
                    alt="RabbitHub Logo"
                    fill
                    sizes="40px"
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Static online dot - no infinite animation */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900" />
              </div>

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
                        'relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200',
                        isActive
                          ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-700/50'
                      )}
                    >
                      {Icon}
                      <span>{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-dot"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary-500"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
                      src={user?.user_metadata?.avatar_url}
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

                  {/* Signup button */}
                  <div className="relative group border-glow-premium rounded-xl">
                    <Button
                      variant="primary"
                      size="sm"
                      className="relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 border-0 shadow-premium"
                      asChild
                    >
                      <Link href="/auth/signup" className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        สมัครฟรี
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button - simplified animation */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'md:hidden relative p-2.5 rounded-xl transition-all duration-200',
                mobileMenuOpen
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              )}
              aria-label="เปิด/ปิดเมนู"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-white dark:bg-neutral-900 shadow-2xl md:hidden overflow-hidden gpu-accelerated"
            >
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200/50 dark:border-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src="/images/logo.jpg"
                        alt="RabbitHub Logo"
                        fill
                        sizes="40px"
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

                {/* Navigation Links - no stagger delay on each item */}
                <div className="flex-1 overflow-y-auto py-6 px-4 mobile-scroll">
                  <div className="space-y-2">
                    {NAV_LINKS.map((link) => {
                      const isActive = pathname === link.href;
                      const Icon = navIcons[link.href];

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeMobileMenu}
                          className={cn(
                            'flex items-center gap-4 px-4 py-4 rounded-xl transition-colors duration-200',
                            isActive
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98]'
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
                          </div>
                          <ArrowRight className={cn(
                            'h-4 w-4',
                            isActive ? 'text-white' : 'text-neutral-400'
                          )} />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50 space-y-3">
                  {isLoggedIn ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        <Avatar
                          src={user?.user_metadata?.avatar_url}
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
                      </div>
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full justify-center bg-gradient-to-r from-primary-500 to-primary-600"
                        asChild
                      >
                        <Link href="/chat" onClick={closeMobileMenu}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          เริ่มแชทเลย
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="lg" className="w-full justify-center" asChild>
                        <Link href="/auth/login" onClick={closeMobileMenu}>
                          <LogIn className="h-4 w-4 mr-2" />
                          เข้าสู่ระบบ
                        </Link>
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full justify-center bg-gradient-to-r from-primary-500 to-primary-600"
                        asChild
                      >
                        <Link href="/auth/signup" onClick={closeMobileMenu}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          สมัครฟรีเลย
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
