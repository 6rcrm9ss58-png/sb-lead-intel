import Link from 'next/link';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface LeadCardProps {
  lead: Lead;
  report?: Report;
}

function getScoreBadgeColor(score: number) {
  if (score >= 50) return 'bg-sb-success';
  if (score >= 20) return 'bg-sb-orange';
  return 'bg-sb-error';
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-sb-warning text-sb-bg';
    case 'validating':
      return 'bg-sb-orange text-sb-bg';
    case 'researching':
      return 'bg-sb-orange text-sb-bg';
    case 'complete':
      return 'bg-sb-success text-sb-bg';
    case 'invalid':
      return 'bg-sb-error text-sb-bg';
    default:
      return 'bg-sb-card border border-sb-border text-sb-text';
  }
}

function getRelativeTime(dateString: string) {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export default function LeadCard({ lead, report }: LeadCardProps) {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Link href={`/lead/${lead.id}`}>
      <div className="card group cursor-pointer hover:border-sb-orange transition-all duration-300">
        {/* Header with Company Name */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-sb-text group-hover:text-sb-orange transition">
            {lead.company}
          </h3>
          <p className="text-sm text-sb-text-secondary mt-1">
            {lead.contact_name}
            {lead.job_title && ` • ${lead.job_title}`}
          </p>
        </div>

        {/* Use Case Badge */}
        <div className="mb-4">
          <span className="inline-block bg-sb-orange text-sb-bg px-3 py-1 rounded-full text-xs font-semibold">
            {truncateText(lead.use_case, 30)}
          </span>
        </div>

        {/* Timeline and Lead Score Row */}
        <div className="flex items-center justify-between mb-4">
          {lead.timeline && (
            <span className="badge badge-secondary text-xs">
              {lead.timeline}
            </span>
          )}
          <div className={`badge ${getScoreBadgeColor(lead.lead_score)} text-white font-bold text-xs`}>
            Score: {lead.lead_score}
          </div>
        </div>

        {/* Opportunity Score (if report exists) */}
        {report?.opportunity_score !== null && report?.opportunity_score !== undefined && (
          <div className="bg-sb-card/50 border border-sb-orange/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-sb-text-secondary mb-1">Opportunity Score</p>
            <p className="text-3xl font-bold text-sb-orange">
              {report.opportunity_score}
              <span className="text-lg text-sb-text-secondary">/100</span>
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`badge ${getStatusBadgeColor(lead.status)} text-xs font-semibold`}
          >
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </span>
          <span className="text-xs text-sb-text-secondary">
            {getRelativeTime(lead.created_at)}
          </span>
        </div>

        {/* View Report Link */}
        {lead.status === 'complete' && (
          <div className="mt-4 pt-4 border-t border-sb-border">
            <p className="text-sb-orange text-sm font-semibold flex items-center gap-2">
              View Report
              <span className="group-hover:translate-x-1 transition">→</span>
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
