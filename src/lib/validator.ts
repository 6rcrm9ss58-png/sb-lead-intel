import { Lead } from './supabase';
import { callClaude } from './anthropic';
import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  score: number;
}

// Load the Standard Bots reference for AI-assisted validation
function loadSBReference(): string {
  try {
    const refPath = path.join(process.cwd(), 'STANDARD_BOTS_REFERENCE.md');
    return fs.readFileSync(refPath, 'utf-8');
  } catch {
    return '';
  }
}

// ─── Main validation entry point ────────────────────────────────────

export async function validateLead(lead: Partial<Lead>): Promise<ValidationResult> {
  const issues: string[] = [];
  let score = 100;

  // Check required fields
  if (!lead.company || lead.company.trim() === '') {
    issues.push('Missing company name');
    score -= 20;
  }

  if (!lead.contact_name || lead.contact_name.trim() === '') {
    issues.push('Missing contact name');
    score -= 20;
  }

  if (!lead.email || lead.email.trim() === '') {
    issues.push('Missing email address');
    score -= 20;
  }

  // Validate email format
  if (lead.email) {
    if (!validateEmailFormat(lead.email)) {
      issues.push('Invalid email format');
      score -= 15;
    }
  }

  // Check email domain
  if (lead.email) {
    const domainCheck = checkEmailDomain(lead.email);
    if (!domainCheck.isValid) {
      issues.push(`Suspicious email: ${domainCheck.reason}`);
      score -= domainCheck.severity;
    } else if (domainCheck.severity > 0) {
      // Personal email — minor ding but not invalid
      issues.push(domainCheck.reason);
      score -= domainCheck.severity;
    }
  }

  // Check for suspicious company names
  if (lead.company && isGenericCompanyName(lead.company)) {
    issues.push('Generic company name (possible test/spam)');
    score -= 15;
  }

  // Check lead score — negative HubSpot scores are a red flag
  if (lead.lead_score !== undefined && lead.lead_score < 0) {
    issues.push(`Negative lead score (${lead.lead_score})`);
    score -= 15;
  }

  // Assess overall lead quality
  const quality = assessLeadQuality(lead);
  score = Math.round((score + quality.score) / 2);

  const isValid = score >= 50 && issues.filter(i => !i.startsWith('Personal email')).length <= 1;
  const reason = issues.length > 0 ? issues.join('; ') : 'Lead validation passed';

  return { isValid, reason, score: Math.max(0, Math.min(100, score)) };
}

// ─── Email validation ───────────────────────────────────────────────

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function checkEmailDomain(email: string): { isValid: boolean; reason: string; severity: number } {
  const [, domain] = email.split('@');
  if (!domain) {
    return { isValid: false, reason: 'No domain found', severity: 20 };
  }

  const d = domain.toLowerCase();

  // Fake / test domains
  const fakeDomains = ['test.com', 'example.com', 'fake.com', 'invalid.com', 'localhost', 'noemail.com', 'sample.com'];
  if (fakeDomains.includes(d)) {
    return { isValid: false, reason: 'Test/fake domain', severity: 25 };
  }

  // Disposable email providers
  const disposable = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com', 'throwaway.email', 'yopmail.com'];
  if (disposable.includes(d)) {
    return { isValid: false, reason: 'Disposable email provider', severity: 20 };
  }

  // Personal email — not invalid, but lower quality for B2B
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'];
  if (personalDomains.includes(d)) {
    return { isValid: true, reason: `Personal email (${d})`, severity: 8 };
  }

  return { isValid: true, reason: 'Company domain', severity: 0 };
}

// ─── Quality assessment ─────────────────────────────────────────────

export function assessLeadQuality(lead: Partial<Lead>): { score: number; details: Record<string, number> } {
  const details: Record<string, number> = {
    basicInfo: 0,
    useCase: 0,
    timeline: 0,
    engagement: 0,
  };

  // Basic info completeness (0-25)
  if (lead.company) details.basicInfo += 10;
  if (lead.contact_name) details.basicInfo += 8;
  if (lead.email) details.basicInfo += 7;

  // Use case quality (0-25)
  if (lead.use_case && lead.use_case !== 'Other') {
    details.useCase = 25;
  } else if (lead.use_case) {
    details.useCase = 10;
  }

  // Timeline (0-25)
  if (lead.timeline) {
    const t = lead.timeline.toLowerCase();
    if (t.includes('0-30') || t.includes('immediate') || t.includes('asap')) {
      details.timeline = 25;
    } else if (t.includes('30-60') || t.includes('60-90')) {
      details.timeline = 18;
    } else if (t.includes('90+') || t.includes('quarter')) {
      details.timeline = 10;
    } else {
      details.timeline = 8;
    }
  }

  // Engagement signals (0-25)
  let eng = 0;
  if (lead.tell_us_more && lead.tell_us_more.length > 30) eng += 15;
  else if (lead.tell_us_more && lead.tell_us_more.length > 10) eng += 8;
  if (lead.phone) eng += 5;
  if (lead.job_title) eng += 5;
  details.engagement = Math.min(25, eng);

  const total = Object.values(details).reduce((a, b) => a + b, 0);
  return { score: total, details };
}

// ─── Generic / spam name detection ──────────────────────────────────

function isGenericCompanyName(name: string): boolean {
  const generic = [
    'test company', 'test', 'demo', 'example', 'sample',
    'company', 'business', 'startup', 'n/a', 'none',
    'abc', 'xyz', 'asdf', 'qwerty',
  ];
  return generic.includes(name.toLowerCase().trim());
}

// ─── Claude-powered semantic validation (for borderline leads) ──────

export async function semanticValidateLead(lead: Partial<Lead>): Promise<ValidationResult> {
  try {
    const sbRef = loadSBReference();

    const leadSummary = `
Company: ${lead.company || 'N/A'}
Contact: ${lead.contact_name || 'N/A'} (${lead.job_title || 'No title'})
Email: ${lead.email || 'N/A'}
Phone: ${lead.phone || 'N/A'}
State: ${lead.state || 'N/A'}
Use Case: ${lead.use_case || 'N/A'}
Timeline: ${lead.timeline || 'N/A'}
Lead Score: ${lead.lead_score ?? 'N/A'}
Tell Us More: ${lead.tell_us_more || 'N/A'}
`.trim();

    const systemPrompt = `You are a lead qualification expert for Standard Bots, a collaborative robotics company.
Your job is to assess whether an inbound lead is a legitimate business inquiry worth researching.

${sbRef ? `Standard Bots Product Reference:\n${sbRef}\n` : ''}

Return ONLY valid JSON with these fields:
- isValid (boolean): true if this is a real business lead worth researching
- reason (string): 1-2 sentence explanation
- score (number): 0-100 confidence that this is a quality lead

Factors that INCREASE score: company domain email, specific use case matching SB products (welding, palletizing, machine tending, material handling, inspection), detailed "tell us more", positive HubSpot score, timeline urgency, job title suggesting decision-maker.

Factors that DECREASE score: personal email (gmail, etc), vague or missing description, generic company name, negative HubSpot score, "Other" use case with no detail, no phone number.`;

    const response = await callClaude(leadSummary, {
      systemPrompt,
      temperature: 0.2,
      maxTokens: 256,
    });

    // Extract JSON from response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    const parsed = JSON.parse(jsonStr) as { isValid?: boolean; reason?: string; score?: number };
    return {
      isValid: parsed.isValid ?? false,
      reason: parsed.reason ?? 'Unable to determine',
      score: parsed.score ?? 0,
    };
  } catch (error) {
    console.error('Semantic validation error, falling back to basic:', error);
    return validateLead(lead);
  }
}
