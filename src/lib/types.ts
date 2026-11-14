export type Lead = {
  id: string;
  created_at: string;
  name: string;
  contact: string;
  message: string;
  utm_source: string | null;
  utm_campaign: string | null;
  intent: string | null;
  score: "hot" | "warm" | "cold" | null;
  urgency: string | null;
  summary: string | null;
  suggested_reply: string | null;
  needs_review: boolean;
  status: "new" | "contacted" | "won" | "lost";
  llm_latency_ms: number | null;
};