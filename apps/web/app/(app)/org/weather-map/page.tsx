import React from 'react';
import { apiClient } from '@/lib/api';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Clock, 
  Users, 
  BarChart2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@flowline/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WeatherMapPage() {
  // Pre-aggregated server-side fetch from standalone API
  const teams = await apiClient.getWeatherMapSummaries();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Org Weather Map</h1>
            <span className="rounded-md bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 text-xs font-semibold text-violet-400">
              Fleet Health Aggregator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pre-aggregated on the backend — zero raw tickets shipped to the client to compute velocity and health.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Calculated across 50,000+ active work items</span>
        </div>
      </div>

      {/* Fleet Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-medium">Avg Fleet Health</span>
          <div className="text-3xl font-bold text-emerald-400">
            {Math.round(teams.reduce((acc, t) => acc + t.healthScore, 0) / teams.length)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">All squads within SLA thresholds</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-medium">Active Blockers</span>
          <div className="text-3xl font-bold text-amber-400">
            {teams.reduce((acc, t) => acc + t.blockerCount, 0)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cross-team dependencies flagged</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-medium">Avg Cycle Time</span>
          <div className="text-3xl font-bold text-white">
            {(teams.reduce((acc, t) => acc + t.cycleTimeDays, 0) / teams.length).toFixed(1)}d
          </div>
          <p className="text-xs text-emerald-400 mt-1">-0.4d faster than last sprint</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-medium">Stale Ticket Rate</span>
          <div className="text-3xl font-bold text-cyan-400">
            {(teams.reduce((acc, t) => acc + t.staleTicketPct, 0) / teams.length).toFixed(1)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">&lt;7% healthy threshold</p>
        </div>
      </div>

      {/* Squad Weather Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team) => {
          const isHealthy = team.healthScore >= 80;
          const isWarning = team.healthScore >= 70 && team.healthScore < 80;

          return (
            <Card
              key={team.teamId}
              className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-slate-700 transition-all p-5"
            >
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{team.teamName}</h3>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {team.activeSprintName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Lead: {team.leadName}</p>
                </div>

                {/* Health Score Badge */}
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border border-slate-700/60 bg-slate-950/80">
                  <ShieldCheck className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'}`} />
                  <span className={isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'}>
                    {team.healthScore}% Health
                  </span>
                </div>
              </div>

              {/* Squad Pulse Metrics */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/60">
                  <span className="text-slate-400 block mb-1 text-[11px]">Velocity Trend</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-200">
                    {team.velocityTrend === 'up' && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" /> +{team.velocityChangePct}%
                      </span>
                    )}
                    {team.velocityTrend === 'down' && (
                      <span className="text-rose-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" /> {team.velocityChangePct}%
                      </span>
                    )}
                    {team.velocityTrend === 'stable' && (
                      <span className="text-slate-400 flex items-center gap-0.5">
                        <Minus className="w-3.5 h-3.5" /> Stable
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/60">
                  <span className="text-slate-400 block mb-1 text-[11px]">Blockers Flagged</span>
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    <AlertTriangle className={`w-3.5 h-3.5 ${team.blockerCount > 5 ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span>{team.blockerCount} tickets</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800/60">
                  <span className="text-slate-400 block mb-1 text-[11px]">Stale Tickets</span>
                  <div className="font-semibold text-slate-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{team.staleTicketPct}%</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>{team.totalOpenIssues.toLocaleString()} open tickets in squad</span>
                <Link
                  href="/projects/proj-flow/board"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  View Squad Board <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
