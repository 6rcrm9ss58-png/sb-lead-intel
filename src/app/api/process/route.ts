import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLead,
  updateLeadStatus,
  createReport,
  addSources,
} from '@/lib/supabase';
import { validateLead, semanticValidateLead } from '@/lib/validator';
import { runFullResearch } from '@/lib/research';
import { generateReport } from '@/lib/report-builder';

const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[${label}] Attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  let leadId: string | undefined;

  try {
    const body = await request.json() as { lead_id?: string; leadId?: string };
    leadId = body.lead_id || body.leadId;

    if (!leadId) {
      return NextResponse.json({ error: 'Missing lead_id parameter' }, { status: 400 });
    }

    // ─── Step 0: Fetch lead ─────────────────────────────────────────
    let lead;
    try {
      lead = await fetchLead(leadId);
    } catch {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // ─── Step 1: Validate ───────────────────────────────────────────
    console.log(`[${leadId}] Starting validation...`);
    await updateLeadStatus(leadId, 'validating');

    const basicValidation = await validateLead(lead);
    console.log(`[${leadId}] Basic validation: score=${basicValidation.score}, valid=${basicValidation.isValid}`);

    // Clear failures → invalid
    if (!basicValidation.isValid && basicValidation.score < 40) {
      await updateLeadStatus(leadId, 'invalid', {
        validation_errors: basicValidation.reason,
      });
      return NextResponse.json({
        success: false,
        status: 'invalid',
        reason: basicValidation.reason,
        score: basicValidation.score,
      });
    }

    // Borderline leads get AI semantic validation
    let finalValidation = basicValidation;
    if (basicValidation.score >= 40 && basicValidation.score < 70) {
      console.log(`[${leadId}] Borderline — running semantic validation...`);
      try {
        finalValidation = await semanticValidateLead(lead);
        console.log(`[${leadId}] Semantic validation: score=${finalValidation.score}, valid=${finalValidation.isValid}`);
      } catch (err) {
        console.error(`[${leadId}] Semantic validation failed, using basic:`, err);
      }
    }

    if (!finalValidation.isValid && finalValidation.score < 50) {
      await updateLeadStatus(leadId, 'invalid', {
        validation_errors: finalValidation.reason,
      });
      return NextResponse.json({
        success: false,
        status: 'invalid',
        reason: finalValidation.reason,
        score: finalValidation.score,
      });
    }

    // ─── Step 2: Research ───────────────────────────────────────────
    console.log(`[${leadId}] Starting research for "${lead.company}"...`);
    await updateLeadStatus(leadId, 'researching');

    const research = await withRetry(
      () => runFullResearch(lead.company, lead.website || undefined),
      `${leadId}/research`,
    );
    console.log(`[${leadId}] Research complete: ${research.news.length} news articles found`);

    // ─── Step 3: Generate report ────────────────────────────────────
    console.log(`[${leadId}] Generating report...`);

    const { report: reportData, sources } = await withRetry(
      () => generateReport(lead, research),
      `${leadId}/report`,
    );

    // Save report
    const savedReport = await createReport(reportData);
    console.log(`[${leadId}] Report saved: ${savedReport.id}`);

    // Save sources
    if (sources.length > 0) {
      await addSources(sources);
      console.log(`[${leadId}] Saved ${sources.length} sources`);
    }

    // ─── Step 4: Mark complete ──────────────────────────────────────
    await updateLeadStatus(leadId, 'complete');
    console.log(`[${leadId}] Pipeline complete!`);

    // TODO: Post Slack thread reply when bot token is available
    // "✅ Research complete for {Company} — View Report → {url}"

    return NextResponse.json({
      success: true,
      status: 'complete',
      lead_id: leadId,
      report_id: savedReport.id,
      opportunity_score: savedReport.opportunity_score,
      recommended_robot: savedReport.recommended_robot,
      news_count: research.news.length,
      source_count: sources.length,
    });
  } catch (error) {
    console.error(`[${leadId || 'unknown'}] Pipeline error:`, error);

    // Try to mark as failed so it doesn't get stuck in "researching"
    if (leadId) {
      try {
        await updateLeadStatus(leadId, 'pending', {
          validation_errors: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Will retry.`,
        });
      } catch {
        // Can't even update status — just log
      }
    }

    return NextResponse.json(
      { error: 'Internal processing error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get('lead_id');

  if (!leadId) {
    return NextResponse.json(
      { error: 'Missing lead_id query parameter', usage: 'GET /api/process?lead_id=<uuid>' },
      { status: 400 },
    );
  }

  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ lead_id: leadId }),
    }),
  );
}
