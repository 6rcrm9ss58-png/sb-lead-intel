import { App } from '@slack/bolt';
import { createHmac } from 'crypto';

export interface ParsedLeadMessage {
  company: string;
  contactName: string;
  jobTitle: string;
  phone: string;
  email: string;
  state: string;
  country: string;
  useCase: string;
  timeline: string;
  leadSource: string;
  leadScore: number;
  tellUsMore: string;
  rawText: string;
}

/**
 * Parse a Slack message from HubSpot into structured lead data
 * Handles *Label:* value format and multi-line "Tell Us More" fields
 */
export function parseLeadMessage(text: string): ParsedLeadMessage {
  const lines = text.split('\n');
  const parsed: Record<string, string | number> = {
    rawText: text,
  };

  let currentField = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a label line (starts with * and contains *)
    const labelMatch = line.match(/^\*([^*]+):\*\s*(.*)$/);

    if (labelMatch) {
      // Save previous field if exists
      if (currentField) {
        const fieldKey = normalizeFieldName(currentField);
        if (fieldKey) {
          parsed[fieldKey] = currentValue.trim();
        }
      }

      // Start new field
      currentField = labelMatch[1];
      currentValue = labelMatch[2];
    } else if (currentField) {
      // Continue accumulating value for current field (multi-line)
      if (currentValue) {
        currentValue += '\n' + line;
      } else {
        currentValue = line;
      }
    }
  }

  // Don't forget the last field
  if (currentField) {
    const fieldKey = normalizeFieldName(currentField);
    if (fieldKey) {
      parsed[fieldKey] = currentValue.trim();
    }
  }

  // Normalize lead score to number
  if (typeof parsed.leadScore === 'string') {
    parsed.leadScore = parseInt(parsed.leadScore, 10) || 0;
  }

  return {
    company: (parsed.company as string) || '',
    contactName: (parsed.contactName as string) || '',
    jobTitle: (parsed.jobTitle as string) || '',
    phone: (parsed.phone as string) || '',
    email: (parsed.email as string) || '',
    state: (parsed.state as string) || '',
    country: (parsed.country as string) || '',
    useCase: (parsed.useCase as string) || '',
    timeline: (parsed.timeline as string) || '',
    leadSource: (parsed.leadSource as string) || '',
    leadScore: (parsed.leadScore as number) || 0,
    tellUsMore: (parsed.tellUsMore as string) || '',
    rawText: text,
  };
}

/**
 * Normalize field names from Slack message to camelCase
 */
function normalizeFieldName(
  label: string
): keyof ParsedLeadMessage | undefined {
  const normalized = label.toLowerCase().replace(/\s+/g, ' ').trim();

  const fieldMap: Record<string, keyof ParsedLeadMessage> = {
    'company': 'company',
    'contact name': 'contactName',
    'job title': 'jobTitle',
    'phone': 'phone',
    'email': 'email',
    'state': 'state',
    'country / region': 'country',
    'country/region': 'country',
    'country': 'country',
    'use case': 'useCase',
    'timeline': 'timeline',
    'lead source': 'leadSource',
    'overall lead score': 'leadScore',
    'lead score': 'leadScore',
    'tell us more': 'tellUsMore',
  };

  return fieldMap[normalized];
}

/**
 * Validate a parsed message has all required fields
 */
export function validateParsedMessage(
  parsed: ParsedLeadMessage
): { valid: boolean; missingFields: string[] } {
  const required = [
    'company',
    'contactName',
    'jobTitle',
    'email',
    'useCase',
    'leadScore',
  ];
  const missing: string[] = [];

  for (const field of required) {
    const value = parsed[field as keyof ParsedLeadMessage];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Check if a message is from the lead alerts channel and HubSpot bot
 */
export function isLeadAlertMessage(
  channelId: string,
  botId?: string
): boolean {
  const LEAD_ALERTS_CHANNEL = 'C05B5QBJVAM';
  const HUBSPOT_BOT_ID = 'B02JNJTTULW';

  const channelMatch = channelId === LEAD_ALERTS_CHANNEL;
  const botMatch = !botId || botId === HUBSPOT_BOT_ID;

  return channelMatch && botMatch;
}

let slackApp: App | null = null;

/**
 * Create or return existing Slack app instance
 */
export function createSlackApp(): App {
  if (slackApp) {
    return slackApp;
  }

  const token = process.env.SLACK_BOT_TOKEN;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!token || !signingSecret) {
    throw new Error('SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET must be set');
  }

  slackApp = new App({
    token,
    signingSecret,
  });

  return slackApp;
}

/**
 * Get existing Slack app instance
 */
export function getSlackApp(): App {
  if (!slackApp) {
    throw new Error('Slack app not initialized');
  }
  return slackApp;
}

/**
 * Start the Slack listener (connect to Slack)
 */
export async function startSlackListener(): Promise<void> {
  const app = getSlackApp();
  const port = process.env.PORT || 3000;

  await app.start(Number(port));
  console.log('Slack bolt app started');
}

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error('SLACK_SIGNING_SECRET not set');
  }

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex');
  const expectedSignature = `v0=${hmac}`;

  return signature === expectedSignature;
}
