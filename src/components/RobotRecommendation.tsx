import { Bot, Cpu, Weight, Ruler, DollarSign } from 'lucide-react';
import { Database } from '@/types/supabase';

type Report = Database['public']['Tables']['reports']['Row'];

interface RobotRecommendationProps {
  report: Report;
}

interface RobotSpec {
  price: string;
  payload: string;
  reach: string;
  repeatability: string;
}

const ROBOT_SPECS: Record<string, RobotSpec> = {
  'Spark': {
    price: '$29,500',
    payload: '7kg',
    reach: '625mm',
    repeatability: '±0.02mm',
  },
  'Core': {
    price: '$37,000',
    payload: '18kg',
    reach: '930mm',
    repeatability: '±0.02mm',
  },
  'RO1': {
    price: '$37,000',
    payload: '18kg',
    reach: '930mm',
    repeatability: '±0.02mm',
  },
  'Thor': {
    price: '$49,500',
    payload: '30kg',
    reach: '1300mm',
    repeatability: '±0.05mm',
  },
  'Bolt': {
    price: 'Coming 2026',
    payload: 'Bimanual',
    reach: 'Full body',
    repeatability: 'Precision humanoid',
  },
};

export default function RobotRecommendation({ report }: RobotRecommendationProps) {
  const robotName = report.recommended_robot || 'Unknown';
  const specs = ROBOT_SPECS[robotName] || ROBOT_SPECS['Spark'];
  const confidence = report.recommendation_confidence || 75;

  return (
    <div className="bg-sb-card rounded-xl shadow-card p-6 sticky top-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="mb-6">
        <p className="text-xs text-sb-text-secondary uppercase tracking-wide mb-3">
          <Bot size={14} className="inline mr-2" />
          Recommended Solution
        </p>
        <h2 className="text-3xl font-bold text-sb-orange">{robotName}</h2>
      </div>

      {/* Key Specs */}
      <div className="space-y-4 mb-6 border-t border-b border-sb-border py-6">
        {/* Price */}
        <div className="flex items-center gap-3">
          <DollarSign size={16} className="text-sb-orange flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-sb-text-secondary">Price</p>
            <p className="text-sm font-semibold text-sb-text">{specs.price}</p>
          </div>
        </div>

        {/* Payload */}
        <div className="flex items-center gap-3">
          <Weight size={16} className="text-sb-orange flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-sb-text-secondary">Payload</p>
            <p className="text-sm font-semibold text-sb-text">{specs.payload}</p>
          </div>
        </div>

        {/* Reach */}
        <div className="flex items-center gap-3">
          <Ruler size={16} className="text-sb-orange flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-sb-text-secondary">Reach</p>
            <p className="text-sm font-semibold text-sb-text">{specs.reach}</p>
          </div>
        </div>

        {/* Repeatability */}
        <div className="flex items-center gap-3">
          <Cpu size={16} className="text-sb-orange flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-sb-text-secondary">Precision</p>
            <p className="text-sm font-semibold text-sb-text">
              {specs.repeatability}
            </p>
          </div>
        </div>
      </div>

      {/* Why This Robot */}
      {report.recommendation_rationale && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-sb-orange mb-3">
            Why this robot
          </h3>
          <p className="text-xs text-sb-text-secondary leading-relaxed">
            {report.recommendation_rationale}
          </p>
        </div>
      )}

      {/* Confidence Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-sb-text-secondary">Confidence</p>
          <p className="text-sm font-semibold text-sb-orange">{confidence}%</p>
        </div>
        <div className="w-full h-2 bg-sb-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sb-error via-sb-orange to-sb-success transition-all duration-500"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
