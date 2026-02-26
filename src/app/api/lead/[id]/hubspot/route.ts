import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || '20020304';

async function hubspotSearch(objectType: string, query: string, properties: string[]) {
  if (!HUBSPOT_TOKEN) return { results: [], total: 0 };

  const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${objectType}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      limit: 5,
      properties,
    }),
  });

  if (!res.ok) {
    console.error(`HubSpot ${objectType} search failed:`, res.status, await res.text());
    return { results: [], total: 0 };
  }

  return res.json();
}

async function hubspotGetAssociations(objectType: string, objectId: string, toObjectType: string) {
  if (!HUBSPOT_TOKEN) return { results: [] };

  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}/associations/${toObjectType}`,
    {
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
    }
  );

  if (!res.ok) return { results: [] };
  return res.json();
}

async function hubspotGetObject(objectType: string, objectId: string, properties: string[]) {
  if (!HUBSPOT_TOKEN) return null;

  const params = new URLSearchParams();
  properties.forEach((p) => params.append('properties', p));

  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/${objectType}/${objectId}?${params.toString()}`,
    {
      headers: { 'Authorization': `Bearer ${HUBSPOT_TOKEN}` },
    }
  );

  if (!res.ok) return null;
  return res.json();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!HUBSPOT_TOKEN) {
      return NextResponse.json({ error: 'HubSpot not configured' }, { status: 503 });
    }

    // Fetch lead from Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Search for contact by email first, then by name
    let contacts = { results: [] as any[], total: 0 };

    if (lead.email) {
      contacts = await hubspotSearch('contacts', lead.email, [
        'firstname', 'lastname', 'email', 'company', 'jobtitle',
        'lifecyclestage', 'hs_lead_status', 'phone', 'lastmodifieddate',
        'notes_last_updated', 'num_associated_deals',
      ]);
    }

    if (contacts.total === 0 && lead.contact_name) {
      contacts = await hubspotSearch('contacts', lead.contact_name, [
        'firstname', 'lastname', 'email', 'company', 'jobtitle',
        'lifecyclestage', 'hs_lead_status', 'phone', 'lastmodifieddate',
        'notes_last_updated', 'num_associated_deals',
      ]);
    }

    // Search for company
    const companies = await hubspotSearch('companies', lead.company, [
      'name', 'domain', 'industry', 'numberofemployees', 'annualrevenue',
      'city', 'state', 'country', 'description', 'website',
      'num_associated_contacts', 'num_associated_deals',
    ]);

    // Get deals associated with the contact (if found)
    let deals: any[] = [];
    if (contacts.results.length > 0) {
      const contactId = contacts.results[0].id;
      const assocs = await hubspotGetAssociations('contacts', contactId, 'deals');

      if (assocs.results?.length > 0) {
        const dealPromises = assocs.results.slice(0, 10).map((a: any) =>
          hubspotGetObject('deals', a.id, [
            'dealname', 'amount', 'dealstage', 'pipeline', 'closedate',
            'hs_lastmodifieddate', 'hubspot_owner_id',
          ])
        );
        const dealResults = await Promise.all(dealPromises);
        deals = dealResults.filter(Boolean);
      }
    }

    // Get tickets associated with the contact (if found)
    let tickets: any[] = [];
    if (contacts.results.length > 0) {
      const contactId = contacts.results[0].id;
      const assocs = await hubspotGetAssociations('contacts', contactId, 'tickets');

      if (assocs.results?.length > 0) {
        const ticketPromises = assocs.results.slice(0, 10).map((a: any) =>
          hubspotGetObject('tickets', a.id, [
            'subject', 'content', 'hs_pipeline_stage', 'hs_ticket_priority',
            'createdate', 'hs_lastmodifieddate',
          ])
        );
        const ticketResults = await Promise.all(ticketPromises);
        tickets = ticketResults.filter(Boolean);
      }
    }

    // Get recent engagement activities for the contact
    let engagements: any[] = [];
    if (contacts.results.length > 0) {
      const contactId = contacts.results[0].id;

      // Get recent notes
      const noteAssocs = await hubspotGetAssociations('contacts', contactId, 'notes');
      if (noteAssocs.results?.length > 0) {
        const notePromises = noteAssocs.results.slice(0, 5).map((a: any) =>
          hubspotGetObject('notes', a.id, ['hs_note_body', 'hs_timestamp', 'hs_lastmodifieddate'])
        );
        const noteResults = await Promise.all(notePromises);
        engagements = noteResults.filter(Boolean).map((n: any) => ({
          type: 'note',
          ...n,
        }));
      }
    }

    const portalId = HUBSPOT_PORTAL_ID;

    return NextResponse.json({
      contact: contacts.results[0] || null,
      company: companies.results[0] || null,
      deals,
      tickets,
      engagements,
      links: {
        contact: contacts.results[0]
          ? `https://app.hubspot.com/contacts/${portalId}/record/0-1/${contacts.results[0].id}`
          : null,
        company: companies.results[0]
          ? `https://app.hubspot.com/contacts/${portalId}/record/0-2/${companies.results[0].id}`
          : null,
        deals: deals.map((d: any) => ({
          id: d.id,
          url: `https://app.hubspot.com/contacts/${portalId}/record/0-3/${d.id}`,
        })),
      },
    });
  } catch (err) {
    console.error('HubSpot API error:', err);
    return NextResponse.json({ error: 'HubSpot lookup failed' }, { status: 500 });
  }
}
