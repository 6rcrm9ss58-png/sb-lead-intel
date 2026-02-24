import { NextRequest, NextResponse } from 'next/server';
import { fetchLead, updateLeadStatus } from '@/lib/supabase';
import { getAdminClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await fetchLead(params.id);

    // Delete existing report and sources so they get regenerated
    const admin = getAdminClient();

    await admin.from('sources').delete().eq('lead_id', params.id);
    await admin.from('reports').delete().eq('lead_id', params.id);

    // Reset status to pending
    await updateLeadStatus(params.id, 'pending', { validation_errors: null });

    // Trigger reprocessing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: params.id }),
    }).catch((err) => console.error('Error triggering reprocess:', err));

    return NextResponse.json({
      success: true,
      message: `Reprocessing started for ${lead.company}`,
      lead_id: params.id,
    });
  } catch (error) {
    console.error('Reprocess error:', error);
    return NextResponse.json(
      { error: 'Failed to reprocess lead' },
      { status: 500 }
    );
  }
}
