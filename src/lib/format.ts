export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

// Assumes Malaysian numbers when they start with 0
export function whatsappUrl(contact: string): string | null {
  if (contact.includes("@")) return null;
  let digits = contact.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("0")) digits = "60" + digits.slice(1);
  return `https://wa.me/${digits}`;
}