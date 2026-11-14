"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { summarizeByCampaign, countByDay, type ReportLead } from "@/lib/report";
import { pct } from "@/lib/format";

const DISPLAY = "font-[family-name:var(--font-display)]";
type Row = ReportLead & { created_at: string };

export default function Report() {
  const [leads, setLeads] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("utm_source,utm_campaign,score,status,created_at");
      if (error) setError("Couldn't load the report. Refresh to try again.");
      else setLeads(data as Row[]);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo(() => summarizeByCampaign(leads), [leads]);
  const days = useMemo(() => countByDay(leads, 14), [leads]);
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const total = leads.length;
  const hot = leads.filter((l) => l.score === "hot").length;
  const won = leads.filter((l) => l.status === "won").length;
  const last14 = days.reduce((n, d) => n + d.count, 0);

  const stats = [
    { label: "Total leads", value: String(total) },
    { label: "Hot rate", value: total ? pct(hot / total) : "0%" },
    { label: "Win rate", value: total ? pct(won / total) : "0%" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <h1 className={`${DISPLAY} text-3xl font-semibold tracking-tight`}>Campaigns</h1>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-[#FBEAE8] px-3.5 py-2.5 text-sm text-[#8C1D18]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-[#35545C]">Loading report…</p>
      ) : total === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[#C9DADF] p-8 text-center text-[#35545C]">
          No leads yet. Open the home page with ?utm_source=facebook&amp;utm_campaign=test and send
          an enquiry to see it here.
        </p>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[#DDE7EA] bg-[#DDE7EA]">
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-5 py-4">
                <dt className="text-sm text-[#35545C]">{s.label}</dt>
                <dd className={`${DISPLAY} mt-1 text-3xl font-semibold`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-6 rounded-2xl border border-[#DDE7EA] bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Leads per day</h2>
              <p className="text-sm text-[#35545C]">{last14} in the last 14 days</p>
            </div>
            <div
              role="img"
              aria-label={`Bar chart of leads per day over the last 14 days, ${last14} in total`}
              className="mt-4 flex h-36 items-end gap-1.5"
            >
              {days.map((d) => (
                <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-xs text-[#35545C]">{d.count || ""}</span>
                  <div
                    title={`${d.date}: ${d.count}`}
                    style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 4 : 2 }}
                    className={`w-full rounded-t ${d.count ? "bg-[#1F8A8A]" : "bg-[#DDE7EA]"}`}
                  />
                  <span className="text-[11px] text-[#5C7279]">{d.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-[#DDE7EA] bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">By campaign</h2>
              <p className="flex items-center gap-4 text-sm text-[#35545C]">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#E0622C]" />Hot</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#E3A92B]" />Warm</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#5B8FA3]" />Cold</span>
              </p>
            </div>

            <ul className="mt-4 divide-y divide-[#EDF3F5]">
              {rows.map((r) => (
                <li
                  key={`${r.source}-${r.campaign}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.source}</p>
                    <p className="truncate text-sm text-[#35545C]">{r.campaign}</p>
                  </div>

                  <div className="order-last col-span-2 sm:order-none sm:col-span-1">
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-[#DDE7EA]">
                      <div style={{ width: pct(r.hot / r.total) }} className="bg-[#E0622C]" />
                      <div style={{ width: pct(r.warm / r.total) }} className="bg-[#E3A92B]" />
                      <div style={{ width: pct(r.cold / r.total) }} className="bg-[#5B8FA3]" />
                    </div>
                    <span className="sr-only">
                      {r.hot} hot, {r.warm} warm, {r.cold} cold
                    </span>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-medium">{r.total} {r.total === 1 ? "lead" : "leads"}</p>
                    <p className="text-[#35545C]">{pct(r.winRate)} won</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}