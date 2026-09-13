import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '@flowline/ui';
import { Settings, Shield, Globe, Cpu, Database, Bell, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Flowline workspace scaling parameters, edge headers, and telemetry thresholds.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Scale Parameters */}
        <Card className="border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <span>High-Concurrency Parameters (1M Scale)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Default List Page Limit</label>
              <Input defaultValue="50" disabled className="bg-slate-950 font-mono text-xs" />
              <span className="text-[10px] text-slate-500 mt-1 block">Bounded cursor slice size</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Initial JS Target Budget</label>
              <Input defaultValue="150 KB gzipped" disabled className="bg-slate-950 font-mono text-xs" />
              <span className="text-[10px] text-slate-500 mt-1 block">Enforced in CI bundle budget</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Edge Runtime Deployment</label>
              <Input defaultValue="fra1 (Frankfurt Edge Gateway)" disabled className="bg-slate-950 font-mono text-xs" />
              <span className="text-[10px] text-slate-500 mt-1 block">Middleware + SSE endpoint</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">In-Memory Mock Database Scale</label>
              <Input defaultValue="50,000 Indexed Issues" disabled className="bg-slate-950 font-mono text-xs" />
              <span className="text-[10px] text-slate-500 mt-1 block">Deterministic seed generator</span>
            </div>
          </div>
        </Card>

        {/* Real-time Streaming Configuration */}
        <Card className="border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Globe className="w-4 h-4" />
            <span>Real-time Sync Transport</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <div className="font-semibold text-white">Edge Server-Sent Events (SSE)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Route <code className="text-indigo-300">/api/realtime</code> streams instant card movements and updates
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 font-bold text-[11px]">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div>
                <div className="font-semibold text-white">Exponential Backoff Auto-Reconnect</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Gracefully recovers dropped connections up to 15s delay before fallback polling
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 font-bold text-[11px]">
                Active
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
