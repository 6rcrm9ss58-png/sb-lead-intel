import { Lead, ReportInsert, SourceInsert } from './supabase';
import { ResearchResult } from './research';
import { callClaude } from './anthropic';
import fs from 'fs';
import path from 'path';

// Standard Bots product catalog (hardcoded for reliability)
const SB_ROBOTS = {
  Spark: { price: '$29,500', payload: '7kg', reach: '625mm', repeatability: '±0.02mm', bestFor: ['assembly', 'inspection', 'testing', 'light material handling'] },
  'Core/RO1': { price: '$37,000', payload: '18kg', reach: '930mm', repeatability: '±0.02mm', bestFor: ['welding', 'machine tending', 'material handling', 'finishing', 'deburring'] },
  Thor: { price: '$49,500', payload: '30kg', reach: '1300mm', repeatability: '±0.05mm', bestFor: ['palletizing', 'heavy material handling', 'packaging', 'case packing'] },
  Bolt: { price: 'Coming 2026', payload: 'Bimanual', reach: 'Full body', repeatability: 'Humanoid precision', bestFor: ['complex assembly', 'dual-arm tasks', 'human-like manipulation'] },
};

// Load Standard Bots reference doc if available
function loadSBReference(): string {
  try {
    const refPath = path.join(process.cwd(), 'STANDARD_BOTS_REFERENCE.md');
    return fs.readFileSync(refPath, 'utf-8');
  } catch {
    return '';
  }
}

// ─── Main report generation ─────────────────────────────────────────

export async function generateReport(
  lead: Lead,
  research: ResearchResult,
): Promise<{ report: ReportInsert; sources: SourceInsert[] }> {
  const sbRef = loadSBReference();
  const researchContext = formatResearchForPrompt(research);

  // Generate the full report via a single comprehensive Claude call
  const systemPrompt = `You are a senior sales intelligence analyst at Standard Bots, a collaborative robotics company.
You are generating a detailed research report for a salesperson to read BEFORE their first call with a prospect.

${sbRef ? `STANDARD BOTS PRODUCT REFERENCE:\n${sbRef}\n\n` : `STANDARD BOTS PRODUCTS:
- Spark ($29,500): 7kg payload, 625mm reach, ±0.02mm repeatability. Best for: assembly, inspection, testing, light material handling.
- Core/RO1 ($37,000): 18kg payload, 930mm reach, ±0.02mm repeatability. Best for: welding, machine tending, material handling, finishing/deburring.
- Thor ($49,500): 30kg payload, 1300mm reach, ±0.05mm repeatability. Best for: palletizing, heavy material handling, packaging.
- Bolt (Coming 2026): Bimanual humanoid. Best for: complex dual-arm assembly tasks.

KEY SELLING POINTS: No-code programming (teach by hand-guiding), 10x cheaper than traditional industrial robots, deploys in hours not months, collaborative safety (works alongside humans), cloud-connected with OTA updates.
`}

You MUST return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "company_summary": "2-3 paragraph overview of the company, their operations, and industry position",
  "use_case_analysis": "Detailed analysis of how Standard Bots solves their stated need, referencing specific robot capabilities",
  "recent_news": "[{title, url, source, date}] — array of relevant news items as JSON string",
  "additional_opportunities": "[{use_case, robot, description}] — 2-4 other automation opportunities beyond their stated need",
  "recommended_robot": "Spark|Core/RO1|Thor|Bolt — the single best robot for their primary use case",
  "recommendation_rationale": "3-4 sentences explaining why this specific robot fits, with specs and pricing",
  "recommendation_confidence": 0-100,
  "opportunity_score": 0-100,
  "talking_points": "[{topic, detail, question}] — 5 specific things for the salesperson to discuss",
  "roi_angles": "[{angle, explanation}] — 3-4 financial/operational ROI arguments",
  "risk_factors": "[{risk, mitigation}] — 2-3 potential objections and how to handle them",
  "competitor_context": "Who else might be pitching this customer and how Standard Bots wins"
}

IMPORTANT RULES:
- recommended_robot MUST be one of: Spark, Core/RO1, Thor, Bolt
- All array fields must be JSON string arrays, not raw arrays
- opportunity_score considers: timeline urgency, use case fit, company legitimacy, budget signals, decision-maker access
- talking_points questions should be open-ended discovery questions
- Be specific and actionable — generic advice is useless to salespeople`;

  const userPrompt = `Generate a sales intelligence report for this lead:

LEAD DATA:
- Company: ${lead.company}
- Contact: ${lead.contact_name} (${lead.job_title || 'No title'})
- Email: ${lead.email}
- Phone: ${lead.phone || 'N/A'}
- Location: ${lead.state ? `${lead.state}, ${lead.country || 'US'}` : lead.country || 'Unknown'}
- Use Case: ${lead.use_case}
- Timeline: ${lead.timeline || 'Not specified'}
- Lead Source: ${lead.lead_source || 'Unknown'}
- HubSpot Lead Score: ${lead.lead_score}
- Description: ${lead.tell_us_more || 'No additional details provided'}

RESEARCH FINDINGS:
${researchContext}`;

  try {
    const response = await callClaude(userPrompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 4096,
    });

    // Parse JSON response — strip markdown if Claude wraps it
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const data = JSON.parse(jsonStr) as Record<string, unknown>;

    // Ensure array fields are stringified
    const stringify = (val: unknown): string | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string') return val;
      return JSON.stringify(val);
    };

    const report: ReportInsert = {
      lead_id: lead.id,
      company_summary: (data.company_summary as string) || null,
      use_case_analysis: (data.use_case_analysis as string) || null,
      recent_news: stringify(data.recent_news),
      additional_opportunities: stringify(data.additional_opportunities),
      recommended_robot: (data.recommended_robot as string) || recommendRobotFallback(lead.use_case),
      recommendation_rationale: (data.recommendation_rationale as string) || null,
      recommendation_confidence: (data.recommendation_confidence as number) || 75,
      opportunity_score: (data.opportunity_score as number) || calculateFallbackScore(lead),
      talking_points: stringify(data.talking_points),
      roi_angles: stringify(data.roi_angles),
      risk_factors: stringify(data.risk_factors),
      competitor_context: (data.competitor_context as string) || null,
    };

    // Build sources from research
    const sources: SourceInsert[] = research.news.slice(0, 5).map((article) => ({
      lead_id: lead.id,
      title: article.title,
      url: article.url,
      description: `${article.source}${article.date ? ` — ${article.date}` : ''}: ${article.snippet.substring(0, 200)}`,
    }));

    // Add company website as a source if found
    if (research.company.website) {
      sources.unshift({
        lead_id: lead.id,
        title: `${lead.company} — Company Website`,
        url: research.company.website,
        description: research.company.description || 'Company homepage',
      });
    }

    return { report, sources };
  } catch (error) {
    console.error('Error generating report via Claude:', error);

    // Return a fallback report with sources from research
    const fallbackSources: SourceInsert[] = research.news.slice(0, 5).map((article) => ({
      lead_id: lead.id,
      title: article.title,
      url: article.url,
      description: `${article.source}${article.date ? ` — ${article.date}` : ''}: ${article.snippet.substring(0, 200)}`,
    }));

    if (research.company.website) {
      fallbackSources.unshift({
        lead_id: lead.id,
        title: `${lead.company} — Company Website`,
        url: research.company.website,
        description: research.company.description || 'Company homepage',
      });
    }

    return {
      report: buildFallbackReport(lead, research),
      sources: fallbackSources,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatResearchForPrompt(research: ResearchResult): string {
  let ctx = '';

  if (research.company.description) {
    ctx += `Company Description: ${research.company.description}\n`;
  }
  if (research.company.website) {
    ctx += `Website: ${research.company.website}\n`;
  }
  if (research.company.industry) {
    ctx += `Industry: ${research.company.industry}\n`;
  }
  if (research.company.size) {
    ctx += `Company Size: ${research.company.size}\n`;
  }

  if (research.news.length > 0) {
    ctx += '\nRecent News:\n';
    research.news.slice(0, 5).forEach((n) => {
      ctx += `- "${n.title}" (${n.source}${n.date ? `, ${n.date}` : ''})\n  ${n.snippet}\n`;
    });
  }

  return ctx || 'No additional research data available.';
}

function recommendRobotFallback(useCase: string): string {
  const uc = (useCase || '').toLowerCase();
  if (uc.includes('palletiz') || uc.includes('heavy') || uc.includes('packaging')) return 'Thor';
  if (uc.includes('weld') || uc.includes('machine tending') || uc.includes('material handling') || uc.includes('deburr') || uc.includes('finish')) return 'Core/RO1';
  if (uc.includes('assembl') || uc.includes('inspect') || uc.includes('test') || uc.includes('light')) return 'Spark';
  return 'Core/RO1'; // Safe default
}

function calculateFallbackScore(lead: Lead): number {
  let score = 50;
  if (lead.lead_score > 50) score += 15;
  if (lead.timeline && lead.timeline.includes('0-30')) score += 15;
  else if (lead.timeline && lead.timeline.includes('30-60')) score += 10;
  if (lead.tell_us_more && lead.tell_us_more.length > 50) score += 10;
  if (lead.phone) score += 5;
  return Math.min(100, score);
}

function buildFallbackReport(lead: Lead, research: ResearchResult): ReportInsert {
  const robot = recommendRobotFallback(lead.use_case);
  const spec = SB_ROBOTS[robot as keyof typeof SB_ROBOTS] || SB_ROBOTS['Core/RO1'];

  return {
    lead_id: lead.id,
    company_summary: `${lead.company} is a company${lead.state ? ` based in ${lead.state}` : ''}${lead.industry ? ` in the ${lead.industry} industry` : ''}. They submitted an inquiry about ${lead.use_case.toLowerCase()} automation${lead.tell_us_more ? `. They noted: "${lead.tell_us_more.substring(0, 200)}"` : ''}.`,
    use_case_analysis: `${lead.company} is interested in ${lead.use_case} automation. Further research and discovery call needed to fully assess their requirements and how Standard Bots can help.`,
    recent_news: JSON.stringify(research.news.slice(0, 3).map(n => ({ title: n.title, url: n.url, source: n.source, date: n.date }))),
    additional_opportunities: JSON.stringify([]),
    recommended_robot: robot,
    recommendation_rationale: `The ${robot} (${spec.price}) is recommended based on their stated ${lead.use_case.toLowerCase()} use case. It offers ${spec.payload} payload with ${spec.reach} reach. A discovery call will help confirm the best fit.`,
    recommendation_confidence: 60,
    opportunity_score: calculateFallbackScore(lead),
    talking_points: JSON.stringify([
      { topic: 'Primary Use Case', detail: `Discuss their ${lead.use_case} requirements in detail`, question: 'Can you walk me through your current process and where the bottlenecks are?' },
      { topic: 'Timeline', detail: `They indicated a ${lead.timeline || 'flexible'} timeline`, question: 'What is driving your timeline — is there a specific event or production target?' },
    ]),
    roi_angles: JSON.stringify([
      { angle: 'Labor Savings', explanation: 'Automating manual tasks can significantly reduce labor costs' },
    ]),
    risk_factors: JSON.stringify([
      { risk: 'Incomplete information', mitigation: 'Prioritize a discovery call to understand full requirements before quoting' },
    ]),
    competitor_context: 'Unknown — determine during discovery call which alternatives they are evaluating.',
  };
}
