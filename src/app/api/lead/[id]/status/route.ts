import { NextRequest, NextResponse } from 'next/server';
import { updateLeadStatus } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json() as { status: string };

    const validStatuses = ['pending', 'validating', 'researching', 'complete', 'invalid'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await updateLeadStatus(
      params.id,
      status as 'pending' | 'validating' | 'researching' | 'complete' | 'invalid',
    );

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update lead status' },
      { status: 500 }
    );
  }
}
