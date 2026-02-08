'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Facebook } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/constants';

const footerLinks = {
  product: [
    { label: 'ฟีเจอร์', href: '/features' },
    { label: 'ราคา', href: '/pricing' },
    { label: 'API', href: '/api-docs' },
    { label: 'อัพเดท', href: '/updates' },
  ],
  company: [
    { label: 'เกี่ยวกับเรา', href: '/about' },
    { label: 'บล็อก', href: '/blog' },
    { label: 'ร่วมงานกับเรา', href: '/careers' },
    { label: 'ติดต่อ', href: '/contact' },
  ],
  legal: [
    { label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
    { label: 'ข้อกำหนดการใช้งาน', href: '/terms' },
    { label: 'คุกกี้', href: '/privacy#cookies' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Facebook, href: '#', label: 'Facebook' },
];

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-8 sm:py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg overflow-hidden shadow-md">
                <Image
                  src="/images/logo.jpg"
                  alt="RabbitHub Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl">{SITE_CONFIG.name}</span>
            </Link>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-neutral-400 max-w-xs">
              {SITE_CONFIG.description}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  <social.icon className="h-4 w-4 text-neutral-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display font-semibold text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-3 sm:mb-4">
              ผลิตภัณฑ์
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-3 sm:mb-4">
              บริษัท
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-3 sm:mb-4">
              กฎหมาย
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-4 sm:py-6 border-t border-neutral-800 flex items-center justify-center">
          <p className="text-xs sm:text-sm text-neutral-500 text-center">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name} สงวนลิขสิทธิ์
          </p>
        </div>
      </div>
    </footer>
  );
}
