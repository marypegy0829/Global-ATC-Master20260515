export interface UserProfile {
  id: string; // UUID from auth.users
  name: string | null;
  aircraft_type: string | null;
  rank: string | null;
  country: string | null;
  created_at: string;
}

export type BatchStatus = 'processing' | 'completed' | 'failed';

export interface AtcBatch {
  id: string; // UUID
  user_id: string; // UUID
  country_code: string | null;
  status: BatchStatus;
  created_at: string;
}

export interface AtcSegment {
  id: string; // UUID
  batch_id: string; // UUID
  sequence_order: number; // 1-10
  audio_url: string | null;
  raw_text: string | null;
  translated_text: string | null;
  created_at: string;
}

export interface CbtaReport {
  id: string; // UUID
  batch_id: string; // UUID
  pronunciation_score: number | null; // 1-6
  structure_score: number | null; // 1-6
  vocabulary_score: number | null; // 1-6
  fluency_score: number | null; // 1-6
  comprehension_score: number | null; // 1-6
  interaction_score: number | null; // 1-6
  json_details: {
    positive_performance?: string[];
    threats_and_errors?: string[];
    instructor_debrief?: string;
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<UserProfile, 'id'>>;
      };
      atc_batches: {
        Row: AtcBatch;
        Insert: Omit<AtcBatch, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<AtcBatch, 'id'>>;
      };
      atc_segments: {
        Row: AtcSegment;
        Insert: Omit<AtcSegment, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<AtcSegment, 'id'>>;
      };
      cbta_reports: {
        Row: CbtaReport;
        Insert: Omit<CbtaReport, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<CbtaReport, 'id'>>;
      };
    };
  };
}
