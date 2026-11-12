import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { EnquirySchema } from "@/lib/schemas";
import { scoreLead } from "@/lib/llm";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const lead = parsed.data;

  // Idempotency: same contact + message = same lead
  const dedupeKey = createHash("sha256")
    .update(lead.contact + lead.message)
    .digest("hex");

  const { data: existing } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ status: "duplicate" }, { status: 200 });
  }

  const { result, latencyMs } = await scoreLead(lead.message);

  const { error } = await supabaseAdmin.from("leads").insert({
    ...lead,
    ...(result ?? { score: "warm" }),
    needs_review: result === null,
    llm_latency_ms: latencyMs,
    dedupe_key: dedupeKey,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ status: "duplicate" }, { status: 200 });
    }
    console.error("Insert failed", error);
    return NextResponse.json({ error: "Could not save lead" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" }, { status: 201 });
}