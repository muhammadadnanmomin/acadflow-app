/* ------------------------------------------------------------------ */
/*  Conference Proceedings — TypeScript types                          */
/* ------------------------------------------------------------------ */

export interface ConferenceProceedings {
  id: string;
  conference_id: string;
  title: string;
  description: string | null;
  file_path: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProceedingsAccessLog {
  id: string;
  user_id: string;
  conference_id: string;
  accessed_at: string;
}
