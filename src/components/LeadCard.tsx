'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface LeadCardProps {
  lead: Lead;
  report?: Report | null;
  sourcesCount?: number;
}

function getScore(lead: Lead, report?: Report | null): number {
  return report?.opportunity_score ?? lead.lead_score;
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#FF6A00';
  return '#EF4444';
}

function getTemperatureLabel(score: number): string {
  if (score >= 85) return 'Hot';
  if (score >= 70) return 'Warm';
  return 'Cold';
}

function getTemperaturePillStyle(score: number): React.CSSProperties {
  if (score >= 85) return { background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' };
  if (score >= 70) return { background: 'rgba(255,106,0,0.08)', color: '#FF6A00', border: '1px solid rgba(255,106,0,0.2)' };
  return { background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' };
}

/**
 * Extract a clean domain from a website URL for logo lookup.
 * e.g. "https://www.americanbox.com/contact" → "americanbox.com"
 */
function extractDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    let url = website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const hostname = new URL(url).hostname;
    // Strip leading "www."
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function CompanyAvatar({ lead }: { lead: Lead }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const domain = extractDomain(lead.website);
  const initials = (lead.company || 'U').split(/[\s&]+/).map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);

  const logoUrl = domain ? `https://logo.clearbit.com/${domain}?size=80` : null;

  // Show logo if we have a domain and it hasn't failed to load
  if (logoUrl && !logoFailed) {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        background: '#F5F5F7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`${lead.company} logo`}
          width={40}
          height={40}
          style={{ objectFit: 'contain', width: 40, height: 40 }}
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  // Fallback: orange gradient circle with initials
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'linear-gradient(135deg, #FF6A00, #FF8533)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ color: '#FFF', fontWeight: 600, fontSize: 13 }}>{initials}</span>
    </div>
  );
}

function formatSubmittedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function LeadCard({ lead, report, sourcesCount = 0 }: LeadCardProps) {
  const score = getScore(lead, report);
  const scoreColor = getScoreColor(score);

  // Use company_summary from report if available, otherwise tell_us_more
  const description = report?.company_summary || lead.tell_us_more || '';
  const confidence = report?.recommendation_confidence;
  const robot = report?.recommended_robot;

  return (
    <Link href={`/lead/${lead.id}`}>
      <div className="card" style={{ padding: 20 }}>
        {/* Top Row: Avatar + Company/Contact + Score Ring */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
            {/* Company Logo or Initials Avatar */}
            <CompanyAvatar lead={lead} />

            {/* Company + Contact */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--sb-text)', lineHeight: 1.3, marginBottom: 2 }}>
                {lead.company}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--sb-text-secondary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.contact_name}
                {lead.job_title && ` · ${lead.job_title}`}
              </p>
              <p style={{ fontSize: 11, color: 'var(--sb-text-tertiary)', marginBottom: 0 }}>
                {formatSubmittedDate(lead.created_at)}
              </p>
            </div>
          </div>

          {/* Score Ring */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid ${scoreColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sb-text)' }}>{score}</span>
          </div>
        </div>

        {/* Pills Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {/* Temperature Pill */}
          <span className="badge" style={{ ...getTemperaturePillStyle(score), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
            {getTemperatureLabel(score)}
          </span>

          {/* Use Case Pill */}
          {lead.use_case && (
            <span className="pill">
              {lead.use_case.length > 22 ? lead.use_case.substring(0, 22) + '…' : lead.use_case}
            </span>
          )}

          {/* Robot Pill */}
          {robot && (
            <span className="pill" style={{ background: 'rgba(255,106,0,0.06)', color: '#FF6A00', borderColor: 'rgba(255,106,0,0.15)' }}>
              {robot}
            </span>
          )}
        </div>

        {/* Description - 2 lines clamped */}
        {description && (
          <p style={{
            fontSize: 13, color: 'var(--sb-text-secondary)', lineHeight: 1.5,
            marginBottom: 12,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        {/* Bottom Metadata - 3 column grid */}
        <div style={{
          borderTop: '1px solid var(--sb-border)', paddingTop: 10,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sb-text-tertiary)', marginBottom: 2 }}>Submitted</p>
            <p style={{ fontSize: 12, color: 'var(--sb-text-secondary)', marginBottom: 0 }}>
              {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sb-text-tertiary)', marginBottom: 2 }}>Confidence</p>
            <p style={{ fontSize: 12, color: 'var(--sb-text-secondary)', marginBottom: 0 }}>{confidence != null ? `${confidence}%` : '—'}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sb-text-tertiary)', marginBottom: 2 }}>Sources</p>
            <p style={{ fontSize: 12, color: 'var(--sb-text-secondary)', marginBottom: 0 }}>{sourcesCount > 0 ? sourcesCount : '—'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
