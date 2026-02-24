'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import LeadCard from '@/components/LeadCard';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  const applyFilters = useCallback(() => {
    let filtered = leads;

    if (activeFilter === 'hot') {
      filtered = filtered.filter((lead) => lead.lead_score >= 50);
    } else if (activeFilter === 'warm') {
      filtered = filtered.filter((lead) => lead.lead_score >= 20 && lead.lead_score < 50);
    } else if (activeFilter === 'cold') {
      filtered = filtered.filter((lead) => lead.lead_score < 20);
    }

    setFilteredLeads(filtered);
  }, [leads, activeFilter]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  async function fetchLeads() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const hotLeads = leads.filter((l) => l.lead_score >= 50).length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.lead_score, 0) / leads.length) : 0;
  const sourcesCount = new Set(leads.map((l) => l.lead_source)).size;

  return (
    <div className="min-h-screen bg-sb-bg">
      <Navbar />

      <main className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-sb-text mb-2">Lead Intelligence</h1>
            <p className="text-sb-text-secondary mb-4">AI-powered lead scoring and research</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-sb-orange to-sb-orange-light text-white rounded-full text-xs font-semibold">
              <span>⚡</span>
              Powered by SB Research
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-sb-card rounded-xl shadow-card p-6">
              <p className="text-xs font-semibold text-sb-text-secondary uppercase tracking-wide mb-2">
                Total Leads
              </p>
              <p className="text-[28px] font-bold text-sb-text">
                {leads.length}
              </p>
            </div>
            <div className="bg-sb-card rounded-xl shadow-card p-6">
              <p className="text-xs font-semibold text-sb-text-secondary uppercase tracking-wide mb-2">
                Hot Leads (50+)
              </p>
              <p className="text-[28px] font-bold text-sb-success">
                {hotLeads}
              </p>
            </div>
            <div className="bg-sb-card rounded-xl shadow-card p-6">
              <p className="text-xs font-semibold text-sb-text-secondary uppercase tracking-wide mb-2">
                Avg Score
              </p>
              <p className="text-[28px] font-bold text-sb-orange">
                {avgScore}
              </p>
            </div>
            <div className="bg-sb-card rounded-xl shadow-card p-6">
              <p className="text-xs font-semibold text-sb-text-secondary uppercase tracking-wide mb-2">
                Sources
              </p>
              <p className="text-[28px] font-bold text-sb-text">
                {sourcesCount}
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-8 flex gap-3">
            {[
              { id: 'all', label: 'All Leads' },
              { id: 'hot', label: 'Hot 50+' },
              { id: 'warm', label: 'Warm 20-49' },
              { id: 'cold', label: 'Cold <20' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as 'all' | 'hot' | 'warm' | 'cold')}
                className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                  activeFilter === filter.id
                    ? 'bg-sb-text text-white'
                    : 'bg-sb-card border border-sb-border text-sb-text-secondary hover:border-sb-orange'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Leads Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sb-text-secondary">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sb-text-secondary text-center">
                {activeFilter !== 'all' ? 'No leads match this filter' : 'No leads yet. Waiting for data...'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
