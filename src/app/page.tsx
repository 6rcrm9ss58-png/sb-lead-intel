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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const applyFilters = useCallback(() => {
    let filtered = leads;

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    // Filter by search term (company name or contact name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.company.toLowerCase().includes(term) ||
          lead.contact_name.toLowerCase().includes(term)
      );
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

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
  const stats = {
    total: leads.length,
    pending: leads.filter((l) => l.status === 'pending').length,
    complete: leads.filter((l) => l.status === 'complete').length,
    invalid: leads.filter((l) => l.status === 'invalid').length,
  };

  const statusOptions = [
    { id: 'all', label: 'All Leads' },
    { id: 'pending', label: 'Pending' },
    { id: 'validating', label: 'Validating' },
    { id: 'researching', label: 'Researching' },
    { id: 'complete', label: 'Complete' },
    { id: 'invalid', label: 'Invalid' },
  ];

  return (
    <div className="min-h-screen bg-sb-bg">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-sb-card border border-sb-border rounded-lg p-6">
              <p className="text-sb-text-secondary text-sm font-medium">
                Total Leads
              </p>
              <p className="text-3xl font-bold text-sb-text mt-2">
                {stats.total}
              </p>
            </div>
            <div className="bg-sb-card border border-sb-border rounded-lg p-6">
              <p className="text-sb-text-secondary text-sm font-medium">
                Pending
              </p>
              <p className="text-3xl font-bold text-sb-orange mt-2">
                {stats.pending}
              </p>
            </div>
            <div className="bg-sb-card border border-sb-border rounded-lg p-6">
              <p className="text-sb-text-secondary text-sm font-medium">
                Complete
              </p>
              <p className="text-3xl font-bold text-sb-success mt-2">
                {stats.complete}
              </p>
            </div>
            <div className="bg-sb-card border border-sb-border rounded-lg p-6">
              <p className="text-sb-text-secondary text-sm font-medium">
                Invalid
              </p>
              <p className="text-3xl font-bold text-sb-error mt-2">
                {stats.invalid}
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            <input
              type="text"
              placeholder="Search by company or contact name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-sb-card border border-sb-border rounded-lg text-sb-text placeholder-sb-text-secondary focus:outline-none focus:border-sb-orange transition"
            />

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    setStatusFilter(
                      statusFilter === option.id ? null : option.id
                    )
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    statusFilter === option.id
                      ? 'bg-sb-orange text-sb-bg'
                      : 'bg-sb-card border border-sb-border text-sb-text hover:border-sb-orange'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sb-text-secondary">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sb-text-secondary text-center">
                {searchTerm || statusFilter
                  ? 'No leads match your filters'
                  : 'No leads yet. Waiting for Slack messages...'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
