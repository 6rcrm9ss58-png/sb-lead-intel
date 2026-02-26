'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import CompanyHeader from '@/components/CompanyHeader';
import RobotRecommendation from '@/components/RobotRecommendation';
import OpportunityList from '@/components/OpportunityList';
import TalkingPoints from '@/components/TalkingPoints';
import HubSpotPanel from '@/components/HubSpotPanel';
import FirefliesPanel from '@/components/FirefliesPanel';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Source = Database['public']['Tables']['sources']['Row'];

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Loading Skeleton ──────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-8 my-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-sb-card rounded-xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="h-6 bg-sb-border rounded w-48 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-sb-border rounded w-full" />
                <div className="h-4 bg-sb-border rounded w-5/6" />
                <div className="h-4 bg-sb-border rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-sb-card rounded-xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="h-6 bg-sb-border rounded w-32 mb-4" />
            <div className="h-24 bg-sb-border rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Processing Spinner ────────────────────────────────────────────
function ProcessingBanner({ status }: { status: string }) {
  const messages: Record<string, string> = {
    pending: 'Waiting in queue...',
    validating: 'Validating lead data...',
    researching: 'Researching company & generating report...',
  };

  return (
    <div className="bg-sb-card border border-sb-orange/30 rounded-xl p-6 my-8 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="h-8 w-8 border-2 border-sb-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <div>
        <p className="text-sb-text font-medium">
          {messages[status] || 'Processing...'}
        </p>
        <p className="text-sm text-sb-text-secondary mt-1">
          This page will automatically refresh when the report is ready.
        </p>
      </div>
    </div>
  );
}

// ─── Safe JSON parse helper ────────────────────────────────────────
function safeParseJSON<T>(val: string | null | undefined): T | null {
  if (!val) return null;
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return parsed as T;
  } catch {
    return null;
  }
}

// ─── Main Page Component ───────────────────────────────────────────
export default function LeadReportPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (silent = false): Promise<Lead | null> => {
    try {
      if (!silent) setLoading(true);

      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', params.id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('lead_id', params.id)
        .single();

      if (reportError && reportError.code !== 'PGRST116') {
        console.error('Report fetch error:', reportError);
      }
      setReport(reportData || null);

      const { data: sourcesData, error: sourcesError } = await supabase
        .from('sources')
        .select('*')
        .eq('lead_id', params.id)
        .order('created_at', { ascending: false });

      if (sourcesError) throw sourcesError;
      setSources(sourcesData || []);

      return leadData;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [params.id]);

  // Initial fetch + auto-refresh while processing
  useEffect(() => {
    fetchData().then((leadData) => {
      if (leadData && ['pending', 'validating', 'researching'].includes(leadData.status)) {
        pollRef.current = setInterval(async () => {
          const updated = await fetchData(true);
          if (updated && !['pending', 'validating', 'researching'].includes(updated.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 5000);
      }
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  // ─── Actions ───────────────────────────────────────────────────
  const handleReprocess = async () => {
    if (!lead) return;
    setReprocessing(true);
    try {
      const res = await fetch(`/api/lead/${lead.id}/reprocess`, { method: 'POST' });
      if (!res.ok) throw new Error('Reprocess failed');
      // Start polling
      pollRef.current = setInterval(async () => {
        const updated = await fetchData(true);
        if (updated && !['pending', 'validating', 'researching'].includes(updated.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setReprocessing(false);
        }
      }, 5000);
      await fetchData(true);
    } catch (error) {
      console.error('Reprocess error:', error);
      setReprocessing(false);
    }
  };

  const handleStatusOverride = async (newStatus: string) => {
    if (!lead) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/lead/${lead.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      await fetchData(true);
    } catch (error) {
      console.error('Status override error:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-sb-bg text-sb-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link href="/" className="text-sb-orange hover:text-sb-orange/80 mb-8 inline-block">
            ← Back to Dashboard
          </Link>
          {/* Skeleton header */}
          <div className="animate-pulse">
            <div className="bg-sb-card rounded-xl p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-sb-border rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-sb-border rounded w-64" />
                  <div className="h-4 bg-sb-border rounded w-48" />
                  <div className="h-4 bg-sb-border rounded w-32" />
                </div>
              </div>
            </div>
          </div>
          <ReportSkeleton />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-sb-bg text-sb-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
          <Link href="/" className="text-sb-orange hover:text-sb-orange/80 mb-8 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="text-center py-24">
            <p className="text-sb-text-secondary text-lg">Lead not found</p>
            <p className="text-sm text-sb-text-secondary mt-2">
              The lead may have been deleted or the ID is invalid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isProcessing = ['pending', 'validating', 'researching'].includes(lead.status);
  const isInvalid = lead.status === 'invalid';

  // Parse news for structured rendering
  type NewsItem = { title: string; url: string; source: string; date?: string };
  const newsItems = safeParseJSON<NewsItem[]>(report?.recent_news);

  return (
    <div className="min-h-screen bg-sb-bg text-sb-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sb-orange hover:text-sb-orange/80 font-medium">
            ← Back to Dashboard
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Reprocess Button */}
            {(lead.status === 'complete' || lead.status === 'invalid') && (
              <button
                onClick={handleReprocess}
                disabled={reprocessing}
                className="px-4 py-2 bg-sb-card border border-sb-border rounded-lg text-sm font-medium hover:border-sb-orange transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {reprocessing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-sb-orange border-t-transparent rounded-full animate-spin" />
                    Reprocessing...
                  </>
                ) : (
                  <>↻ Rerun Research</>
                )}
              </button>
            )}

            {/* Status Override */}
            {isInvalid && (
              <button
                onClick={() => handleStatusOverride('pending')}
                disabled={statusUpdating}
                className="px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-lg text-sm font-medium text-green-400 hover:bg-green-900/50 transition disabled:opacity-50"
              >
                Mark as Valid
              </button>
            )}
            {lead.status === 'complete' && (
              <button
                onClick={() => handleStatusOverride('invalid')}
                disabled={statusUpdating}
                className="px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/50 transition disabled:opacity-50"
              >
                Mark as Invalid
              </button>
            )}
          </div>
        </div>

        {/* Company Header */}
        <CompanyHeader lead={lead} report={report} />

        {/* Invalid Lead Message */}
        {isInvalid && (
          <div className="bg-sb-error/10 border border-sb-error/30 rounded-xl p-6 my-8">
            <h3 className="text-sb-error font-bold mb-2">Lead Marked Invalid</h3>
            {lead.validation_errors ? (
              <p className="text-sb-error/80 text-sm">{lead.validation_errors}</p>
            ) : (
              <p className="text-sb-error/80 text-sm">
                This lead did not pass validation. You can override this by clicking &ldquo;Mark as Valid&rdquo; above.
              </p>
            )}
          </div>
        )}

        {/* Processing State */}
        {isProcessing && <ProcessingBanner status={lead.status} />}

        {/* Lead Description */}
        {lead.tell_us_more && (
          <div className="bg-sb-card rounded-xl shadow-card p-6 my-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 className="text-xl font-bold text-sb-orange mb-3">Lead Description</h2>
            <p className="text-sb-text-secondary leading-relaxed">{lead.tell_us_more}</p>
          </div>
        )}

        {/* Main Report Content */}
        {!report && !isProcessing && !isInvalid ? (
          <div className="bg-sb-card border border-sb-border rounded-xl p-8 my-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p className="text-sb-text-secondary mb-2">No report generated yet.</p>
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              className="mt-4 px-6 py-2 bg-sb-orange text-white rounded-lg font-medium hover:bg-sb-orange/90 transition disabled:opacity-50"
            >
              {reprocessing ? 'Processing...' : 'Generate Report'}
            </button>
          </div>
        ) : report ? (
          <>
            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
              {/* Left Column - Wider */}
              <div className="lg:col-span-2 space-y-6">
                {/* Company Summary */}
                {report.company_summary && (
                  <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h2 className="text-xl font-bold text-sb-orange mb-4">
                      Company Summary
                    </h2>
                    <p className="text-sb-text-secondary leading-relaxed whitespace-pre-line">
                      {report.company_summary}
                    </p>
                  </div>
                )}

                {/* Use Case Analysis */}
                {report.use_case_analysis && (
                  <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h2 className="text-xl font-bold text-sb-orange mb-4">
                      Use Case Analysis
                    </h2>
                    <p className="text-sb-text-secondary leading-relaxed whitespace-pre-line">
                      {report.use_case_analysis}
                    </p>
                  </div>
                )}

                {/* Recent News — structured rendering */}
                {report.recent_news && (
                  <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h2 className="text-xl font-bold text-sb-orange mb-4">
                      Recent News & Events
                    </h2>
                    {newsItems && Array.isArray(newsItems) ? (
                      <div className="space-y-3">
                        {newsItems.map((item, i) => (
                          <a
                            key={i}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-sb-bg rounded border border-sb-border hover:border-sb-orange transition"
                          >
                            <p className="text-sm font-medium text-sb-text">
                              {item.title}
                            </p>
                            <p className="text-xs text-sb-text-secondary mt-1">
                              {item.source}{item.date ? ` · ${item.date}` : ''}
                            </p>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sb-text-secondary leading-relaxed">
                        {report.recent_news}
                      </p>
                    )}
                  </div>
                )}

                {/* Competitor Context */}
                {report.competitor_context && (
                  <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h2 className="text-xl font-bold text-sb-orange mb-4">
                      Competitive Landscape
                    </h2>
                    <p className="text-sb-text-secondary leading-relaxed whitespace-pre-line">
                      {report.competitor_context}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                <RobotRecommendation report={report} />

                {/* Quick Lead Info */}
                <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <h3 className="text-lg font-bold text-sb-orange mb-3">Lead Details</h3>
                  <div className="space-y-2 text-sm">
                    {lead.contact_name && (
                      <div className="flex justify-between">
                        <span className="text-sb-text-secondary">Contact</span>
                        <span className="text-sb-text">{lead.contact_name}</span>
                      </div>
                    )}
                    {lead.job_title && (
                      <div className="flex justify-between">
                        <span className="text-sb-text-secondary">Title</span>
                        <span className="text-sb-text">{lead.job_title}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex justify-between">
                        <span className="text-sb-text-secondary">Email</span>
                        <a href={`mailto:${lead.email}`} className="text-sb-orange hover:underline truncate ml-2">
                          {lead.email}
                        </a>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex justify-between">
                        <span className="text-sb-text-secondary">Phone</span>
                        <a href={`tel:${lead.phone}`} className="text-sb-orange hover:underline">
                          {lead.phone}
                        </a>
                      </div>
                    )}
                    {lead.timeline && (
                      <div className="flex justify-between">
                        <span className="text-sb-text-secondary">Timeline</span>
                        <span className="text-sb-text">{lead.timeline}</span>
                      </div>
                    )}
                    {lead.lead_source && (
                      <div className="flex justify-between">
                        <span className="text-sb-text-secondary">Source</span>
                        <span className="text-sb-text">{lead.lead_source}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Opportunities */}
            {report.additional_opportunities && (
              <div className="my-8">
                <OpportunityList report={report} />
              </div>
            )}

            {/* Talking Points & ROI Angles */}
            {report.talking_points && (
              <div className="my-8">
                <TalkingPoints report={report} />
              </div>
            )}

            {/* Connected Data Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
              <HubSpotPanel leadId={params.id} />
              <FirefliesPanel leadId={params.id} />
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="bg-sb-card rounded-xl shadow-card p-6 my-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h2 className="text-xl font-bold text-sb-orange mb-4">
                  Research Sources
                </h2>
                <div className="space-y-3">
                  {sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 bg-sb-bg rounded border border-sb-border hover:border-sb-orange transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sb-orange truncate">
                          {source.title}
                        </p>
                        {source.description && (
                          <p className="text-xs text-sb-text-secondary mt-1 line-clamp-2">
                            {source.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sb-orange text-lg flex-shrink-0">→</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
