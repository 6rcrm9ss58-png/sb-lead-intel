'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-sb-card border-b border-sb-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sb-orange rounded flex items-center justify-center">
            <span className="text-sb-bg font-bold">S</span>
          </div>
          <span className="font-bold text-lg">SB Lead Intel</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-sb-text-secondary hover:text-sb-orange transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="text-sm text-sb-text-secondary hover:text-sb-orange transition-colors"
          >
            Leads
          </Link>
          <Link
            href="/"
            className="text-sm text-sb-text-secondary hover:text-sb-orange transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
