'use client';

import { useEffect, useState } from 'react';

interface HubSpotData {
  contact: any | null;
  company: any | null;
  deals: any[];
  tickets: any[];
  engagements: any[];
  links: {
    contact: string | null;
    company: string | null;
    deals: { id: string; url: string }[];
  };
}

function formatCurrency(val: string | number | null | undefined): string {
  if (!val) return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

function formatDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sb-orange hover:underline inline-flex items-center gap-1"
    >
      {children}
      <span style={{ fontSize: 12 }}>↗</span>
    </a>
  );
}

export default function HubSpotPanel({ leadId }: { leadId: string }) {
  const [data, setData] = useState<HubSpotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHubSpot() {
      try {
        const res = await fetch(`/api/lead/${leadId}/hubspot`);
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
    fetchHubSpot();
  }, [leadId]);

  if (loading) {
    return (
      <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div style={{ width: 20, height: 20, background: '#FF7A59', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#FF7A59' }}>HubSpot</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-sb-border rounded w-3/4" />
          <div className="h-4 bg-sb-border rounded w-1/2" />
          <div className="h-4 bg-sb-border rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error === 'not_configured') {
    return (
      <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 20, height: 20, background: '#FF7A59', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#FF7A59' }}>HubSpot</h2>
        </div>
        <p className="text-sb-text-secondary text-sm">HubSpot integration not configured.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 20, height: 20, background: '#FF7A59', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#FF7A59' }}>HubSpot</h2>
        </div>
        <p className="text-sb-text-secondary text-sm">Unable to fetch HubSpot data.</p>
      </div>
    );
  }

  const hasContact = !!data.contact;
  const hasCompany = !!data.company;
  const hasDeals = data.deals.length > 0;
  const hasTickets = data.tickets.length > 0;
  const hasData = hasContact || hasCompany;

  return (
    <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div style={{ width: 20, height: 20, background: '#FF7A59', borderRadius: 4 }} />
          <h2 className="text-xl font-bold" style={{ color: '#FF7A59' }}>HubSpot CRM</h2>
        </div>
        {hasData && (
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,122,89,0.1)', color: '#FF7A59' }}>
            Connected
          </span>
        )}
      </div>

      {!hasData ? (
        <p className="text-sb-text-secondary text-sm">No matching records found in HubSpot.</p>
      ) : (
        <div className="space-y-5">
          {/* Contact */}
          {hasContact && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-sb-text uppercase tracking-wider">Contact</h3>
                {data.links.contact && (
                  <ExternalLink href={data.links.contact}>View</ExternalLink>
                )}
              </div>
              <div className="bg-sb-bg rounded-lg p-3 space-y-1.5 text-sm border border-sb-border">
                <div className="flex justify-between">
                  <span className="text-sb-text-secondary">Name</span>
                  <span className="text-sb-text font-medium">
                    {data.contact.properties.firstname} {data.contact.properties.lastname}
                  </span>
                </div>
                {data.contact.properties.email && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Email</span>
                    <span className="text-sb-text">{data.contact.properties.email}</span>
                  </div>
                )}
                {data.contact.properties.jobtitle && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Title</span>
                    <span className="text-sb-text">{data.contact.properties.jobtitle}</span>
                  </div>
                )}
                {data.contact.properties.lifecyclestage && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Lifecycle</span>
                    <span className="capitalize" style={{ color: '#FF7A59' }}>
                      {data.contact.properties.lifecyclestage}
                    </span>
                  </div>
                )}
                {data.contact.properties.hs_lead_status && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Lead Status</span>
                    <span className="text-sb-text">{data.contact.properties.hs_lead_status}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company */}
          {hasCompany && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-sb-text uppercase tracking-wider">Company</h3>
                {data.links.company && (
                  <ExternalLink href={data.links.company}>View</ExternalLink>
                )}
              </div>
              <div className="bg-sb-bg rounded-lg p-3 space-y-1.5 text-sm border border-sb-border">
                <div className="flex justify-between">
                  <span className="text-sb-text-secondary">Name</span>
                  <span className="text-sb-text font-medium">{data.company.properties.name}</span>
                </div>
                {data.company.properties.industry && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Industry</span>
                    <span className="text-sb-text">{data.company.properties.industry.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {data.company.properties.numberofemployees && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Employees</span>
                    <span className="text-sb-text">{Number(data.company.properties.numberofemployees).toLocaleString()}</span>
                  </div>
                )}
                {data.company.properties.annualrevenue && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Revenue</span>
                    <span className="text-sb-text">{formatCurrency(data.company.properties.annualrevenue)}</span>
                  </div>
                )}
                {(data.company.properties.city || data.company.properties.state) && (
                  <div className="flex justify-between">
                    <span className="text-sb-text-secondary">Location</span>
                    <span className="text-sb-text">
                      {[data.company.properties.city, data.company.properties.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deals */}
          {hasDeals && (
            <div>
              <h3 className="text-sm font-semibold text-sb-text uppercase tracking-wider mb-2">
                Deals ({data.deals.length})
              </h3>
              <div className="space-y-2">
                {data.deals.map((deal: any) => {
                  const dealLink = data.links.deals.find((d) => d.id === deal.id);
                  return (
                    <div key={deal.id} className="bg-sb-bg rounded-lg p-3 text-sm border border-sb-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sb-text font-medium truncate mr-2">
                          {deal.properties.dealname}
                        </span>
                        {dealLink && (
                          <ExternalLink href={dealLink.url}>Open</ExternalLink>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-sb-text-secondary">
                        {deal.properties.amount && (
                          <span className="font-medium" style={{ color: '#22C55E' }}>
                            {formatCurrency(deal.properties.amount)}
                          </span>
                        )}
                        {deal.properties.closedate && (
                          <span>Close: {formatDate(deal.properties.closedate)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tickets */}
          {hasTickets && (
            <div>
              <h3 className="text-sm font-semibold text-sb-text uppercase tracking-wider mb-2">
                Tickets ({data.tickets.length})
              </h3>
              <div className="space-y-2">
                {data.tickets.map((ticket: any) => (
                  <div key={ticket.id} className="bg-sb-bg rounded-lg p-3 text-sm border border-sb-border">
                    <p className="text-sb-text font-medium">{ticket.properties.subject}</p>
                    {ticket.properties.hs_ticket_priority && (
                      <span className="text-xs text-sb-text-secondary">
                        Priority: {ticket.properties.hs_ticket_priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
