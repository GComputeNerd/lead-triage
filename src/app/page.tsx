"use client";

import { useState } from "react";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"] });
const body = Figtree({ subsets: ["latin"] });

type FieldKey = "name" | "contact" | "message";
type Status = "idle" | "sending" | "done" | "error";

const FIELD_MESSAGES: Record<FieldKey, string> = {
  name: "Enter your name.",
  contact: "Enter a phone number or email so we can reply.",
  message: "Tell us a little more (at least 5 characters).",
};

const SHADES = [
  { code: "B1", color: "#FBF9F2" },
  { code: "A1", color: "#F3EEDF" },
  { code: "B2", color: "#ECE4CF" },
  { code: "D2", color: "#E5DBC4" },
  { code: "A2", color: "#DED2B7" },
  { code: "C1", color: "#D7CAAB" },
  { code: "A3", color: "#D0C09D" },
  { code: "D4", color: "#C7B58E" },
];

const TOPICS = [
  { label: "Teeth whitening", text: "Hi, I'd like to know more about teeth whitening." },
  { label: "Braces", text: "Hi, I'd like to ask about braces or aligners." },
  { label: "Check-up and cleaning", text: "Hi, I'd like to book a check-up and cleaning." },
  { label: "Toothache", text: "Hi, I have a toothache and need to be seen soon." },
];

const INPUT =
  "w-full rounded-lg border border-[#B9CDD3] bg-white px-3.5 py-3 text-base text-[#0F2B33] placeholder:text-[#5C7279] outline-none transition-colors focus:border-[#1F8A8A] focus:ring-2 focus:ring-[#1F8A8A]/30 aria-[invalid=true]:border-[#B3261E] aria-[invalid=true]:focus:ring-[#B3261E]/25";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#0F2B33]">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-[#B3261E]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState({ name: "", contact: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState("");

  function update(key: FieldKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    setFormError("");
    const params = new URLSearchParams(window.location.search);

    try {
      const res = await fetch("/api/webhooks/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          contact: values.contact,
          message: values.message,
          utm_source: params.get("utm_source") ?? undefined,
          utm_campaign: params.get("utm_campaign") ?? undefined,
        }),
      });

      if (res.ok) {
        setStatus("done");
        return;
      }

      if (res.status === 400) {
        const data = await res.json().catch(() => null);
        const fieldErrors = data?.error?.fieldErrors ?? {};
        const next: Partial<Record<FieldKey, string>> = {};
        (Object.keys(FIELD_MESSAGES) as FieldKey[]).forEach((k) => {
          if (fieldErrors[k]) next[k] = FIELD_MESSAGES[k];
        });
        setErrors(next);
        if (Object.keys(next).length === 0) {
          setFormError("Some details look wrong. Check the form and try again.");
        }
      } else {
        setFormError("We couldn't send your enquiry. Try again in a moment.");
      }
      setStatus("error");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  function reset() {
    setValues({ name: "", contact: "", message: "" });
    setErrors({});
    setFormError("");
    setStatus("idle");
  }

  return (
    <main className={`${body.className} min-h-screen bg-[#EAF2F4] text-[#0F2B33]`}>
      {/* Shade guide: decorative */}
      <div aria-hidden="true" className="mx-auto flex max-w-5xl gap-1 px-4 sm:gap-1.5 sm:px-8">
        {SHADES.map((s, i) => (
          <div
            key={s.code}
            style={{ backgroundColor: s.color }}
            className={`flex flex-1 items-end justify-center rounded-b-[999px] border-x border-b border-black/10 pb-3 text-[11px] font-medium text-[#0F2B33]/70 ${
              i % 2 === 0 ? "h-14 sm:h-20" : "h-11 sm:h-16"
            }`}
          >
            {s.code}
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-8 md:grid-cols-[1fr_1.1fr] md:gap-14 md:py-16">
        {/* Left: context */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="text-base font-semibold text-[#1F6F73]">Demo Dental</p>
            <h1
              className={`${display.className} text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl`}
            >
              Ask us anything about your smile.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-[#35545C]">
              Send a message and our team will reply by phone or email during clinic hours.
              No booking needed to ask a question.
            </p>
          </div>

          <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-base">
            <dt className="font-medium">Mon to Fri</dt>
            <dd className="text-[#35545C]">9:00 am to 6:00 pm</dd>
            <dt className="font-medium">Saturday</dt>
            <dd className="text-[#35545C]">9:00 am to 1:00 pm</dd>
            <dt className="font-medium">Sunday</dt>
            <dd className="text-[#35545C]">Closed</dd>
          </dl>
        </section>

        {/* Right: form */}
        <section className="rounded-3xl border border-[#C9DADF] bg-white p-6 shadow-[0_1px_0_#C9DADF] sm:p-8">
          {status === "done" ? (
            <div role="status" className="flex flex-col gap-4 py-6">
              <h2 className={`${display.className} text-3xl font-semibold tracking-tight`}>
                Enquiry sent
              </h2>
              <p className="text-lg leading-relaxed text-[#35545C]">
                Thanks, {values.name.split(" ")[0] || "there"}. We&rsquo;ll reply to{" "}
                <span className="font-medium text-[#0F2B33]">{values.contact}</span> during
                clinic hours.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 w-fit rounded-lg border border-[#B9CDD3] px-4 py-2.5 text-base font-medium transition-colors hover:bg-[#EAF2F4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A8A]"
              >
                Send another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">What is this about?</p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => {
                    const selected = values.message === t.text;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => update("message", t.text)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A8A] ${
                          selected
                            ? "border-[#0F2B33] bg-[#0F2B33] text-white"
                            : "border-[#B9CDD3] hover:border-[#1F8A8A] hover:bg-[#EAF2F4]"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field id="name" label="Your name" error={errors.name}>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={INPUT}
                />
              </Field>

              <Field id="contact" label="Phone or email" error={errors.contact}>
                <input
                  id="contact"
                  name="contact"
                  autoComplete="email"
                  required
                  maxLength={100}
                  value={values.contact}
                  onChange={(e) => update("contact", e.target.value)}
                  aria-invalid={!!errors.contact}
                  aria-describedby={errors.contact ? "contact-error" : undefined}
                  className={INPUT}
                />
              </Field>

              <Field id="message" label="Your message" error={errors.message}>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  maxLength={2000}
                  value={values.message}
                  onChange={(e) => update("message", e.target.value)}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  className={`${INPUT} resize-y`}
                />
              </Field>

              <div aria-live="polite">
                {formError && (
                  <p className="rounded-lg bg-[#FBEAE8] px-3.5 py-2.5 text-sm text-[#8C1D18]">
                    {formError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-lg bg-[#0F2B33] px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#1A4450] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8A8A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send enquiry"}
              </button>

              <p className="text-sm text-[#5C7279]">
                Demo clinic for a portfolio project. Please don&rsquo;t enter real personal
                details.
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}