'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Facebook } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/constants';
import { type FooterContent } from '@/lib/content';

const socialIconMap: Record<string, React.ElementType> = {
  twitter: Twitter,
  github: Github,
  facebook: Facebook,
};

interface FooterClientProps {
  content: FooterContent;
}

export function FooterClient({ content }: FooterClientProps) {
  return (
    <footer className="relative bg-neutral-950 text-white overflow-hidden border-t border-neutral-800">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl">{SITE_CONFIG.name}</span>
            </Link>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-neutral-400 max-w-xs">
              {SITE_CONFIG.description}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
              {content.social.map((social) => {
                const Icon = socialIconMap[social.platform];
                if (!Icon) return null;
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    aria-label={social.platform}
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-all duration-300 hover:shadow-premium-glow group border border-neutral-800 hover:border-primary-500/50"
                  >
                    <Icon className="h-4 w-4 text-neutral-400 group-hover:text-primary-400 transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display font-semibold text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-3 sm:mb-4">
              {content.sectionTitles.product}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {content.links.product.map((link) => (
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
              {content.sectionTitles.company}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {content.links.company.map((link) => (
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
              {content.sectionTitles.legal}
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {content.links.legal.map((link) => (
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
