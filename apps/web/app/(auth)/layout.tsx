import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 overflow-hidden">
      {/* Background ambient lighting gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2.5 z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-90">
          Flowline
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md z-10">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 z-10">
        Protected by RS256 token verification & multi-tenant isolation.
      </div>
    </div>
  );
}
