import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { 
  Layers, 
  Kanban, 
  ListTodo, 
  BarChart3, 
  GitBranch, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@flowline/ui';

export const dynamic = 'force-dynamic';

// Server Component (Default)
export default async function DashboardPage() {
  // Fetch from standalone backend API
  const projects = await apiClient.getProjects();
  const activeProj = projects[0];
  const activeProjId = activeProj?.id || 'proj-flow';

  const [weather, sprints, decisions] = await Promise.all([
    apiClient.getWeatherMapSummaries(),
    activeProj ? apiClient.getSprints(activeProjId) : Promise.resolve([]),
    activeProj ? apiClient.getDecisions(activeProjId) : Promise.resolve([])
  ]);
  const activeSprint = sprints.find(s => s.status === 'active') || sprints[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-purple-950/40 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-300 mb-4">
            <Cpu className="w-3.5 h-3.5" /> High-Concurrency Architecture (1M+ Scale)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Engineering Hub &bull; Flowline Platform
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300 leading-relaxed">
            50,000+ realistic tickets indexed in memory. Experience smooth 60fps virtualization, optimistic updates, and real-time Edge SSE streams across the engineering fleet.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {activeProj ? (
              <>
                <Link href={`/projects/${activeProj.id}/board`}>
                  <Button variant="primary" size="default" className="gap-2">
                    <Kanban className="w-4 h-4" /> Open Active Board
                  </Button>
                </Link>
                <Link href={`/projects/${activeProj.id}/backlog`}>
                  <Button variant="outline" size="default" className="gap-2">
                    <ListTodo className="w-4 h-4" /> 50,000 Issue Backlog
                  </Button>
                </Link>
              </>
            ) : null}
            <Link href="/org/weather-map">
              <Button variant="secondary" size="default" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Org Weather Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-500/20 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Sprint
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeSprint?.name.split('—')[0] || 'Sprint 41'}</div>
            <p className="text-xs text-slate-400 mt-1">
              {activeSprint?.completedPoints} / {activeSprint?.totalPoints} pts completed ({Math.round(((activeSprint?.completedPoints || 0) / (activeSprint?.totalPoints || 1)) * 100)}%)
            </p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${Math.round(((activeSprint?.completedPoints || 0) / (activeSprint?.totalPoints || 1)) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Indexed Tickets
            </CardTitle>
            <Layers className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">50,000+</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Cursor indexed &amp; virtualized
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fleet Health Score
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.round(weather.reduce((acc, w) => acc + w.healthScore, 0) / weather.length)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Across 4 core engineering squads</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active ADR Decisions
            </CardTitle>
            <GitBranch className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{decisions.length}</div>
            <p className="text-xs text-slate-400 mt-1">Enforcing scale-ready constraints</p>
          </CardContent>
        </Card>
      </div>

      {/* Engineering Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Engineering Workspaces</h2>
            <p className="text-xs text-slate-400">Monorepo projects with independent sprint cadences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/projects/${proj.id}/board`}
              className="group block rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: proj.color }}
                  >
                    {proj.key}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </h3>
                    <span className="text-[11px] text-slate-500">{proj.memberCount} engineers</span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>

              <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {proj.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                <span>View Board &amp; Backlog</span>
                <span className="font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Architectural Decisions (ADR) Preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Active Architectural Decision Records</h3>
            <p className="text-xs text-slate-400">Enforcing 1M scale patterns across the monorepo</p>
          </div>
          <Link href="/projects/proj-flow/decisions">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300">
              View All ADRs &rarr;
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {decisions.slice(0, 3).map((adr) => (
            <div
              key={adr.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-indigo-400">{adr.code}</span>
                <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {adr.status.toUpperCase()}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">{adr.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{adr.context}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
