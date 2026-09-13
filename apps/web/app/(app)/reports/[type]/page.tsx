import React from 'react';
import { ReportsClient } from './reports-client';
import { Sparkles } from 'lucide-react';

interface ReportsPageProps {
  params: Promise<{ type: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { type } = await params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Engineering Reports &amp; Analytics</h1>
            <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              Sprint 41
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recharts components are lazy-loaded via <code className="font-mono text-indigo-300">next/dynamic</code> to maintain the &lt;150KB initial JS budget.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dynamic chunk split verified</span>
        </div>
      </div>

      <ReportsClient type={type || 'burndown'} />
    </div>
  );
}
