import Link from 'next/link';
import { 
  Layers, 
  Zap, 
  Activity, 
  GitBranch, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  Terminal,
  Database,
  BarChart3,
  FileCode2
} from 'lucide-react';
import { Button } from '@flowline/ui';

export const revalidate = 3600; // Static + ISR

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-cyan-500/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Flowline
            </span>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-400">
              1M+ Concurrency Scale
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400 font-medium">
            <Link href="/projects/proj-flow/board" className="hover:text-white transition-colors">Kanban Board</Link>
            <Link href="/projects/proj-flow/backlog" className="hover:text-white transition-colors">50k Backlog</Link>
            <Link href="/org/weather-map" className="hover:text-white transition-colors">Org Weather Map</Link>
            <Link href="/projects/proj-flow/graph" className="hover:text-white transition-colors">Dependency Graph</Link>
            <Link href="/projects/proj-flow/decisions" className="hover:text-white transition-colors">Decision Log</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="gap-2">
                Launch Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-8">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Next.js 15 App Router Architecture &bull; 50,000+ Virtualized Issues
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Project management built for <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">1,000,000+</span> users.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Zero unbounded queries. Strictly cursor-paginated data contracts, sub-150KB initial client JS, 60fps virtualization across 50,000 tickets, and native Edge SSE realtime sync.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects/proj-flow/board">
              <Button variant="primary" size="lg" className="h-12 px-8 text-base shadow-lg shadow-indigo-500/25">
                Explore Live Kanban Board
              </Button>
            </Link>
            <Link href="/projects/proj-flow/backlog">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base border-slate-700 bg-slate-900/60 hover:bg-slate-800">
                Stress-Test 50k Backlog
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Database className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mock Data Scale</span>
            </div>
            <div className="text-3xl font-bold text-white">50,000+</div>
            <p className="text-xs text-slate-400 mt-1">Realistic seeded issues indexed in memory with cursor tokens</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bundle Target</span>
            </div>
            <div className="text-3xl font-bold text-white">&lt; 150 KB</div>
            <p className="text-xs text-slate-400 mt-1">Server Components by default; heavy viz dynamic split</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Frame Budget</span>
            </div>
            <div className="text-3xl font-bold text-white">60 FPS</div>
            <p className="text-xs text-slate-400 mt-1">Virtualized windowing via @tanstack/react-virtual</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Sync</span>
            </div>
            <div className="text-3xl font-bold text-white">Edge SSE</div>
            <p className="text-xs text-slate-400 mt-1">Streaming mutations without heavy polling or external SaaS</p>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Link href="/projects/proj-flow/board" className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-indigo-500/50 hover:bg-slate-900/70 transition-all">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">High-Scale Board</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Drag-and-drop powered by @dnd-kit with instant optimistic cache updates, column virtualization, and real-time tab synchronization.
            </p>
          </Link>

          <Link href="/org/weather-map" className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-violet-500/50 hover:bg-slate-900/70 transition-all">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">Org Weather Map</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Pre-aggregated team health metrics. Calculates velocity, stale ticket ratios, and blocker spikes server-side to keep client payloads lightweight.
            </p>
          </Link>

          <Link href="/projects/proj-flow/graph" className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm hover:border-cyan-500/50 hover:bg-slate-900/70 transition-all">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">Dependency Explorer</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Lazy-loaded React Flow canvas showing issue blockers and critical paths with localized neighborhood expansion to avoid DOM overflow.
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 px-6 py-8 text-center text-xs text-slate-500">
        Flowline Enterprise &bull; Next.js 15 App Router Architecture &bull; Designed for 1M+ Scale
      </footer>
    </div>
  );
}
