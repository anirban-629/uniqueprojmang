import React from 'react';
import { apiClient } from '@/lib/api';
import { Cpu, Zap, CheckCircle2, Play, Plus, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@flowline/ui';

export const dynamic = 'force-dynamic';

export default async function AutomationPage() {
  const automations = await apiClient.getAutomations('proj-flow');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Automation Engine</h1>
            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              Active Rules
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Event-driven rules executed asynchronously upon issue mutations and status transitions.
          </p>
        </div>

        <Button variant="primary" size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create Automation Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {automations.map((rule) => (
          <Card key={rule.id} className="border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{rule.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{rule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 font-semibold">
                  Enabled
                </span>
                <span className="text-slate-500">
                  Executed {rule.executionCount.toLocaleString()} times
                </span>
              </div>
            </div>

            {/* Rule Logic Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trigger</span>
                <div className="font-mono text-xs text-indigo-300 font-semibold">{rule.trigger}</div>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Condition</span>
                <code className="font-mono text-[11px] text-amber-300 block truncate">{rule.condition}</code>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</span>
                <code className="font-mono text-[11px] text-emerald-300 block truncate">{rule.action}</code>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Last run: {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : 'Recent'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Play className="w-3 h-3" /> Test Run
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
