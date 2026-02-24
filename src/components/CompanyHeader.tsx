import {
  Building2,
  MapPin,
  Users,
  Mail,
  Phone,
  Globe,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface CompanyHeaderProps {
  lead: Lead;
  report?: Report | null;
}

export default function CompanyHeader({ lead, report }: CompanyHeaderProps) {
  return (
    <div className="bg-sb-card rounded-xl shadow-card p-8 mb-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Company Info */}
        <div className="flex-1">
          {/* Company Name */}
          <h1 className="text-4xl font-bold text-sb-text mb-2">{lead.company}</h1>

          {/* Company Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Website */}
            {lead.website && (
              <a
                href={`https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sb-text-secondary hover:text-sb-orange transition"
              >
                <Globe size={18} />
                <span className="text-sm">{lead.website}</span>
              </a>
            )}

            {/* Location */}
            {(lead.state || lead.country) && (
              <div className="flex items-center gap-3 text-sb-text-secondary">
                <MapPin size={18} />
                <span className="text-sm">
                  {lead.state && lead.country
                    ? `${lead.state}, ${lead.country}`
                    : lead.state || lead.country}
                </span>
              </div>
            )}

            {/* Industry */}
            {lead.industry && (
              <div className="flex items-center gap-3 text-sb-text-secondary">
                <Building2 size={18} />
                <span className="text-sm">{lead.industry}</span>
              </div>
            )}

            {/* Company Size */}
            {lead.company_size && (
              <div className="flex items-center gap-3 text-sb-text-secondary">
                <Users size={18} />
                <span className="text-sm">{lead.company_size}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="border-t border-sb-border mt-6 pt-6 space-y-3">
            <h3 className="text-sm font-semibold text-sb-text mb-4">
              Contact Information
            </h3>

            {/* Contact Name & Title */}
            <div className="text-sb-text-secondary">
              <p className="font-medium text-sb-text">{lead.contact_name}</p>
              {lead.job_title && (
                <p className="text-sm">{lead.job_title}</p>
              )}
            </div>

            {/* Email */}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-3 text-sb-text-secondary hover:text-sb-orange transition"
              >
                <Mail size={16} />
                <span className="text-sm">{lead.email}</span>
              </a>
            )}

            {/* Phone */}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 text-sb-text-secondary hover:text-sb-orange transition"
              >
                <Phone size={16} />
                <span className="text-sm">{lead.phone}</span>
              </a>
            )}
          </div>

          {/* Lead Details */}
          <div className="border-t border-sb-border mt-6 pt-6 grid grid-cols-2 gap-4">
            {/* Lead Source */}
            {lead.lead_source && (
              <div>
                <p className="text-xs text-sb-text-secondary uppercase tracking-wide">
                  Lead Source
                </p>
                <p className="text-sm text-sb-text font-medium mt-1">
                  {lead.lead_source}
                </p>
              </div>
            )}

            {/* Timeline */}
            {lead.timeline && (
              <div>
                <p className="text-xs text-sb-text-secondary uppercase tracking-wide flex items-center gap-2">
                  <Calendar size={14} /> Timeline
                </p>
                <p className="text-sm text-sb-text font-medium mt-1">
                  {lead.timeline}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Opportunity Score */}
        {report && report.opportunity_score !== null && report.opportunity_score !== undefined && (
          <div className="flex flex-col items-center justify-center bg-sb-bg border border-sb-border rounded-xl p-8 min-w-48">
            <p className="text-xs text-sb-text-secondary uppercase tracking-wide mb-3">
              <TrendingUp size={14} className="inline mr-2" />
              Opportunity Score
            </p>
            <div className="text-6xl font-bold text-sb-orange">
              {report.opportunity_score}
            </div>
            <p className="text-sm text-sb-text-secondary mt-2">out of 100</p>

            {/* Score Explanation */}
            <div className="mt-6 w-full h-2 bg-sb-card rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sb-error via-sb-orange to-sb-success transition-all"
                style={{ width: `${report.opportunity_score}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
