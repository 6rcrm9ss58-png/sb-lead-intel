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

interface TalkingPoint {
  topic?: string;
  title?: string;
  detail?: string;
  description?: string;
  question?: string;
  suggestedQuestion?: string;
}

interface RoiAngle {
  text?: string;
  description?: string;
}

interface RiskFactor {
  text?: string;
  description?: string;
}

export default function TalkingPoints({ report }: TalkingPointsProps) {
  let talkingPoints: TalkingPoint[] = [];
  let roiAngles: RoiAngle[] = [];
  let riskFactors: RiskFactor[] = [];

  // Parse talking points
  if (typeof report.talking_points === 'string') {
    try {
      talkingPoints = JSON.parse(report.talking_points);
    } catch {
      talkingPoints = [];
    }
  } else if (Array.isArray(report.talking_points)) {
    talkingPoints = report.talking_points;
  }

  // Parse ROI angles
  if (typeof report.roi_angles === 'string') {
    try {
      roiAngles = JSON.parse(report.roi_angles);
    } catch {
      roiAngles = [];
    }
  } else if (Array.isArray(report.roi_angles)) {
    roiAngles = report.roi_angles;
  }

  // Parse risk factors
  if (typeof report.risk_factors === 'string') {
    try {
      riskFactors = JSON.parse(report.risk_factors);
    } catch {
      riskFactors = [];
    }
  } else if (Array.isArray(report.risk_factors)) {
    riskFactors = report.risk_factors;
  }

  return (
    <div className="space-y-8">
      {/* Talking Points */}
      {talkingPoints.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-sb-orange mb-6 flex items-center gap-3">
            <MessageCircle size={28} />
            Talking Points
          </h2>

          <div className="space-y-6">
            {talkingPoints.map((point: TalkingPoint, idx: number) => {
              const topic = typeof point === 'string' ? point : point.topic || point.title || '';
              const detail = point.detail || point.description || '';
              const question = point.question || point.suggestedQuestion || '';

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
        <div className="card">
          <h2 className="text-2xl font-bold text-sb-orange mb-6 flex items-center gap-3">
            <DollarSign size={28} />
            ROI Angles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roiAngles.map((angle: RoiAngle, idx: number) => {
              const text = typeof angle === 'string' ? angle : angle.text || angle.description || '';

              return (
                <div
                  key={idx}
                  className="bg-sb-bg border border-sb-orange/30 rounded-lg p-4"
                >
                  <p className="text-sm text-sb-text-secondary">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="card border border-sb-error/30">
          <h2 className="text-2xl font-bold text-sb-error mb-6 flex items-center gap-3">
            <AlertTriangle size={28} />
            Risk Factors to Address
          </h2>

          <div className="space-y-3">
            {riskFactors.map((risk: RiskFactor, idx: number) => {
              const text = typeof risk === 'string' ? risk : risk.text || risk.description || '';

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-sb-bg/50 border-l-4 border-l-sb-error rounded"
                >
                  <span className="text-sb-error mt-1">•</span>
                  <p className="text-sm text-sb-text-secondary">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
