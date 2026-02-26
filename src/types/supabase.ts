export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          company: string;
          contact_name: string;
          job_title: string;
          phone: string | null;
          email: string;
          state: string | null;
          country: string | null;
          website: string | null;
          industry: string | null;
          company_size: string | null;
          use_case: string;
          timeline: string | null;
          lead_source: string | null;
          lead_score: number;
          tell_us_more: string | null;
          raw_message: string;
          status: 'pending' | 'validating' | 'researching' | 'complete' | 'invalid';
          validation_errors: string | null;
          slack_event_id: string | null;
          slack_timestamp: string | null;
          assigned_to_name: string | null;
          assigned_to_email: string | null;
          assigned_to_slack_id: string | null;
          assigned_at: string | null;
          pipeline_stage: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company: string;
          contact_name: string;
          job_title: string;
          phone?: string | null;
          email: string;
          state?: string | null;
          country?: string | null;
          website?: string | null;
          industry?: string | null;
          company_size?: string | null;
          use_case: string;
          timeline?: string | null;
          lead_source?: string | null;
          lead_score: number;
          tell_us_more?: string | null;
          raw_message: string;
          status?: 'pending' | 'validating' | 'researching' | 'complete' | 'invalid';
          validation_errors?: string | null;
          slack_event_id?: string | null;
          slack_timestamp?: string | null;
          assigned_to_name?: string | null;
          assigned_to_email?: string | null;
          assigned_to_slack_id?: string | null;
          assigned_at?: string | null;
          pipeline_stage?: string;
        };
        Update: {
          company?: string;
          contact_name?: string;
          job_title?: string;
          phone?: string | null;
          email?: string;
          state?: string | null;
          country?: string | null;
          website?: string | null;
          industry?: string | null;
          company_size?: string | null;
          use_case?: string;
          timeline?: string | null;
          lead_source?: string | null;
          lead_score?: number;
          tell_us_more?: string | null;
          raw_message?: string;
          status?: 'pending' | 'validating' | 'researching' | 'complete' | 'invalid';
          validation_errors?: string | null;
          assigned_to_name?: string | null;
          assigned_to_email?: string | null;
          assigned_to_slack_id?: string | null;
          assigned_at?: string | null;
          pipeline_stage?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          lead_id: string;
          company_summary: string | null;
          use_case_analysis: string | null;
          recent_news: string | null;
          additional_opportunities: string | null;
          recommended_robot: string | null;
          recommendation_rationale: string | null;
          recommendation_confidence: number | null;
          opportunity_score: number | null;
          talking_points: string | null;
          roi_angles: string | null;
          risk_factors: string | null;
          competitor_context: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          lead_id: string;
          company_summary?: string | null;
          use_case_analysis?: string | null;
          recent_news?: string | null;
          additional_opportunities?: string | null;
          recommended_robot?: string | null;
          recommendation_rationale?: string | null;
          recommendation_confidence?: number | null;
          opportunity_score?: number | null;
          talking_points?: string | null;
          roi_angles?: string | null;
          risk_factors?: string | null;
          competitor_context?: string | null;
        };
        Update: {
          company_summary?: string | null;
          use_case_analysis?: string | null;
          recent_news?: string | null;
          additional_opportunities?: string | null;
          recommended_robot?: string | null;
          recommendation_rationale?: string | null;
          recommendation_confidence?: number | null;
          opportunity_score?: number | null;
          talking_points?: string | null;
          roi_angles?: string | null;
          risk_factors?: string | null;
          competitor_context?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: true;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      sources: {
        Row: {
          id: string;
          lead_id: string;
          title: string;
          url: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          title: string;
          url: string;
          description?: string | null;
        };
        Update: {
          title?: string;
          url?: string;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sources_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
