import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Table: customer_learning — stores accumulated insights
// Fields: id, company (unique), insights (text), hubspot_data (jsonb), updated_at

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');

    if (company) {
      // Get learning for a specific company
      const { data, error } = await supabase
        .from('customer_learning')
        .select('*')
        .ilike('company', `%${company}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ entries: data || [] });
    }

    // Get all learnings
    const { data, error } = await supabase
      .from('customer_learning')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ entries: data || [] });
  } catch (err) {
    console.error('Customer learning GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, insights, hubspot_data } = body;

    if (!company) {
      return NextResponse.json({ error: 'Company required' }, { status: 400 });
    }

    // Upsert — update if company exists, insert if not
    const { data: existing } = await supabase
      .from('customer_learning')
      .select('id, insights')
      .ilike('company', company)
      .single();

    if (existing) {
      // Append new insights
      const updatedInsights = existing.insights
        ? `${existing.insights}\n\n---\n\n${insights}`
        : insights;

      const { data, error } = await supabase
        .from('customer_learning')
        .update({
          insights: updatedInsights,
          hubspot_data: hubspot_data || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ entry: data, action: 'updated' });
    } else {
      const { data, error } = await supabase
        .from('customer_learning')
        .insert({
          company,
          insights: insights || '',
          hubspot_data: hubspot_data || null,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ entry: data, action: 'created' });
    }
  } catch (err) {
    console.error('Customer learning POST error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
