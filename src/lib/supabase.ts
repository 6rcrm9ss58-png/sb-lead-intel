import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Re-export types from the canonical type file
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type Source = Database['public']['Tables']['sources']['Row'];
export type SourceInsert = Database['public']['Tables']['sources']['Insert'];

// Browser client (public — uses anon key)
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Server-side admin client (service role — bypasses RLS)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or service role key');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

// Singleton instances
let browserClient: SupabaseClient<Database> | null = null;
let adminClient: SupabaseClient<Database> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

export function getAdminClient() {
  if (!adminClient) {
    adminClient = createAdminClient();
  }
  return adminClient;
}

// ─── Helper functions ───────────────────────────────────────────────

export async function fetchLead(id: string): Promise<Lead> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchReport(leadId: string): Promise<Report | null> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('reports')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  // PGRST116 = no rows found — that's OK, just means no report yet
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function fetchSources(leadId: string): Promise<Source[]> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('sources')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateLeadStatus(
  id: string,
  status: Lead['status'],
  updates?: LeadUpdate,
) {
  const client = getAdminClient();
  const payload: LeadUpdate = { status, ...(updates || {}) };
  const { data, error } = await client
    .from('leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createReport(report: ReportInsert): Promise<Report> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('reports')
    .insert([report])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addSource(source: SourceInsert): Promise<Source> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('sources')
    .insert([source])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addSources(sources: SourceInsert[]): Promise<Source[]> {
  if (sources.length === 0) return [];
  const client = getAdminClient();
  const { data, error } = await client
    .from('sources')
    .insert(sources)
    .select();

  if (error) throw error;
  return data || [];
}
