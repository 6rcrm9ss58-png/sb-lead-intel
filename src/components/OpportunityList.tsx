import {
  Wrench,
  Package,
  Search,
  Box,
  Cog,
  Paintbrush,
  LucideIcon,
} from 'lucide-react';
import { Database } from '@/types/supabase';

type Report = Database['public']['Tables']['reports']['Row'];

interface OpportunityListProps {
  report: Report;
}

interface Opportunity {
  useCase?: string;
  name?: string;
  robot?: string;
  recommended?: string;
  explanation?: string;
  description?: string;
}

const OPPORTUNITY_ICONS: Record<string, LucideIcon> = {
  'welding': Wrench,
  'material handling': Package,
  'inspection': Search,
  'palletizing': Box,
  'machine tending': Cog,
  'finishing': Paintbrush,
};

export default function OpportunityList({ report }: OpportunityListProps) {
  let opportunities: Opportunity[] = [];

  if (typeof report.additional_opportunities === 'string') {
    try {
      opportunities = JSON.parse(report.additional_opportunities);
    } catch {
      opportunities = [];
    }
  } else if (Array.isArray(report.additional_opportunities)) {
    opportunities = report.additional_opportunities;
  }

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-sb-orange mb-6">
        Additional Opportunities
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {opportunities.map((opp: Opportunity, idx: number) => {
          const useCase = typeof opp === 'string' ? opp : opp.useCase || opp.name || '';
          const robot = opp.robot || opp.recommended || '';
          const explanation = opp.explanation || opp.description || '';
          
          const iconKey = useCase.toLowerCase();
          const IconComponent =
            OPPORTUNITY_ICONS[iconKey] || Package;

          return (
            <div
              key={idx}
              className="card border-l-4 border-l-sb-orange hover:border-b-4 hover:border-b-sb-orange transition"
            >
              <div className="flex items-start gap-4">
                <IconComponent
                  size={24}
                  className="text-sb-orange flex-shrink-0 mt-1"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-sb-text mb-2">
                    {useCase}
                  </h3>
                  {robot && (
                    <p className="text-sm text-sb-orange font-semibold mb-2">
                      Fits: {robot}
                    </p>
                  )}
                  {explanation && (
                    <p className="text-sm text-sb-text-secondary leading-relaxed">
                      {explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
