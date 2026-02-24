import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

// Latest 5 leads from #lead-alerts (Feb 24, 2026)
const newLeads: LeadInsert[] = [
  {
    company: 'American Box',
    contact_name: 'Colten Freeze',
    job_title: 'Sales',
    phone: '+1 316-253-2116',
    email: 'coltenf@americanbox.com',
    state: 'Kansas',
    website: null,
    industry: 'Manufacturing',
    company_size: null,
    use_case: 'Partner Inquiry',
    timeline: '6 Months',
    lead_source: 'Direct Traffic',
    lead_score: 0,
    tell_us_more: 'We are a manufacturer of packaging and many of our customers are looking to automate their packaging lines. We want to be able to offer this to our customers.',
    raw_message: 'American Box submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771911410.224979',
  },
  {
    company: 'Nearly Natural',
    contact_name: 'Robbie Singer',
    job_title: 'CEO',
    phone: '+1 813-514-1006',
    email: 'robbie@nearlynatural.com',
    state: 'Florida',
    website: null,
    industry: 'Retail / E-commerce',
    company_size: null,
    use_case: 'Other',
    timeline: '3 Months',
    lead_source: 'Direct Traffic',
    lead_score: 20,
    tell_us_more: 'Picking boxes off pallets throughout a warehouse.',
    raw_message: 'Nearly Natural submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771903791.974499',
  },
  {
    company: 'Ltw electric',
    contact_name: 'Nathan Gandy',
    job_title: 'Owner',
    phone: '+1 716-246-7795',
    email: 'ltw.electric@yahoo.com',
    state: 'New York',
    website: null,
    industry: 'Electrical',
    company_size: null,
    use_case: 'Other',
    timeline: '12+ Months',
    lead_source: 'Direct Traffic',
    lead_score: -20,
    tell_us_more: 'Sometimes that can improve life.',
    raw_message: 'Ltw electric submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771902829.934789',
  },
  {
    company: 'SB2 America LLC',
    contact_name: 'Hugo Marques',
    job_title: 'Director',
    phone: '+1 864-553-6688',
    email: 'hugo.marques@sb2america.com',
    state: 'South Carolina',
    website: null,
    industry: 'Manufacturing',
    company_size: null,
    use_case: 'Material Handling',
    timeline: '6 Months',
    lead_source: 'Google Organic Search',
    lead_score: -10,
    tell_us_more: 'Transport beans and angles to CNC drilling processes.',
    raw_message: 'SB2 America LLC submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771902746.228029',
  },
  {
    company: 'Quality Custom Molding LLC',
    contact_name: 'Mark Volmer',
    job_title: 'Owner',
    phone: '+1 417-350-4417',
    email: 'mark@qcmolds.com',
    state: 'Missouri',
    website: null,
    industry: 'Manufacturing',
    company_size: null,
    use_case: 'Other',
    timeline: '6 Months',
    lead_source: 'Google Organic Search',
    lead_score: 30,
    tell_us_more: 'We are a blow molding company that has 2 use cases for the robotic arm. Use case 1 is removing the excess plastic from the part (deflashing). Use case 2 is grabbing the part from a machine and placing in a box or on a conveyor.',
    raw_message: 'Quality Custom Molding LLC submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771901969.341529',
  },
];

async function ingestNewLeads() {
  console.log('📥 Inserting 5 new leads from #lead-alerts...\n');

  for (const lead of newLeads) {
    // Check if lead already exists (by slack_timestamp)
    const { data: existing } = await supabase
      .from('leads')
      .select('id, company')
      .eq('slack_timestamp', lead.slack_timestamp!)
      .single();

    if (existing) {
      console.log(`⏭️  ${lead.company} already exists (${existing.id}), skipping.`);
      continue;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to insert ${lead.company}:`, error.message);
    } else {
      console.log(`✅ ${data.company} (score: ${data.lead_score}) → ${data.id}`);
    }
  }

  // Show total count
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✨ Done! Total leads in database: ${count}`);
}

ingestNewLeads().catch(console.error);
