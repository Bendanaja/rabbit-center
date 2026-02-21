'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Palette,
  Shield,
  CreditCard,
  LogOut,
  Check,
  Moon,
  Sun,
  Gift,
  Loader2,
  Phone,
  Camera,
  Trash2,
  Zap,
  Star,
  Crown,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout';
import { FooterClient } from '@/components/layout/FooterClient';
import { DEFAULT_FOOTER } from '@/lib/content';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { RabbitLoader } from '@/components/ui/RabbitLoader';
import { FadeIn } from '@/components/animations';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { id: 'profile', label: 'โปรไฟล์', icon: User },
  { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
  { id: 'appearance', label: 'ธีม', icon: Palette },
  { id: 'security', label: 'ความปลอดภัย', icon: Shield },
  { id: 'billing', label: 'การเรียกเก็บเงิน', icon: CreditCard },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, session, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [userPlan, setUserPlan] = useState<{ plan: string; planName: string; unlimited: boolean }>({ plan: 'free', planName: 'ฟรี', unlimited: false });

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification toggles state
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    product_updates: true,
    usage_alerts: true,
    promotional_emails: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // Initialize profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setProfileEmail(user.email || '');
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    }
  }, [user]);


  // Fetch customer profile (phone number, avatar) and plan
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.phone_number) setProfilePhone(data.phone_number);
        if (data?.display_name) setProfileName(data.display_name);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        // Load notification preferences from DB
        if (data?.preferences?.notifications) {
          setNotifications(prev => ({ ...prev, ...data.preferences.notifications }));
        }
      })
      .catch(() => { /* non-blocking */ });

    // Fetch actual plan (with simulate param if set)
    const sim = typeof window !== 'undefined' ? sessionStorage.getItem('simulate_plan') : null;
    const usageUrl = sim ? `/api/user/usage?simulate=${sim}` : '/api/user/usage';
    fetch(usageUrl, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.plan) {
          setUserPlan({
            plan: data.plan,
            planName: data.planName || data.plan,
            unlimited: !!data.budget?.unlimited,
          });
        }
      })
      .catch(() => { /* non-blocking */ });
  }, [session]);

  const handleProfileSave = useCallback(async () => {
    if (!session?.access_token) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);

    // Validate phone number if provided
    if (profilePhone) {
      const cleaned = profilePhone.replace(/[-\s]/g, '');
      const thaiPhoneRegex = /^0[0-9]{8,9}$/;
      if (!thaiPhoneRegex.test(cleaned)) {
        setProfileError('เบอร์โทรศัพท์ไม่ถูกต้อง (รูปแบบ: 0x-xxxx-xxxx)');
        setProfileSaving(false);
        return;
      }
    }

    try {
      // Save to customer_profiles via PUT
      const putResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          display_name: profileName,
          phone_number: profilePhone || null,
        }),
      });

      // Also update user_profiles via PATCH for backward compat
      const patchResponse = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ full_name: profileName }),
      });

      if (putResponse.ok || patchResponse.ok) {
        setProfileSuccess(true);
        toast.success('บันทึกโปรไฟล์เรียบร้อยแล้ว');
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        const data = await (putResponse.ok ? patchResponse : putResponse).json();
        const errorMsg = data.error || 'ไม่สามารถบันทึกได้';
        setProfileError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      setProfileError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setProfileSaving(false);
    }
  }, [session, profileName, profilePhone]);

  const handleNotificationToggle = useCallback(async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);

    // Persist to DB
    if (!session?.access_token) return;
    setNotifSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          preferences: { notifications: updated },
        }),
      });
    } catch {
      // Revert on error
      setNotifications(notifications);
      toast.error('บันทึกการตั้งค่าล้มเหลว');
    } finally {
      setNotifSaving(false);
    }
  }, [session, notifications]);

  const handleAvatarSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.access_token) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG, GIF หรือ WebP');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ไฟล์มีขนาดใหญ่เกิน 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: base64,
          contentType: file.type,
        }),
      });

      const data = await response.json();
      if (response.ok && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
        toast.success('อัปโหลดรูปโปรไฟล์เรียบร้อย');
      } else {
        toast.error(data.error || 'อัปโหลดรูปภาพล้มเหลว');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setAvatarUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [session]);

  const handleAvatarRemove = useCallback(async () => {
    if (!session?.access_token) return;
    setAvatarUploading(true);
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        setAvatarUrl(null);
        toast.success('ลบรูปโปรไฟล์เรียบร้อย');
      } else {
        toast.error('ลบรูปภาพล้มเหลว');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setAvatarUploading(false);
    }
  }, [session]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/settings');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <RabbitLoader size="lg" text="กำลังโหลดการตั้งค่า..." />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // User data from auth
  const userData = {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'ผู้ใช้',
    email: user.email || '',
    plan: userPlan.planName,
    planId: userPlan.plan,
    isAdmin: userPlan.unlimited,
    avatar: user.user_metadata?.avatar_url || null,
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      <Navbar />

      <main className="flex-1 pt-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <FadeIn>
            <div className="mb-6 sm:mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-1 sm:mb-2">
                  ตั้งค่า
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                  จัดการบัญชีและค่ากำหนดของคุณ
                </p>
              </div>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="gap-2 shrink-0">
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Sidebar - Horizontal scroll on mobile */}
            <FadeIn delay={0.1} className="lg:col-span-1">
              {/* Mobile: Horizontal tabs */}
              <div className="lg:hidden mb-4">
                <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-feedback ${activeTab === tab.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop: Vertical sidebar */}
              <Card className="p-2 hidden lg:block glass-premium shadow-premium border-white/20 dark:border-neutral-700/50">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                        }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                  <hr className="my-2 border-neutral-200 dark:border-neutral-800" />
                  <Link
                    href="/free-access"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <Gift className="h-4 w-4" />
                    ใช้งานฟรี (ดูโฆษณา)
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </nav>
              </Card>
            </FadeIn>

            {/* Content */}
            <FadeIn delay={0.2} className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card className="glass-premium shadow-premium border-white/20 dark:border-neutral-700/50 relative overflow-hidden">
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
                      ตั้งค่าโปรไฟล์
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      จัดการข้อมูลส่วนตัวของคุณ
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <Avatar src={avatarUrl} name={profileName || userData.name} size="xl" />
                        {avatarUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarUploading}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 rounded-full transition-colors cursor-pointer"
                        >
                          <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarSelect}
                      />
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarUploading}
                          >
                            {avatarUploading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                กำลังอัปโหลด...
                              </>
                            ) : (
                              'เปลี่ยนรูปภาพ'
                            )}
                          </Button>
                          {avatarUrl && (
                            <button
                              onClick={handleAvatarRemove}
                              disabled={avatarUploading}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="ลบรูปโปรไฟล์"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          JPG, PNG, GIF หรือ WebP ขนาดไม่เกิน 2MB
                        </p>
                      </div>
                    </div>

                    {profileSuccess && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          บันทึกโปรไฟล์เรียบร้อยแล้ว
                        </p>
                      </div>
                    )}

                    {profileError && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="ชื่อ-นามสกุล"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                      <Input
                        label="อีเมล"
                        type="email"
                        value={profileEmail}
                        disabled
                      />
                      <Input
                        label="เบอร์โทรศัพท์"
                        type="tel"
                        placeholder="08x-xxx-xxxx"
                        leftIcon={<Phone className="h-4 w-4" />}
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                      />
                    </div>

                    {(() => {
                      const planStyles: Record<string, { gradient: string; icon: React.ElementType; label: string; desc: string }> = {
                        admin: { gradient: 'from-emerald-500 to-teal-600', icon: Shield, label: 'แอดมิน', desc: 'ใช้งานได้ไม่จำกัด' },
                        free: { gradient: 'from-neutral-500 to-neutral-600', icon: User, label: 'แผนฟรี', desc: 'อัปเกรดเพื่อปลดล็อกทุกโมเดล' },
                        starter: { gradient: 'from-blue-500 to-indigo-600', icon: Zap, label: 'แผนเริ่มต้น', desc: 'เข้าถึงโมเดลยอดนิยม' },
                        pro: { gradient: 'from-violet-500 to-purple-600', icon: Star, label: 'แผนโปร', desc: 'เข้าถึงโมเดลทั้งหมด' },
                        premium: { gradient: 'from-amber-500 to-orange-600', icon: Crown, label: 'แผนพรีเมียม', desc: 'เข้าถึงทุกฟีเจอร์ ไม่จำกัด' },
                      };
                      const style = userData.isAdmin ? planStyles.admin : (planStyles[userData.planId] || planStyles.free);
                      const PlanIcon = style.icon;
                      return (
                        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${style.gradient} p-4`}>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm">
                                <PlanIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm">{style.label}</p>
                                <p className="text-white/70 text-xs">{style.desc}</p>
                              </div>
                            </div>
                            {userData.planId === 'free' && !userData.isAdmin && (
                              <Link href="/pricing">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium rounded-lg transition-colors">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  อัปเกรด
                                </button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })()}


                    <div className="flex justify-end">
                      <Button onClick={handleProfileSave} disabled={profileSaving}>
                        {profileSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            กำลังบันทึก...
                          </>
                        ) : (
                          'บันทึกการเปลี่ยนแปลง'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card className="glass-premium shadow-premium border-white/20 dark:border-neutral-700/50 relative overflow-hidden">
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
                      การแจ้งเตือน
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      ตั้งค่าวิธีรับการแจ้งเตือนของคุณ
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {([
                      { key: 'email_notifications' as const, title: 'การแจ้งเตือนทางอีเมล', description: 'รับอัปเดตผ่านอีเมล' },
                      { key: 'product_updates' as const, title: 'อัปเดตผลิตภัณฑ์', description: 'ข่าวสารเกี่ยวกับฟีเจอร์ใหม่' },
                      { key: 'usage_alerts' as const, title: 'แจ้งเตือนการใช้งาน', description: 'แจ้งเตือนเมื่อใกล้ถึงขีดจำกัด' },
                      { key: 'promotional_emails' as const, title: 'อีเมลโปรโมชั่น', description: 'เคล็ดลับและโปรโมชั่น' },
                    ]).map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                      >
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{item.title}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.description}</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications[item.key]}
                            onChange={() => handleNotificationToggle(item.key)}
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Appearance Tab - Simple Theme Toggle */}
              {activeTab === 'appearance' && (
                <Card className="glass-premium shadow-premium border-white/20 dark:border-neutral-700/50 relative overflow-hidden">
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
                      ธีม
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      เลือกโหมดการแสดงผลที่ชอบ
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Simple Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                      <div className="flex items-center gap-3">
                        {resolvedTheme === 'dark' ? (
                          <Moon className="h-5 w-5 text-indigo-500" />
                        ) : (
                          <Sun className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {resolvedTheme === 'dark' ? 'โหมดกลางคืน' : 'โหมดกลางวัน'}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {resolvedTheme === 'dark' ? 'พื้นหลังสีเข้ม สบายตา' : 'พื้นหลังสีอ่อน อ่านง่าย'}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-indigo-600' : 'bg-amber-400'
                          }`}
                      >
                        <motion.div
                          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                          animate={{ left: resolvedTheme === 'dark' ? '2.25rem' : '0.25rem' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          {resolvedTheme === 'dark' ? (
                            <Moon className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <Sun className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </motion.div>
                      </button>
                    </div>

                    {/* Quick Options */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'สว่าง', icon: Sun, color: 'amber' },
                        { id: 'dark', label: 'มืด', icon: Moon, color: 'indigo' },
                        { id: 'system', label: 'อัตโนมัติ', icon: Palette, color: 'neutral' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setTheme(option.id as 'light' | 'dark' | 'system')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === option.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                            }`}
                        >
                          <option.icon
                            className={`h-5 w-5 ${theme === option.id
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-neutral-500'
                              }`}
                          />
                          <span
                            className={`text-sm font-medium ${theme === option.id
                                ? 'text-primary-700 dark:text-primary-400'
                                : 'text-neutral-600 dark:text-neutral-400'
                              }`}
                          >
                            {option.label}
                          </span>
                          {theme === option.id && (
                            <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          )}
                        </button>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 text-center">
                      {theme === 'system' && 'ธีมจะเปลี่ยนตามการตั้งค่าของอุปกรณ์โดยอัตโนมัติ'}
                      {theme === 'light' && 'ใช้ธีมสว่างตลอดเวลา'}
                      {theme === 'dark' && 'ใช้ธีมมืดตลอดเวลา'}
                    </p>
                  </div>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <Card className="glass-premium shadow-premium border-white/20 dark:border-neutral-700/50 relative overflow-hidden">
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
                      ความปลอดภัย
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      จัดการค่ากำหนดด้านความปลอดภัย
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">รหัสผ่าน</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">เปลี่ยนรหัสผ่านของคุณ</p>
                      </div>
                      <Link href="/auth/reset-password">
                        <Button variant="outline">เปลี่ยนรหัสผ่าน</Button>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 opacity-60">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-900 dark:text-white">การยืนยันตัวตนสองชั้น</p>
                          <Badge variant="info" className="text-[10px]">เร็วๆ นี้</Badge>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">เพิ่มความปลอดภัยอีกระดับ</p>
                      </div>
                      <Button variant="outline" disabled>เปิดใช้งาน 2FA</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 opacity-60">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-900 dark:text-white">เซสชันที่ใช้งานอยู่</p>
                          <Badge variant="info" className="text-[10px]">เร็วๆ นี้</Badge>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">จัดการเซสชันที่ใช้งานอยู่</p>
                      </div>
                      <Button variant="outline" disabled>จัดการเซสชัน</Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <Card className="glass-premium shadow-premium border-white/20 dark:border-neutral-700/50 relative overflow-hidden">
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-display font-semibold text-neutral-900 dark:text-white">
                      การเรียกเก็บเงิน
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      จัดการการสมัครสมาชิก
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className={`p-4 rounded-lg ${userData.isAdmin
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                        : userData.planId === 'free'
                          ? 'bg-gradient-to-r from-neutral-500 to-neutral-600 text-white'
                          : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">แผนปัจจุบัน</p>
                          <p className="text-2xl font-display font-bold">{userData.isAdmin ? 'แอดมิน' : userData.plan}</p>
                        </div>
                        <Badge className="bg-white/20 text-white">{userData.isAdmin ? 'ไม่จำกัด' : 'ใช้งานอยู่'}</Badge>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
                        <span>
                          {userData.isAdmin ? 'ผู้ดูแลระบบ' :
                            userData.planId === 'free' ? 'ฟรี' :
                              userData.planId === 'starter' ? '฿199/เดือน' :
                                userData.planId === 'pro' ? '฿499/เดือน' :
                                  userData.planId === 'premium' ? '฿990/เดือน' : 'ฟรี'}
                        </span>
                        {isAdmin && <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>}
                      </div>
                    </div>

                    {!userData.isAdmin && userData.planId === 'free' ? (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">อัปเกรดเป็น Pro</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            ใช้งานได้ไม่จำกัดและเข้าถึงทุกโมเดล
                          </p>
                        </div>
                        <Link href="/pricing">
                          <Button>อัปเกรด</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">เปลี่ยนแผน</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            ดูแผนทั้งหมดและอัปเกรด/ดาวน์เกรด
                          </p>
                        </div>
                        <Link href="/pricing">
                          <Button variant="outline">ดูแผนทั้งหมด</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </FadeIn>
          </div>
        </div>
      </main>

      <FooterClient content={DEFAULT_FOOTER} />
    </div>
  );
}
