'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface LeadWithReport extends Lead {
  report?: Report | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' },
  { id: 'contacted', label: 'Contacted', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.25)' },
  { id: 'demo_scheduled', label: 'Demo Scheduled', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' },
  { id: 'proposal', label: 'Proposal Sent', color: '#F97316', bgColor: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.25)' },
  { id: 'negotiation', label: 'Negotiation', color: '#EC4899', bgColor: 'rgba(236,72,153,0.08)', borderColor: 'rgba(236,72,153,0.25)' },
  { id: 'closed_won', label: 'Closed Won', color: '#22C55E', bgColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' },
  { id: 'closed_lost', label: 'Closed Lost', color: '#EF4444', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' },
];

type ViewMode = 'kanban' | 'table' | 'rep';

function getScoreColor(score: number): string {
  if (score > 80) return '#22C55E';
  if (score > 50) return '#F59E0B';
  return '#EF4444';
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadWithReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [repFilter, setRepFilter] = useState<string>('all');
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .not('assigned_to_name', 'is', null)
        .order('assigned_at', { ascending: false });

      if (leadsError) throw leadsError;

      const { data: reportsData } = await supabase.from('reports').select('*');

      const reportsMap: Record<string, Report> = {};
      if (reportsData) {
        for (const r of reportsData) {
          reportsMap[r.lead_id] = r;
        }
      }

      const merged: LeadWithReport[] = (leadsData || []).map((lead) => ({
        ...lead,
        report: reportsMap[lead.id] || null,
      }));

      setLeads(merged);
    } catch (err) {
      console.error('Pipeline fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique sales reps
  const reps = Array.from(new Set(leads.map((l) => l.assigned_to_name).filter(Boolean))) as string[];

  // Filter by rep
  const filteredLeads = repFilter === 'all' ? leads : leads.filter((l) => l.assigned_to_name === repFilter);

  // Group leads by pipeline stage
  const stageLeads: Record<string, LeadWithReport[]> = {};
  for (const stage of PIPELINE_STAGES) {
    stageLeads[stage.id] = filteredLeads.filter((l) => l.pipeline_stage === stage.id);
  }

  // Handle drag and drop to change pipeline stage
  async function handleDrop(leadId: string, newStage: string) {
    try {
      const res = await fetch(`/api/lead/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      if (!res.ok) throw new Error('Stage update failed');
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage } : l))
      );
    } catch (err) {
      console.error('Pipeline stage update error:', err);
    }
    setDraggedLead(null);
  }

  // Stats
  const totalPipeline = filteredLeads.filter((l) => !['closed_won', 'closed_lost', 'unassigned'].includes(l.pipeline_stage)).length;
  const wonCount = filteredLeads.filter((l) => l.pipeline_stage === 'closed_won').length;
  const activeDeals = filteredLeads.filter((l) => ['demo_scheduled', 'proposal', 'negotiation'].includes(l.pipeline_stage)).length;
  const avgScore = filteredLeads.length > 0
    ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.report?.opportunity_score ?? l.lead_score), 0) / filteredLeads.length)
    : 0;

  return (
    <div className="min-h-screen bg-sb-bg">
      <Navbar />

      <main className="pt-8 pb-12">
        <div style={{ maxWidth: 1400 }} className="mx-auto px-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1>Sales Pipeline</h1>
              <p className="text-[15px] text-sb-text-secondary">
                Track lead assignments and deal progression across your sales team
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              {(['kanban', 'table', 'rep'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    viewMode === mode
                      ? 'bg-sb-orange text-white'
                      : 'bg-sb-card border border-sb-border text-sb-text-secondary hover:text-sb-text'
                  }`}
                >
                  {mode === 'kanban' ? 'Board' : mode === 'table' ? 'Table' : 'By Rep'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="In Pipeline" value={totalPipeline} sub="active leads" color="var(--sb-text)" />
            <StatCard label="Active Deals" value={activeDeals} sub="demo+ stage" color="#F97316" />
            <StatCard label="Closed Won" value={wonCount} sub="deals" color="#22C55E" />
            <StatCard label="Avg Score" value={avgScore} sub="opportunity" color="#F59E0B" />
          </div>

          {/* Rep Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setRepFilter('all')}
              className={`filter-btn flex-shrink-0 ${repFilter === 'all' ? 'active' : ''}`}
            >
              All Reps ({leads.length})
            </button>
            {reps.map((rep) => {
              const count = leads.filter((l) => l.assigned_to_name === rep).length;
              return (
                <button
                  key={rep}
                  onClick={() => setRepFilter(rep)}
                  className={`filter-btn flex-shrink-0 ${repFilter === rep ? 'active' : ''}`}
                >
                  {rep.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-sb-text-secondary">Loading pipeline...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-sb-text-secondary mb-2">No leads assigned to the pipeline yet.</p>
              <p className="text-sm text-sb-text-tertiary">
                Go to a{' '}
                <Link href="/" className="text-sb-orange hover:underline">
                  lead detail page
                </Link>{' '}
                and assign a salesperson to get started.
              </p>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanView
              stageLeads={stageLeads}
              draggedLead={draggedLead}
              setDraggedLead={setDraggedLead}
              handleDrop={handleDrop}
            />
          ) : viewMode === 'table' ? (
            <TableView leads={filteredLeads} />
          ) : (
            <RepView leads={filteredLeads} reps={reps} />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="section-card" style={{ marginBottom: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sb-text-secondary)', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1, marginBottom: 2 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--sb-text-tertiary)', marginBottom: 0 }}>{sub}</p>
    </div>
  );
}

// ─── Kanban View ───────────────────────────────────────────────────
function KanbanView({
  stageLeads,
  draggedLead,
  setDraggedLead,
  handleDrop,
}: {
  stageLeads: Record<string, LeadWithReport[]>;
  draggedLead: string | null;
  setDraggedLead: (id: string | null) => void;
  handleDrop: (leadId: string, stage: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
      {PIPELINE_STAGES.map((stage) => {
        const leads = stageLeads[stage.id] || [];
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 rounded-xl border transition-colors"
            style={{
              width: 260,
              backgroundColor: draggedLead ? stage.bgColor : 'var(--sb-card)',
              borderColor: draggedLead ? stage.borderColor : 'var(--sb-border)',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = stage.color;
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = draggedLead ? stage.borderColor : 'var(--sb-border)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--sb-border)';
              if (draggedLead) handleDrop(draggedLead, stage.id);
            }}
          >
            {/* Column Header */}
            <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--sb-border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs font-semibold text-sb-text">{stage.label}</span>
              </div>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: stage.bgColor, color: stage.color }}
              >
                {leads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2" style={{ minHeight: 80 }}>
              {leads.length === 0 ? (
                <p className="text-[11px] text-sb-text-tertiary text-center py-4">
                  Drop leads here
                </p>
              ) : (
                leads.map((lead) => (
                  <PipelineCard key={lead.id} lead={lead} onDragStart={() => setDraggedLead(lead.id)} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pipeline Card ─────────────────────────────────────────────────
function PipelineCard({ lead, onDragStart }: { lead: LeadWithReport; onDragStart: () => void }) {
  const score = lead.report?.opportunity_score ?? lead.lead_score;

  return (
    <Link
      href={`/lead/${lead.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      className="block p-2.5 bg-white rounded-lg border border-sb-border hover:border-sb-orange transition cursor-grab active:cursor-grabbing"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <p className="text-xs font-semibold text-sb-text truncate mb-1">{lead.company}</p>
      <p className="text-[11px] text-sb-text-secondary truncate mb-2">{lead.contact_name}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: getScoreColor(score) }}
          />
          <span className="text-[10px] font-medium" style={{ color: getScoreColor(score) }}>
            {score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {lead.assigned_to_name && (
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', fontSize: 8 }}
              title={lead.assigned_to_name}
            >
              {getInitials(lead.assigned_to_name)}
            </div>
          )}
          <span className="text-[10px] text-sb-text-tertiary">{timeAgo(lead.assigned_at)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Table View ────────────────────────────────────────────────────
function TableView({ leads }: { leads: LeadWithReport[] }) {
  const stageInfo = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, s]));

  return (
    <div className="bg-sb-card rounded-xl border border-sb-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sb-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Company</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Contact</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Assigned To</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Stage</th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Score</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Robot</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-sb-text-secondary">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const score = lead.report?.opportunity_score ?? lead.lead_score;
              const stage = stageInfo[lead.pipeline_stage] || { label: lead.pipeline_stage, color: '#999', bgColor: 'rgba(153,153,153,0.1)' };
              return (
                <tr key={lead.id} className="border-b border-sb-border hover:bg-sb-bg transition">
                  <td className="px-4 py-3">
                    <Link href={`/lead/${lead.id}`} className="text-sb-orange font-medium hover:underline">
                      {lead.company}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sb-text-secondary">
                    <div>{lead.contact_name}</div>
                    <div className="text-[11px] text-sb-text-tertiary">{lead.job_title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {lead.assigned_to_name && (
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', fontSize: 9 }}
                        >
                          {getInitials(lead.assigned_to_name)}
                        </div>
                      )}
                      <span className="text-sb-text text-xs">{lead.assigned_to_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[11px] font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: stage.bgColor, color: stage.color }}
                    >
                      {stage.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-xs" style={{ color: getScoreColor(score) }}>
                      {score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-sb-text-secondary">
                    {lead.report?.recommended_robot || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-sb-text-tertiary">{timeAgo(lead.assigned_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Rep View ──────────────────────────────────────────────────────
function RepView({ leads, reps }: { leads: LeadWithReport[]; reps: string[] }) {
  return (
    <div className="space-y-6">
      {reps.map((rep) => {
        const repLeads = leads.filter((l) => l.assigned_to_name === rep);
        const activeCount = repLeads.filter((l) => !['closed_won', 'closed_lost', 'unassigned'].includes(l.pipeline_stage)).length;
        const wonCount = repLeads.filter((l) => l.pipeline_stage === 'closed_won').length;
        const avgScore = repLeads.length > 0
          ? Math.round(repLeads.reduce((sum, l) => sum + (l.report?.opportunity_score ?? l.lead_score), 0) / repLeads.length)
          : 0;

        return (
          <div key={rep} className="bg-sb-card rounded-xl border border-sb-border overflow-hidden">
            {/* Rep Header */}
            <div className="px-5 py-4 border-b border-sb-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                  {getInitials(rep)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-sb-text">{rep}</p>
                  <p className="text-[11px] text-sb-text-secondary">{repLeads.length} leads assigned</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <p className="font-bold text-sb-text">{activeCount}</p>
                  <p className="text-sb-text-tertiary">Active</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: '#22C55E' }}>{wonCount}</p>
                  <p className="text-sb-text-tertiary">Won</p>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: '#F59E0B' }}>{avgScore}</p>
                  <p className="text-sb-text-tertiary">Avg Score</p>
                </div>
              </div>
            </div>

            {/* Rep's Leads */}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {repLeads.map((lead) => {
                const score = lead.report?.opportunity_score ?? lead.lead_score;
                const stage = PIPELINE_STAGES.find((s) => s.id === lead.pipeline_stage);
                return (
                  <Link
                    key={lead.id}
                    href={`/lead/${lead.id}`}
                    className="p-3 bg-sb-bg rounded-lg border border-sb-border hover:border-sb-orange transition"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-semibold text-sb-text truncate flex-1 mr-2">{lead.company}</p>
                      <span className="font-bold text-[11px]" style={{ color: getScoreColor(score) }}>
                        {score}
                      </span>
                    </div>
                    <p className="text-[11px] text-sb-text-secondary truncate mb-2">{lead.contact_name}</p>
                    {stage && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: stage.bgColor, color: stage.color }}
                      >
                        {stage.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
