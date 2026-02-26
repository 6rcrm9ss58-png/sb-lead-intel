'use client';

import { useEffect, useState } from 'react';

interface Meeting {
  id: string;
  title: string;
  date: string | null;
  duration: number | null;
  organizer_email: string | null;
  participants: string[];
  transcript_url: string | null;
  overview: string | null;
  action_items: string | null;
  keywords: string[];
}

interface FirefliesData {
  meetings: Meeting[];
  total: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function formatDate(val: string | null): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function FirefliesPanel({ leadId }: { leadId: string }) {
  const [data, setData] = useState<FirefliesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFireflies() {
      try {
        const res = await fetch(`/api/lead/${leadId}/fireflies`);
        if (res.status === 503) {
          setError('not_configured');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('fetch_failed');
      } finally {
        setLoading(false);
      }
    }
    fetchFireflies();
  }, [leadId]);

  if (loading) {
    return (
      <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div style={{ width: 20, height: 20, background: '#6C5CE7', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#6C5CE7' }}>Fireflies</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-sb-border rounded w-3/4" />
          <div className="h-4 bg-sb-border rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error === 'not_configured') {
    return (
      <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 20, height: 20, background: '#6C5CE7', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#6C5CE7' }}>Fireflies</h2>
        </div>
        <p className="text-sb-text-secondary text-sm">Fireflies integration not configured.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 20, height: 20, background: '#6C5CE7', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#6C5CE7' }}>Fireflies</h2>
        </div>
        <p className="text-sb-text-secondary text-sm">Unable to fetch Fireflies data.</p>
      </div>
    );
  }

  return (
    <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div style={{ width: 20, height: 20, background: '#6C5CE7', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#6C5CE7' }}>Fireflies Meetings</h2>
        </div>
        {data.total > 0 && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(108,92,231,0.1)', color: '#6C5CE7' }}>
            {data.total} found
          </span>
        )}
      </div>

      {data.meetings.length === 0 ? (
        <p className="text-sb-text-secondary text-sm">No matching meetings found in Fireflies.</p>
      ) : (
        <div className="space-y-2">
          {data.meetings.map((meeting) => (
            <a
              key={meeting.id}
              href={meeting.transcript_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-sb-bg rounded-lg border border-sb-border hover:border-purple-400 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-sm font-medium text-sb-text truncate">{meeting.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-sb-text-secondary">
                    <span>{formatDate(meeting.date)}</span>
                    {meeting.duration && <span>{formatDuration(meeting.duration)}</span>}
                  </div>
                </div>
                <span style={{ color: '#6C5CE7', fontSize: 14 }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
