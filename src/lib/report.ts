export type ReportLead = {
  utm_source: string | null;
  utm_campaign: string | null;
  score: string | null;
  status: string;
};

export type CampaignRow = {
  source: string;
  campaign: string;
  total: number;
  hot: number;
  warm: number;
  cold: number;
  won: number;
  hotRate: number;
  winRate: number;
};

export function summarizeByCampaign(leads: ReportLead[]): CampaignRow[] {
  const map = new Map<string, CampaignRow>();
  for (const l of leads) {
    const source = l.utm_source || "direct";
    const campaign = l.utm_campaign || "(none)";
    const key = `${source}\u0000${campaign}`;
    const row =
      map.get(key) ??
      { source, campaign, total: 0, hot: 0, warm: 0, cold: 0, won: 0, hotRate: 0, winRate: 0 };
    row.total += 1;
    if (l.score === "hot") row.hot += 1;
    else if (l.score === "cold") row.cold += 1;
    else row.warm += 1;
    if (l.status === "won") row.won += 1;
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, hotRate: r.hot / r.total, winRate: r.won / r.total }))
    .sort((a, b) => b.total - a.total || a.source.localeCompare(b.source));
}

export function countByDay(
  leads: { created_at: string }[],
  days = 14,
  now: Date = new Date()
): { date: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const key = new Date(l.created_at).toLocaleDateString("en-CA");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toLocaleDateString("en-CA");
    out.push({ date, label: String(d.getDate()), count: counts.get(date) ?? 0 });
  }
  return out;
}