import {
  MessageCircle,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Database } from '@/types/supabase';

type Report = Database['public']['Tables']['reports']['Row'];

interface TalkingPointsProps {
  report: Report;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeParseArray(val: string | null | undefined): any[] {
  if (!val) return [];
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Extract the primary text from an object with varying key names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(item: any, ...keys: string[]): string {
  if (typeof item === 'string') return item;
  for (const k of keys) {
    if (item[k] && typeof item[k] === 'string') return item[k];
  }
  return '';
}

export default function TalkingPoints({ report }: TalkingPointsProps) {
  const talkingPoints = safeParseArray(report.talking_points);
  const roiAngles = safeParseArray(report.roi_angles);
  const riskFactors = safeParseArray(report.risk_factors);

  return (
    <div className="space-y-8">
      {/* Talking Points */}
      {talkingPoints.length > 0 && (
        <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 className="text-2xl font-bold text-sb-orange mb-6 flex items-center gap-3">
            <MessageCircle size={28} />
            Talking Points
          </h2>

          <div className="space-y-6">
            {talkingPoints.map((point, idx: number) => {
              const topic = extractText(point, 'topic', 'title', 'name');
              const detail = extractText(point, 'detail', 'description', 'explanation', 'text');
              const question = extractText(point, 'question', 'suggestedQuestion', 'suggested_question');

              return (
                <div key={idx} className="border-l-4 border-l-sb-orange pl-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-sb-orange bg-sb-bg px-3 py-1 rounded">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-bold text-sb-text mb-2">{topic}</h3>
                      {detail && (
                        <p className="text-sm text-sb-text-secondary mb-3">
                          {detail}
                        </p>
                      )}
                      {question && (
                        <p className="text-sm text-sb-orange italic">
                          &ldquo;Q: {question}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROI Angles */}
      {roiAngles.length > 0 && (
        <div className="bg-sb-card rounded-xl shadow-card p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 className="text-2xl font-bold text-sb-orange mb-6 flex items-center gap-3">
            <DollarSign size={28} />
            ROI Angles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roiAngles.map((angle, idx: number) => {
              const title = extractText(angle, 'angle', 'title', 'name', 'text');
              const detail = extractText(angle, 'explanation', 'description', 'detail', 'text');
              // If title and detail are the same (single-field item), just show one
              const showTitle = title && title !== detail;

              return (
                <div
                  key={idx}
                  className="bg-sb-bg border border-sb-orange/30 rounded-lg p-4"
                >
                  {showTitle && (
                    <p className="text-sm font-semibold text-sb-text mb-1">{title}</p>
                  )}
                  <p className="text-sm text-sb-text-secondary">{detail || title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="bg-sb-card rounded-xl shadow-card p-6 border border-sb-error/30" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 className="text-2xl font-bold text-sb-error mb-6 flex items-center gap-3">
            <AlertTriangle size={28} />
            Risk Factors to Address
          </h2>

          <div className="space-y-3">
            {riskFactors.map((risk, idx: number) => {
              const title = extractText(risk, 'risk', 'title', 'name', 'text');
              const detail = extractText(risk, 'mitigation', 'description', 'detail', 'explanation');

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-sb-bg/50 border-l-4 border-l-sb-error rounded"
                >
                  <span className="text-sb-error mt-1">•</span>
                  <div className="flex-1">
                    {title && <p className="text-sm font-semibold text-sb-text mb-1">{title}</p>}
                    {detail && detail !== title && (
                      <p className="text-sm text-sb-text-secondary">{detail}</p>
                    )}
                    {!detail && !title && (
                      <p className="text-sm text-sb-text-secondary">{typeof risk === 'string' ? risk : JSON.stringify(risk)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
