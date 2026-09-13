'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton } from '@flowline/ui';
import { Sparkles } from 'lucide-react';

// Code-split heavy Recharts visualizations out of main bundle in Client Component
const BurndownChart = dynamic(
  () => import('@/components/charts/lazy-charts').then(mod => mod.BurndownChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[340px] w-full rounded-xl" />
  }
);

const VelocityChart = dynamic(
  () => import('@/components/charts/lazy-charts').then(mod => mod.VelocityChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[340px] w-full rounded-xl" />
  }
);

const CumulativeFlowChart = dynamic(
  () => import('@/components/charts/lazy-charts').then(mod => mod.CumulativeFlowChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[340px] w-full rounded-xl" />
  }
);

export function ReportsClient({ type }: { type: string }) {
  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <Link
          href="/reports/burndown"
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            type === 'burndown' || !type
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Sprint Burn-down
        </Link>
        <Link
          href="/reports/velocity"
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            type === 'velocity'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Team Velocity
        </Link>
        <Link
          href="/reports/cfd"
          className={`rounded-lg px-3 py-1.5 transition-colors ${
            type === 'cfd'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Cumulative Flow
        </Link>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold text-white">
                {type === 'velocity'
                  ? 'Historical Sprint Velocity (Points Completed)'
                  : type === 'cfd'
                  ? 'Cumulative Flow Diagram (Work-In-Progress Stability)'
                  : 'Sprint 41 Burn-Down (Actual vs Ideal Trajectory)'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {type === 'velocity'
                  ? 'Committed points vs actual delivered points across consecutive iterations'
                  : type === 'cfd'
                  ? 'Visualizes bottlenecks by measuring widening gaps between status phases'
                  : 'Tracking remaining story points to zero over 14-day cadence'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {type === 'velocity' ? (
                <VelocityChart />
              ) : type === 'cfd' ? (
                <CumulativeFlowChart />
              ) : (
                <BurndownChart />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Metrics Card */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/40 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Sprint Insights</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Committed Scope</span>
                <span className="font-bold text-white">68 pts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Completed so far</span>
                <span className="font-bold text-emerald-400">42 pts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Remaining</span>
                <span className="font-bold text-amber-400">26 pts</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Projected Completion</span>
                <span className="font-bold text-indigo-400">On Track (96%)</span>
              </div>
            </div>
          </Card>

          <Card className="border-indigo-500/20 bg-indigo-950/20 p-5">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Scale-Ready Architecture</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Because Recharts is isolated into an asynchronous dynamic chunk, users opening the Board or Backlog never pay the JS bundle penalty for graphing libraries.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
