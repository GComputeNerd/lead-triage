"use client";
import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);

    const res = await fetch("/api/webhooks/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        contact: form.get("contact"),
        message: form.get("message"),
        utm_source: params.get("utm_source") ?? undefined,
        utm_campaign: params.get("utm_campaign") ?? undefined,
      }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") return <main className="p-8">Thanks! We'll be in touch shortly.</main>;

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-2xl font-bold">Smile Dental Clinic</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder="Your name" required className="border p-2" />
        <input name="contact" placeholder="Phone or email" required className="border p-2" />
        <textarea name="message" placeholder="How can we help?" required className="border p-2" />
        <button disabled={status === "sending"} className="bg-black p-2 text-white">
          {status === "sending" ? "Sending..." : "Send enquiry"}
        </button>
        {status === "error" && <p className="text-red-600">Something went wrong. Please try again.</p>}
      </form>
    </main>
  );
}