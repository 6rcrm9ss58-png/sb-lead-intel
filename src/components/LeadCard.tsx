import Link from 'next/link';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface LeadCardProps {
  lead: Lead;
  report?: Report;
}

function getScoreRingColor(score: number) {
  if (score >= 50) return 'border-sb-success';
  if (score >= 20) return 'border-sb-orange';
  return 'border-sb-error';
}

function getTemperaturePillColor(score: number) {
  if (score >= 50) return 'bg-sb-success/10 text-sb-success border-sb-success/30';
  if (score >= 20) return 'bg-sb-orange/10 text-sb-orange border-sb-orange/30';
  return 'bg-sb-error/10 text-sb-error border-sb-error/30';
}

function getTemperatureLabel(score: number) {
  if (score >= 50) return 'Hot';
  if (score >= 20) return 'Warm';
  return 'Cold';
}

export default function LeadCard({ lead }: LeadCardProps) {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const initials = (lead.contact_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Link href={`/lead/${lead.id}`}>
      <div className="bg-sb-card rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:shadow-orange-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Top Row: Avatar + Company + Score Ring */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sb-orange to-sb-orange-light flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">{initials}</span>
            </div>

            {/* Company + Contact Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] text-sb-text leading-tight">
                {lead.company}
              </h3>
              <p className="text-[13px] text-sb-text-secondary mt-0.5 truncate">
                {lead.contact_name}
                {lead.job_title && ` • ${lead.job_title}`}
              </p>
            </div>
          </div>

          {/* Score Ring */}
          <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getScoreRingColor(lead.lead_score)}`}>
            <span className="text-xs font-bold text-sb-text">{lead.lead_score}</span>
          </div>
        </div>

        {/* Pills Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getTemperaturePillColor(lead.lead_score)}`}>
            {getTemperatureLabel(lead.lead_score)}
          </span>
          {lead.use_case && (
            <span className="inline-flex px-2.5 py-1 bg-sb-surface text-sb-text-tertiary rounded-full text-xs font-medium border border-sb-border">
              {truncateText(lead.use_case, 20)}
            </span>
          )}
          {lead.timeline && (
            <span className="inline-flex px-2.5 py-1 bg-sb-surface text-sb-text-tertiary rounded-full text-xs font-medium border border-sb-border">
              {lead.timeline}
            </span>
          )}
        </div>

        {/* Description - 2 lines clamped */}
        {lead.tell_us_more && (
          <p className="text-[13px] text-sb-text-secondary mb-4 line-clamp-2 leading-relaxed">
            {lead.tell_us_more}
          </p>
        )}

        {/* Bottom Metadata - 3 column grid */}
        <div className="border-t border-sb-border pt-3 grid grid-cols-3 gap-2 text-[12px]">
          <div className="text-center">
            <p className="text-sb-text-tertiary font-medium uppercase">Timeline</p>
            <p className="text-sb-text-secondary mt-0.5">{lead.timeline || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-sb-text-tertiary font-medium uppercase">Score</p>
            <p className="text-sb-text-secondary mt-0.5">{lead.lead_score}</p>
          </div>
          <div className="text-center">
            <p className="text-sb-text-tertiary font-medium uppercase">State</p>
            <p className="text-sb-text-secondary mt-0.5">{lead.state || '—'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
