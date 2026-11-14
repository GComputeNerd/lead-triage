"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Lead } from "@/lib/types";
import { timeAgo, whatsappUrl } from "@/lib/format";

const DISPLAY = "font-[family-name:var(--font-display)]";
const STATUSES: Lead["status"][] = ["new", "contacted", "won", "lost"];

const DOT: Record<string, string> = {
  hot: "bg-[#E0622C]",
  warm: "bg-[#E3A92B]",
  cold: "bg-[#5B8FA3]",
};
const SCORE_PILL: Record<string, string> = {
  hot: "bg-[#FDE3D3] text-[#7A3110]",
  warm: "bg-[#FFF0C2] text-[#5E4700]",
  cold: "bg-[#DCEAEF] text-[#21495A]",
};
const STATUS_PILL: Record<Lead["status"], string> = {
  new: "bg-[#DDF0F2] text-[#0F5257]",
  contacted: "bg-[#EAE7F7] text-[#403273]",
  won: "bg-[#DDF1E3] text-[#1D5B33]",
  lost: "bg-[#ECEFF0] text-[#4A5A60]",
};

const FIELD =
  "rounded-lg border border-[#C9DADF] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#1F8A8A] focus:ring-2 focus:ring-[#1F8A8A]/30";

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"all" | Lead["status"]>("all");
  const [score, setScore] = useState("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setError("Couldn't load leads. Check your connection and refresh.");
      else setLeads(data as Lead[]);
      setLoading(false);
    })();
  }, []);

  const counts = useMemo(() => {
    const c: Record<"all" | Lead["status"], number> = {
      all: leads.length, new: 0, contacted: 0, won: 0, lost: 0,
    };
    leads.forEach((l) => c[l.status]++);
    return c;
  }, [leads]);

  const openHot = leads.filter(
    (l) => l.score === "hot" && (l.status === "new" || l.status === "contacted")
  ).length;
  const needsReview = leads.filter((l) => l.needs_review).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (status === "all" || l.status === status) &&
        (score === "all" || l.score === score) &&
        (!reviewOnly || l.needs_review) &&
        (!q ||
          l.name.toLowerCase().includes(q) ||
          l.contact.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q))
    );
  }, [leads, status, score, reviewOnly, query]);

  async function updateStatus(id: string, next: Lead["status"]) {
    const previous = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: next } : l)));
    const { error } = await supabase.from("leads").update({ status: next }).eq("id", id);
    if (error) {
      setLeads(previous);
      setError("Couldn't update that lead. Try again.");
    }
  }

  const close = useCallback(() => setSelectedId(null), []);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const stats = [
    { label: "Total leads", value: counts.all },
    { label: "New", value: counts.new },
    { label: "Hot and still open", value: openHot },
    { label: "Needs review", value: needsReview },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className={`${DISPLAY} text-3xl font-semibold tracking-tight`}>Leads</h1>
        <input
          type="search"
          aria-label="Search leads"
          placeholder="Search name, contact or message"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${FIELD} w-full sm:w-72`}
        />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#DDE7EA] bg-[#DDE7EA] lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white px-5 py-4">
            <dt className="text-sm text-[#35545C]">{s.label}</dt>
            <dd className={`${DISPLAY} mt-1 text-3xl font-semibold`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by status" className="inline-flex flex-wrap gap-1 rounded-xl bg-[#DDE7EA] p-1">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1F8A8A] ${
                status === s ? "bg-white shadow-sm" : "text-[#35545C] hover:text-[#0F2B33]"
              }`}
            >
              {s} <span className="text-[#5C7279]">{counts[s]}</span>
            </button>
          ))}
        </div>

        <select aria-label="Filter by score" value={score} onChange={(e) => setScore(e.target.value)} className={FIELD}>
          <option value="all">Any score</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reviewOnly} onChange={(e) => setReviewOnly(e.target.checked)} />
          Needs review only
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-[#FBEAE8] px-3.5 py-2.5 text-sm text-[#8C1D18]">
          {error}
        </p>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-[#35545C]">Loading leads…</p>
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#C9DADF] p-8 text-center text-[#35545C]">
            {leads.length === 0
              ? "No leads yet. Submit an enquiry on the home page to add one."
              : "No leads match these filters. Clear a filter or change your search."}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#DDE7EA] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#DDE7EA] bg-[#F6FAFB] text-[#35545C]">
                <tr>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Message</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => {
                  const sc = l.score ?? "warm";
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedId(l.id)}
                      className={`cursor-pointer border-b border-[#EDF3F5] last:border-0 hover:bg-[#F6FAFB] ${
                        l.id === selectedId ? "bg-[#F0F7F8]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[sc]}`} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedId(l.id)}
                              className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A8A]"
                            >
                              {l.name}
                            </button>
                            <div className="truncate text-[#35545C]">{l.contact}</div>
                            {l.needs_review && (
                              <span className="mt-1 inline-block rounded bg-[#FBEAE8] px-1.5 py-0.5 text-xs font-medium text-[#8C1D18]">
                                AI scoring failed
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden max-w-xs px-4 py-3 text-[#35545C] lg:table-cell">
                        <p className="truncate">{l.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SCORE_PILL[sc]}`}>
                          {sc}
                        </span>
                        {l.intent && <div className="mt-1 text-[#35545C]">{l.intent}</div>}
                      </td>
                      <td className="hidden px-4 py-3 text-[#35545C] md:table-cell">
                        {l.utm_source ?? "direct"}
                        {l.utm_campaign && <div>{l.utm_campaign}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_PILL[l.status]}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-[#35545C]">
                        {timeAgo(l.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <LeadDrawer lead={selected} onClose={close} onStatus={updateStatus} />}
    </div>
  );
}

function LeadDrawer({
  lead,
  onClose,
  onStatus,
}: {
  lead: Lead;
  onClose: () => void;
  onStatus: (id: string, s: Lead["status"]) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sc = lead.score ?? "warm";
  const wa = whatsappUrl(lead.contact);
  const isEmail = lead.contact.includes("@");
  const link =
    "text-sm font-medium text-[#1F6F73] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A8A]";

  async function copyReply() {
    if (!lead.suggested_reply) return;
    try {
      await navigator.clipboard.writeText(lead.suggested_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[#0F2B33]/40" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-title"
        className="absolute right-0 top-0 flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl sm:max-w-md"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#DDE7EA] p-5">
          <div>
            <h2 id="lead-title" className={`${DISPLAY} text-2xl font-semibold`}>
              {lead.name}
            </h2>
            <p className="mt-0.5 text-sm text-[#35545C]">
              {new Date(lead.created_at).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="rounded-lg border border-[#C9DADF] px-3 py-1.5 text-sm font-medium hover:bg-[#F6FAFB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A8A]"
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5 text-sm">
          {lead.needs_review && (
            <p className="rounded-lg bg-[#FBEAE8] px-3.5 py-2.5 text-[#8C1D18]">
              AI scoring failed for this lead, so it was saved as warm. Read the message and
              judge it yourself.
            </p>
          )}

          <section>
            <h3 className="font-semibold">Contact</h3>
            <p className="mt-1 text-[#35545C]">{lead.contact}</p>
            <div className="mt-1.5 flex gap-4">
              {isEmail ? (
                <a className={link} href={`mailto:${lead.contact}`}>Send email</a>
              ) : (
                <a className={link} href={`tel:${lead.contact.replace(/\s/g, "")}`}>Call</a>
              )}
              {wa && (
                <a className={link} href={wa} target="_blank" rel="noopener noreferrer">
                  Open WhatsApp
                </a>
              )}
            </div>
          </section>

          <section>
            <h3 className="font-semibold">Message</h3>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-[#F6FAFB] p-3 leading-relaxed">
              {lead.message}
            </p>
          </section>

          <section>
            <h3 className="font-semibold">AI assessment</h3>
            <dl className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2">
              <dt className="text-[#35545C]">Score</dt>
              <dd>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SCORE_PILL[sc]}`}>{sc}</span>
              </dd>
              <dt className="text-[#35545C]">Intent</dt>
              <dd>{lead.intent ?? "Not available"}</dd>
              <dt className="text-[#35545C]">Urgency</dt>
              <dd>{lead.urgency ?? "Not available"}</dd>
            </dl>
            {lead.summary && <p className="mt-3 text-[#35545C]">{lead.summary}</p>}
          </section>

          {lead.suggested_reply && (
            <section>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Suggested reply</h3>
                <button type="button" onClick={copyReply} className={link}>
                  {copied ? "Copied" : "Copy reply"}
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap rounded-lg border border-[#C9DADF] p-3 leading-relaxed">
                {lead.suggested_reply}
              </p>
            </section>
          )}

          <section>
            <h3 className="font-semibold">Status</h3>
            <div role="group" aria-label="Lead status" className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-[#DDE7EA] p-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={lead.status === s}
                  onClick={() => onStatus(lead.id, s)}
                  className={`rounded-lg px-2 py-2 font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1F8A8A] ${
                    lead.status === s ? "bg-white shadow-sm" : "text-[#35545C] hover:text-[#0F2B33]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="text-[#35545C]">
            <p>
              Source: {lead.utm_source ?? "direct"}
              {lead.utm_campaign ? `, campaign ${lead.utm_campaign}` : ""}
            </p>
            {lead.llm_latency_ms != null && <p>AI response time: {lead.llm_latency_ms} ms</p>}
          </section>
        </div>
      </aside>
    </div>
  );
}