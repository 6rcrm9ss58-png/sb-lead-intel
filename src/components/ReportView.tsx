import { Report } from '@/lib/supabase';

interface ReportViewProps {
  report: Report;
}

export default function ReportView({ report }: ReportViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-sb-card border border-sb-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Report</h2>
        <p className="text-sb-text-secondary">
          Report ID: {report.id}
        </p>
        {report.opportunity_score && (
          <div className="mt-4">
            <p className="text-sm text-sb-text-secondary mb-2">Opportunity Score</p>
            <div className="w-full bg-sb-bg rounded-full h-2">
              <div
                className="bg-sb-orange h-2 rounded-full"
                style={{ width: `${report.opportunity_score}%` }}
              />
            </div>
            <p className="text-lg font-bold mt-2">{report.opportunity_score}/100</p>
          </div>
        )}
      </div>
    </div>
  );
}
