import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

// Real leads from #lead-alerts (Feb 22, 2026)
const realLeads: LeadInsert[] = [
  {
    company: 'Diamond Tool Mfg',
    contact_name: 'Mike McHugh',
    job_title: 'Owner',
    phone: '+1 248-982-7188',
    email: 'mmchugh@diamondtoolmfg.com',
    state: 'Michigan',
    website: null,
    industry: 'Manufacturing',
    company_size: null,
    use_case: 'Machine Tending',
    timeline: '3 Months',
    lead_source: 'Paid Social',
    lead_score: 80,
    tell_us_more: 'Machine tending pull a finish part out in the same motion put the next piece in to be machined. We have a universal robot now we\'re interested to see what you guys can do.',
    raw_message: 'Diamond Tool Mfg submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771796263.253169',
  },
  {
    company: 'Frick\'s Performance Solutions',
    contact_name: 'Landon Frick',
    job_title: 'President',
    phone: '+1 661-497-7753',
    email: 'landon@fricksperformance.com',
    state: 'California',
    website: null,
    industry: 'Manufacturing',
    company_size: null,
    use_case: 'Machine Tending',
    timeline: '6 Months',
    lead_source: 'Direct Traffic',
    lead_score: 60,
    tell_us_more: 'Looking for a Robotic arm to load and unload stamping dies and/or form small parts on our press brake.',
    raw_message: 'Frick\'s Performance Solutions submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771811995.826699',
  },
  {
    company: 'Umit Makina',
    contact_name: 'Hakan Umit',
    job_title: 'CEO',
    phone: '+90 507 992 00 00',
    email: 'ahmethakan@umitmakina.com.tr',
    state: 'Outside of US',
    country: 'Europe',
    website: null,
    industry: 'CNC Distribution',
    company_size: null,
    use_case: 'Partner Inquiry',
    timeline: 'Immediate',
    lead_source: 'Direct Traffic',
    lead_score: 40,
    tell_us_more: 'We are a major CNC distributor in Turkey with a history dating back to 1987. Our customers want to automate, but legacy robots (Kuka/Fanuc) are too complex and expensive for high-mix shops. We want to bundle every CNC machine we sell with a Standard Bots RO1. Our goal is to make the "RO1" the standard machine tender for the Turkish industry. We have secured a prime exhibition space at MAKTEK Eurasia 2026. We intend to feature a Standard Bots RO1 unit as the "Star of the Show" in our booth. We are ready to invest in a demo unit immediately.',
    raw_message: 'Umit Makina submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771802125.415989',
  },
  {
    company: 'Byte & Brew LLC',
    contact_name: 'Celal Ozkan',
    job_title: 'General Manager',
    phone: '+1 305-850-9450',
    email: 'celal.ozkan@bytenbrew.com',
    state: 'Florida',
    website: null,
    industry: 'Food & Beverage',
    company_size: null,
    use_case: 'Material Handling',
    timeline: '3 Months',
    lead_source: 'Paid Social',
    lead_score: 10,
    tell_us_more: 'We are handling a robotic cafe kiosk where we are selling coffee, ice cream, tea, and pastry.',
    raw_message: 'Byte & Brew LLC submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771739869.098569',
  },
  {
    company: 'Dataguy AI Academy',
    contact_name: 'Richard Romine',
    job_title: 'Owner',
    phone: '+1 941-224-6693',
    email: 'rominerichard@dataguyacademy.com',
    state: 'Tennessee',
    website: null,
    industry: 'Education',
    company_size: null,
    use_case: 'Education',
    timeline: '3 Months',
    lead_source: 'Paid Social',
    lead_score: 70,
    tell_us_more: 'We are preparing to launch a full-scale AI and robotics learning academy in Arlington, Tennessee. We are very interested in integrating an AI-powered robotic arm into our curriculum. Our students will be learning how to use AI to control movement, design task automation, test precision workflows, and explore robotics applications. We would love to explore whether you offer educational pricing or pilot programs, demo or development units, partnership opportunities for STEM programs, co-branded community or showcase events.',
    raw_message: 'Dataguy AI Academy submitted a request via Current Registration Form (Honey Pot).',
    status: 'pending',
    slack_event_id: null,
    slack_timestamp: '1771746237.919479',
  },
];

async function ingestLeads() {
  console.log('🧹 Clearing existing test data...');

  // Clear in order: sources → reports → leads
  await supabase.from('sources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('📥 Inserting 5 real leads from #lead-alerts...\n');

  for (const lead of realLeads) {
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

  console.log('\n✨ Done! 5 real leads ready for processing.');
}

ingestLeads().catch(console.error);
