import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const leads = [
  {
    company: 'Acme Manufacturing',
    contact_name: 'John Rodriguez',
    job_title: 'VP of Operations',
    phone: '555-234-5678',
    email: 'john.rodriguez@acmemanufacturing.com',
    state: 'Michigan',
    country: 'United States',
    use_case: 'Welding',
    timeline: '30-60 Days',
    lead_source: 'Google',
    lead_score: 82,
    tell_us_more: 'We run a mid-size metal fabrication shop with 120 employees. Currently doing MIG welding manually on our production line and looking to automate repetitive weld patterns on steel frames. We produce about 500 units/week and need to scale to 800.',
    raw_message: '*Company:* Acme Manufacturing\n*Contact Name:* John Rodriguez\n*Job Title:* VP of Operations\n*Email:* john.rodriguez@acmemanufacturing.com\n*Use Case:* Welding',
    status: 'complete' as const,
  },
  {
    company: 'FreshPack Foods Inc.',
    contact_name: 'Sarah Chen',
    job_title: 'Plant Manager',
    phone: '555-987-6543',
    email: 'schen@freshpackfoods.com',
    state: 'California',
    country: 'United States',
    use_case: 'Palletizing',
    timeline: '0-30 Days',
    lead_source: 'LinkedIn',
    lead_score: 91,
    tell_us_more: 'We package organic snack foods and need to automate our end-of-line palletizing. Currently have 4 people manually stacking cases onto pallets. Running 2 shifts and need a solution that can handle mixed case sizes from 5-25 lbs.',
    raw_message: '*Company:* FreshPack Foods Inc.\n*Contact Name:* Sarah Chen\n*Use Case:* Palletizing',
    status: 'complete' as const,
  },
  {
    company: 'TechVision Labs',
    contact_name: 'Marcus Williams',
    job_title: 'CTO',
    email: 'marcus@techvisionlabs.io',
    state: 'Texas',
    country: 'United States',
    use_case: 'Machine Tending',
    timeline: '60-90 Days',
    lead_source: 'Referral',
    lead_score: 67,
    tell_us_more: 'We manufacture custom PCB enclosures using CNC machines. Looking for a robot to load/unload our Haas VF-2 mills. Currently limited to single shift because we can\'t staff a second shift operator.',
    raw_message: '*Company:* TechVision Labs\n*Contact Name:* Marcus Williams\n*Use Case:* Machine Tending',
    status: 'researching' as const,
  },
  {
    company: 'Midwest Auto Parts',
    contact_name: 'Lisa Park',
    job_title: 'Quality Manager',
    phone: '555-345-6789',
    email: 'lpark@midwestautoparts.com',
    state: 'Ohio',
    country: 'United States',
    use_case: 'Inspection',
    timeline: '90+ Days',
    lead_source: 'Trade Show',
    lead_score: 55,
    tell_us_more: 'We supply brake components to major OEMs and need automated visual inspection. Currently doing manual inspection and our defect escape rate is too high. Need sub-millimeter accuracy.',
    raw_message: '*Company:* Midwest Auto Parts\n*Contact Name:* Lisa Park\n*Use Case:* Inspection',
    status: 'pending' as const,
  },
  {
    company: 'Test Company',
    contact_name: 'Bob Smith',
    job_title: '',
    email: 'bob@gmail.com',
    state: null,
    country: null,
    use_case: 'Other',
    timeline: null,
    lead_source: 'Website',
    lead_score: -15,
    tell_us_more: 'just looking',
    raw_message: '*Company:* Test Company\n*Contact Name:* Bob Smith\n*Use Case:* Other',
    status: 'invalid' as const,
    validation_errors: 'Generic company name; Personal email (gmail.com); Vague inquiry; Negative lead score',
  },
];

async function seed() {
  console.log('Seeding leads...');

  // Insert leads
  const { data: insertedLeads, error: leadsError } = await supabase
    .from('leads')
    .insert(leads)
    .select();

  if (leadsError) {
    console.error('Error inserting leads:', leadsError);
    process.exit(1);
  }

  console.log(`Inserted ${insertedLeads.length} leads`);

  // Create reports for the two "complete" leads
  const acmeLead = insertedLeads.find((l: any) => l.company === 'Acme Manufacturing');
  const freshpackLead = insertedLeads.find((l: any) => l.company === 'FreshPack Foods Inc.');

  const reports = [
    {
      lead_id: acmeLead!.id,
      company_summary: 'Acme Manufacturing is a mid-size metal fabrication company based in Michigan with approximately 120 employees. They specialize in steel frame production for industrial equipment, producing roughly 500 units per week. The company has been in operation for over 15 years and serves automotive and heavy equipment OEMs across the Midwest.',
      use_case_analysis: 'Acme\'s primary need is automating repetitive MIG welding patterns on steel frames. Their current manual process limits throughput to 500 units/week, and they need to scale to 800 units/week — a 60% increase. A collaborative welding robot can handle the repetitive weld patterns while their skilled welders focus on complex custom work. The Standard Bots RO1/Core with a welding end-effector is ideal for this application given the steel frame sizes and weld requirements.',
      recent_news: JSON.stringify([
        { title: 'Acme Manufacturing Expands Michigan Facility', url: 'https://example.com/news1', source: 'Manufacturing Today', date: '2025-12-15' },
        { title: 'Metal Fabrication Industry Sees Record Demand in Q4', url: 'https://example.com/news2', source: 'Industry Week', date: '2026-01-08' },
      ]),
      additional_opportunities: JSON.stringify([
        { use_case: 'Material Handling', robot: 'Core/RO1', description: 'Loading raw steel blanks into press brakes and stamping machines' },
        { use_case: 'Quality Inspection', robot: 'Spark', description: 'Post-weld visual inspection using mounted camera for weld bead consistency' },
        { use_case: 'Finishing', robot: 'Core/RO1', description: 'Automated grinding and deburring of welded assemblies' },
      ]),
      recommended_robot: 'Core/RO1',
      recommendation_rationale: 'The Core/RO1 ($37,000) is the best fit for Acme\'s welding application. With 18kg payload capacity, it can handle standard welding torches and fixtures. The 930mm reach covers typical steel frame weld paths. Its ±0.02mm repeatability ensures consistent weld quality. The no-code programming interface means their existing welders can teach new weld patterns without robotics expertise.',
      recommendation_confidence: 92,
      opportunity_score: 87,
      talking_points: JSON.stringify([
        { topic: 'Throughput Gap', detail: 'They need to go from 500 to 800 units/week. A single RO1 welding cell can increase throughput by 40-60% while running unattended.', question: 'What specific weld patterns are most repetitive on your steel frames?' },
        { topic: 'Labor Reallocation', detail: 'Their skilled welders can focus on custom/complex work while the robot handles repetitive patterns.', question: 'How many of your welders currently spend time on repetitive vs. custom work?' },
        { topic: 'ROI Timeline', detail: 'At $37K with labor savings of ~$50K/year (one shift operator), ROI is under 12 months.', question: 'What\'s your current fully-loaded cost per welding operator per shift?' },
        { topic: 'Scalability', detail: 'Start with one cell, prove the concept, then replicate across the production line.', question: 'How many welding stations do you currently have on your production line?' },
        { topic: 'No-Code Programming', detail: 'Their welders can program new patterns by hand-guiding the robot — no robotics engineer needed.', question: 'Have you worked with industrial robots before, or would this be your first deployment?' },
      ]),
      roi_angles: JSON.stringify([
        { angle: 'Labor Savings', explanation: 'Automate 1-2 manual welding positions per shift = $80-120K/year savings' },
        { angle: 'Throughput Increase', explanation: '60% more output enables capturing new orders without adding floor space' },
        { angle: 'Quality Consistency', explanation: 'Robotic welding reduces rework rate from ~8% to <1%, saving $30-50K/year in scrap' },
      ]),
      risk_factors: JSON.stringify([
        { risk: 'Weld fixture complexity', mitigation: 'Offer a pilot program with their simplest, highest-volume frame to prove the concept before expanding' },
        { risk: 'Union workforce concerns', mitigation: 'Position the robot as a tool that elevates welders to more skilled work, not a replacement' },
      ]),
      competitor_context: 'Universal Robots (UR10e) and FANUC CRX are likely alternatives they\'re evaluating. Standard Bots wins on price ($37K vs $50K+ for UR), ease of programming (no-code vs. teach pendant), and faster deployment timeline.',
    },
    {
      lead_id: freshpackLead!.id,
      company_summary: 'FreshPack Foods Inc. is an organic snack food packaging company headquartered in California. They operate a USDA-certified facility running two shifts and package a variety of organic snack products including chips, granola bars, and dried fruit mixes. The company has seen strong growth driven by the organic food trend.',
      use_case_analysis: 'FreshPack needs end-of-line palletizing automation to replace 4 manual workers stacking cases. Their mixed case sizes (5-25 lbs) require a flexible solution. The Thor robot with its 30kg payload capacity can handle their heaviest cases with margin, and its 1300mm reach covers standard pallet footprints. The immediate timeline (0-30 days) and high lead score (91) indicate strong urgency.',
      recent_news: JSON.stringify([
        { title: 'Organic Snack Market Growing 12% Annually', url: 'https://example.com/news3', source: 'Food Processing Magazine', date: '2026-01-20' },
      ]),
      additional_opportunities: JSON.stringify([
        { use_case: 'Case Packing', robot: 'Core/RO1', description: 'Automating product-to-case packing upstream of palletizing' },
        { use_case: 'Material Handling', robot: 'Thor', description: 'Moving raw material bags from storage to mixing stations' },
      ]),
      recommended_robot: 'Thor',
      recommendation_rationale: 'The Thor ($49,500) is ideal for FreshPack\'s palletizing needs. Its 30kg payload handles their heaviest 25lb cases with ample margin for grippers. The 1300mm reach covers full pallet dimensions. Multi-shift operation capability matches their 2-shift schedule. The investment replaces 4 manual operators across shifts.',
      recommendation_confidence: 88,
      opportunity_score: 94,
      talking_points: JSON.stringify([
        { topic: 'Immediate ROI', detail: 'Replacing 4 palletizers across 2 shifts = $200K+/year in labor. Thor pays for itself in ~3 months.', question: 'What\'s your current cost per palletizer including benefits and overtime?' },
        { topic: 'Mixed Case Handling', detail: 'Thor\'s adaptive gripper and no-code setup means switching between case sizes takes minutes, not hours.', question: 'How many different case SKUs do you run in a typical shift?' },
        { topic: 'Food Safety', detail: 'Stainless steel components and washdown-ready design for USDA facility compliance.', question: 'What are your specific sanitation and washdown requirements?' },
      ]),
      roi_angles: JSON.stringify([
        { angle: 'Labor Replacement', explanation: '4 palletizers x 2 shifts = $200K+/year savings for a $49.5K investment' },
        { angle: 'Ergonomic Risk', explanation: 'Eliminates repetitive lifting injuries — case stacking is the #1 injury source in food packaging' },
      ]),
      risk_factors: JSON.stringify([
        { risk: 'Food-grade requirements', mitigation: 'Thor is available with food-safe coatings and washdown protection' },
      ]),
      competitor_context: 'They may be looking at dedicated palletizing solutions from Columbia or ABB. Standard Bots wins on flexibility — Thor can be repurposed for other tasks, unlike single-purpose palletizers.',
    },
  ];

  const { data: insertedReports, error: reportsError } = await supabase
    .from('reports')
    .insert(reports)
    .select();

  if (reportsError) {
    console.error('Error inserting reports:', reportsError);
    process.exit(1);
  }

  console.log(`Inserted ${insertedReports.length} reports`);

  // Add some sources
  const acmeReport = insertedReports.find((r: any) => r.lead_id === acmeLead!.id);
  const freshpackReport = insertedReports.find((r: any) => r.lead_id === freshpackLead!.id);

  const sources = [
    { lead_id: acmeLead!.id, title: 'Acme Manufacturing - Company Website', url: 'https://acmemanufacturing.com', description: 'Corporate homepage with company overview and capabilities' },
    { lead_id: acmeLead!.id, title: 'Acme Manufacturing Expands Michigan Facility', url: 'https://manufacturingtoday.com/acme-expands', description: 'News article about facility expansion and growth plans' },
    { lead_id: acmeLead!.id, title: 'Robotic Welding Trends in Metal Fabrication 2026', url: 'https://industryweek.com/robotic-welding-trends', description: 'Industry analysis of welding automation adoption' },
    { lead_id: freshpackLead!.id, title: 'FreshPack Foods - About Us', url: 'https://freshpackfoods.com/about', description: 'Company background and product portfolio' },
    { lead_id: freshpackLead!.id, title: 'Organic Snack Market Growing 12% Annually', url: 'https://foodprocessing.com/organic-growth', description: 'Market analysis showing strong industry tailwinds' },
  ];

  const { error: sourcesError } = await supabase.from('sources').insert(sources);

  if (sourcesError) {
    console.error('Error inserting sources:', sourcesError);
    process.exit(1);
  }

  console.log('Inserted sources');
  console.log('\nSeed complete! Lead IDs:');
  insertedLeads.forEach((l: any) => console.log(`  ${l.company}: ${l.id} (${l.status})`));
}

seed().catch(console.error);
