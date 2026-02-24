'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import LeadCard from '@/components/LeadCard';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface LeadWithReport extends Lead {
  report?: Report | null;
  sources_count?: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FilterId = 'all' | 'hot' | 'warm' | 'cold' | 'thor' | 'core' | 'spark';

export default function Dashboard() {
  const [leads, setLeads] = useState<LeadWithReport[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadWithReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get the effective score for a lead (opportunity_score from report, or lead_score fallback)
  const getScore = (lead: LeadWithReport) => lead.report?.opportunity_score ?? lead.lead_score;

  const applyFilters = useCallback(() => {
    let filtered = leads;

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((lead) => {
        const fields = [
          lead.company,
          lead.contact_name,
          lead.job_title,
          lead.email,
          lead.use_case,
          lead.state,
          lead.country,
          lead.lead_source,
          lead.tell_us_more,
          lead.report?.recommended_robot,
        ];
        return fields.some((f) => f && f.toLowerCase().includes(q));
      });
    }

    // Apply category filter
    if (activeFilter === 'hot') {
      filtered = filtered.filter((lead) => getScore(lead) > 80);
    } else if (activeFilter === 'warm') {
      filtered = filtered.filter((lead) => {
        const s = getScore(lead);
        return s > 50 && s <= 80;
      });
    } else if (activeFilter === 'cold') {
      filtered = filtered.filter((lead) => getScore(lead) <= 50);
    } else if (activeFilter === 'thor') {
      filtered = filtered.filter((lead) => lead.report?.recommended_robot?.toLowerCase().includes('thor'));
    } else if (activeFilter === 'core') {
      filtered = filtered.filter((lead) =>
        lead.report?.recommended_robot?.toLowerCase().includes('core') ||
        lead.report?.recommended_robot?.toLowerCase().includes('ro1')
      );
    } else if (activeFilter === 'spark') {
      filtered = filtered.filter((lead) => lead.report?.recommended_robot?.toLowerCase().includes('spark'));
    }

    setFilteredLeads(filtered);
  }, [leads, activeFilter, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  async function fetchLeads() {
    try {
      setLoading(true);

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch all reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*');

      // Fetch sources counts per lead
      const { data: sourcesData } = await supabase
        .from('sources')
        .select('lead_id');

      // Build sources count map
      const sourcesCountMap: Record<string, number> = {};
      if (sourcesData) {
        for (const s of sourcesData) {
          sourcesCountMap[s.lead_id] = (sourcesCountMap[s.lead_id] || 0) + 1;
        }
      }

      // Build reports map
      const reportsMap: Record<string, Report> = {};
      if (reportsData) {
        for (const r of reportsData) {
          reportsMap[r.lead_id] = r;
        }
      }

      // Merge
      const merged: LeadWithReport[] = (leadsData || []).map((lead) => ({
        ...lead,
        report: reportsMap[lead.id] || null,
        sources_count: sourcesCountMap[lead.id] || 0,
      }));

      setLeads(merged);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats using opportunity_score where available
  const scores = leads.map((l) => getScore(l));
  const hotLeads = scores.filter((s) => s > 80).length;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalSources = leads.reduce((sum, l) => sum + (l.sources_count || 0), 0);

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All Leads' },
    { id: 'hot', label: 'Hot 80+' },
    { id: 'warm', label: 'Warm 51-80' },
    { id: 'cold', label: 'Cold ≤50' },
    { id: 'thor', label: 'Thor' },
    { id: 'core', label: 'Core/RO1' },
    { id: 'spark', label: 'Spark' },
  ];

  return (
    <div className="min-h-screen bg-sb-bg">
      <Navbar />

      <main className="pt-10 pb-12">
        <div style={{ maxWidth: 1200 }} className="mx-auto px-10">
          {/* Header */}
          <div className="mb-8">
            <h1>Lead Intelligence</h1>
            <p className="text-[15px] text-sb-text-secondary mb-3">AI-powered lead scoring and research for Standard Bots</p>
            <span className="powered-badge">
              <span style={{ fontSize: 11 }}>⚡</span>
              Powered by SB Research
            </span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="section-card" style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sb-text-secondary)', marginBottom: 6 }}>
                Total Leads
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--sb-text)', lineHeight: 1.1, marginBottom: 2 }}>
                {leads.length}
              </p>
              <p style={{ fontSize: 12, color: 'var(--sb-text-tertiary)', marginBottom: 0 }}>in pipeline</p>
            </div>
            <div className="section-card" style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sb-text-secondary)', marginBottom: 6 }}>
                Hot Leads
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--sb-success)', lineHeight: 1.1, marginBottom: 2 }}>
                {hotLeads}
              </p>
              <p style={{ fontSize: 12, color: 'var(--sb-text-tertiary)', marginBottom: 0 }}>score {'>'} 80</p>
            </div>
            <div className="section-card" style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sb-text-secondary)', marginBottom: 6 }}>
                Avg Score
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--sb-orange)', lineHeight: 1.1, marginBottom: 2 }}>
                {avgScore}
              </p>
              <p style={{ fontSize: 12, color: 'var(--sb-text-tertiary)', marginBottom: 0 }}>opportunity</p>
            </div>
            <div className="section-card" style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sb-text-secondary)', marginBottom: 6 }}>
                Sources
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--sb-text)', lineHeight: 1.1, marginBottom: 2 }}>
                {totalSources}
              </p>
              <p style={{ fontSize: 12, color: 'var(--sb-text-tertiary)', marginBottom: 0 }}>citations</p>
            </div>
          </div>

          {/* Search + Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="relative flex-shrink-0" style={{ width: 300 }}>
              <svg
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--sb-text-tertiary)' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  fontSize: 14,
                  border: '1px solid var(--sb-border)',
                  borderRadius: 8,
                  backgroundColor: 'white',
                  color: 'var(--sb-text)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--sb-orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--sb-border)')}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text-tertiary)',
                    fontSize: 16, lineHeight: 1, padding: 4,
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sb-text-secondary">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sb-text-secondary text-center">
                {searchQuery ? `No leads match "${searchQuery}"` : activeFilter !== 'all' ? 'No leads match this filter' : 'No leads yet. Waiting for data...'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} report={lead.report} sourcesCount={lead.sources_count || 0} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
