import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Assign a salesperson to a lead and optionally set pipeline stage
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, email, slack_id, pipeline_stage } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      assigned_to_name: name,
      assigned_to_email: email,
      assigned_to_slack_id: slack_id || null,
      assigned_at: new Date().toISOString(),
    };

    // If pipeline_stage is provided, use it; otherwise set to 'new' if currently unassigned
    if (pipeline_stage) {
      updateData.pipeline_stage = pipeline_stage;
    } else {
      // Check current stage — only auto-advance if unassigned
      const { data: current } = await supabase
        .from('leads')
        .select('pipeline_stage')
        .eq('id', params.id)
        .single();

      if (current?.pipeline_stage === 'unassigned') {
        updateData.pipeline_stage = 'new';
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error('Assign salesperson error:', err);
    return NextResponse.json({ error: 'Failed to assign' }, { status: 500 });
  }
}

// Update pipeline stage only
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { pipeline_stage } = body;

    if (!pipeline_stage) {
      return NextResponse.json({ error: 'pipeline_stage required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ pipeline_stage })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error('Update pipeline stage error:', err);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}

// Unassign salesperson
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        assigned_to_name: null,
        assigned_to_email: null,
        assigned_to_slack_id: null,
        assigned_at: null,
        pipeline_stage: 'unassigned',
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error('Unassign error:', err);
    return NextResponse.json({ error: 'Failed to unassign' }, { status: 500 });
  }
}
