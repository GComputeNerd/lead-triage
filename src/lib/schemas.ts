import { z } from "zod";

export const EnquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().min(5).max(100),
  message: z.string().trim().min(5).max(2000),
  utm_source: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
});

export const ScoreSchema = z.object({
  intent: z.enum(["pricing", "booking", "complaint", "general", "spam"]),
  score: z.enum(["hot", "warm", "cold"]),
  urgency: z.enum(["low", "medium", "high"]),
  summary: z.string().max(300),
  suggested_reply: z.string().max(1000),
});

export type Score = z.infer<typeof ScoreSchema>;