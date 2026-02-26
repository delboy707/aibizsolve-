'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: 'FREE', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  starter: { label: 'STARTER', className: 'bg-primary-50 text-primary-700 border-primary-200' },
  professional: { label: 'PRO', className: 'bg-primary-600 text-white border-primary-700' },
  founding_leader: { label: 'FOUNDER', className: 'bg-amber-50 text-amber-700 border-amber-300' },
};

interface AppHeaderProps {
  email?: string;
  tier?: string;
  hasStripe?: boolean;
}

export function AppHeader({ email, tier = 'free', hasStripe = false }: AppHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const badge = TIER_BADGES[tier] || TIER_BADGES.free;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLink = (href: string, label: string) => {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`font-medium transition-colors ${
          isActive ? 'text-primary-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
          </Link>

          <div className="flex items-center gap-4">
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/chat', 'New Report')}
            {navLink('/pricing', 'Pricing')}

            {/* User menu */}
            <div className="relative pl-4 border-l border-gray-200" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="text-sm text-gray-600 hidden sm:inline max-w-[160px] truncate">
                  {email}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                    <p className="text-xs font-semibold text-gray-700 capitalize mt-0.5">
                      {tier.replace('_', ' ')} Plan
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/pricing"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  {hasStripe && (
                    <button
                      onClick={() => { setMenuOpen(false); handleManageSubscription(); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Manage Subscription
                    </button>
                  )}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
