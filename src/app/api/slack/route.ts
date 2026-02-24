import { NextRequest, NextResponse } from 'next/server';
import {
  parseLeadMessage,
  validateParsedMessage,
  isLeadAlertMessage,
  verifySlackSignature,
} from '@/lib/slack';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Read the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');

    if (!signature || !timestamp) {
      console.error('Missing signature or timestamp headers');
      return NextResponse.json(
        { error: 'Missing signature or timestamp' },
        { status: 400 }
      );
    }

    // Verify Slack request signature
    const isValid = verifySlackSignature(signature, timestamp, rawBody);
    if (!isValid) {
      console.error('Invalid Slack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Only process event callbacks
    if (body.type !== 'event_callback') {
      return NextResponse.json({ ok: true });
    }

    const event = body.event;

    // Filter by channel ID
    if (!isLeadAlertMessage(event.channel, event.bot_id)) {
      console.log(
        `Ignoring message from channel ${event.channel} or bot ${event.bot_id}`
      );
      return NextResponse.json({ ok: true });
    }

    // Parse the message
    const text = event.text || '';
    const parsed = parseLeadMessage(text);
    const validation = validateParsedMessage(parsed);

    // Prepare lead data
    const leadData = {
      company: parsed.company,
      contact_name: parsed.contactName,
      job_title: parsed.jobTitle,
      phone: parsed.phone || null,
      email: parsed.email,
      state: parsed.state || null,
      country: parsed.country || null,
      use_case: parsed.useCase,
      timeline: parsed.timeline || null,
      lead_source: parsed.leadSource || null,
      lead_score: parsed.leadScore,
      tell_us_more: parsed.tellUsMore || null,
      raw_message: parsed.rawText,
      status: validation.valid ? 'pending' : 'invalid',
      validation_errors: validation.valid
        ? null
        : validation.missingFields.join(', '),
      slack_event_id: body.event_id,
      slack_timestamp: body.event_ts,
    };

    // Insert lead into database
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert lead' },
        { status: 500 }
      );
    }

    // Trigger async processing if valid
    if (validation.valid) {
      try {
        // Call process endpoint asynchronously (fire and forget)
        fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/process`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId: insertedLead.id }),
          }
        ).catch((err) => console.error('Error calling process endpoint:', err));
      } catch (err) {
        console.error('Error triggering async processing:', err);
      }
    }

    return NextResponse.json({
      ok: true,
      leadId: insertedLead.id,
      status: leadData.status,
    });
  } catch (error) {
    console.error('Error processing Slack event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
