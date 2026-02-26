import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;
const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';

async function firefliesQuery(query: string, variables: Record<string, any> = {}) {
  if (!FIREFLIES_API_KEY) return null;

  const res = await fetch(FIREFLIES_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    console.error('Fireflies API error:', res.status, await res.text());
    return null;
  }

  return res.json();
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!FIREFLIES_API_KEY) {
      return NextResponse.json({ error: 'Fireflies not configured' }, { status: 503 });
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

    // Build search terms: contact name, company name
    const searchTerms = [lead.contact_name, lead.company].filter(Boolean);

    const allTranscripts: any[] = [];

    // Search Fireflies for each term
    for (const term of searchTerms) {
      const result = await firefliesQuery(`
        query SearchTranscripts($title: String) {
          transcripts(title: $title, limit: 10) {
            id
            title
            date
            duration
            organizer_email
            participants
            transcript_url
            summary {
              overview
              action_items
              keywords
            }
          }
        }
      `, { title: term });

      if (result?.data?.transcripts) {
        for (const t of result.data.transcripts) {
          if (!allTranscripts.find((existing) => existing.id === t.id)) {
            allTranscripts.push(t);
          }
        }
      }
    }

    // Also search by participant email if available
    if (lead.email) {
      const result = await firefliesQuery(`
        query SearchByParticipant {
          transcripts(participant_email: "${lead.email}", limit: 10) {
            id
            title
            date
            duration
            organizer_email
            participants
            transcript_url
            summary {
              overview
              action_items
              keywords
            }
          }
        }
      `);

      if (result?.data?.transcripts) {
        for (const t of result.data.transcripts) {
          if (!allTranscripts.find((existing) => existing.id === t.id)) {
            allTranscripts.push(t);
          }
        }
      }
    }

    // Sort by date descending
    allTranscripts.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      meetings: allTranscripts.map((t) => ({
        id: t.id,
        title: t.title,
        date: t.date,
        duration: t.duration,
        organizer_email: t.organizer_email,
        participants: t.participants || [],
        transcript_url: t.transcript_url,
        overview: t.summary?.overview || null,
        action_items: t.summary?.action_items || null,
        keywords: t.summary?.keywords || [],
      })),
      total: allTranscripts.length,
    });
  } catch (err) {
    console.error('Fireflies API error:', err);
    return NextResponse.json({ error: 'Fireflies lookup failed' }, { status: 500 });
  }
}
