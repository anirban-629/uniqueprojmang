import React from 'react';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BookOpen, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@flowline/ui';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface DecisionsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function DecisionsPage({ params }: DecisionsPageProps) {
  const { projectId } = await params;
  const [project, decisions] = await Promise.all([
    apiClient.getProject(projectId),
    apiClient.getDecisions(projectId)
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Decision Log (ADR)</h1>
            <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              {decisions.length} Active Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Architectural Decision Records for {project.name} &bull; Documenting scaling decisions for 1M+ users
          </p>
        </div>
      </div>

      {/* ADR List */}
      <div className="space-y-4">
        {decisions.map((adr) => (
          <Card key={adr.id} className="border-slate-800 bg-slate-900/40 backdrop-blur-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                  {adr.code}
                </span>
                <h3 className="text-base font-bold text-white">{adr.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Date: {adr.date}</span>
                <span className="rounded px-2 py-0.5 font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {adr.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/60 space-y-1.5">
                <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">Context</span>
                <p className="text-slate-300 leading-relaxed">{adr.context}</p>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/60 space-y-1.5">
                <span className="font-semibold text-indigo-400 uppercase text-[10px] tracking-wider block">Decision</span>
                <p className="text-slate-300 leading-relaxed font-medium">{adr.decision}</p>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800/60 space-y-1.5">
                <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider block">Consequences</span>
                <p className="text-slate-300 leading-relaxed">{adr.consequences}</p>
              </div>
            </div>

            {adr.linkedIssueIds.length > 0 && (
              <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-500">Linked Tickets:</span>
                <div className="flex gap-1.5">
                  {adr.linkedIssueIds.map(key => (
                    <Link
                      key={key}
                      href={`/projects/${projectId}/board`}
                      className="font-mono text-[11px] text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20"
                    >
                      {key}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
