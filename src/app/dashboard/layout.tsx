"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { supabase } from "@/lib/supabase-browser";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"] });

const NAV = [
  { href: "/dashboard", label: "Leads" },
  { href: "/dashboard/report", label: "Campaigns" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setEmail(session.user.email ?? "");
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const shell = `${display.variable} ${body.className} min-h-screen bg-[#EEF4F6] text-[#0F2B33]`;

  if (!ready) {
    return <div className={`${shell} grid place-items-center text-[#35545C]`}>Loading…</div>;
  }

  return (
    <div className={`${shell} md:flex`}>
      <aside className="bg-[#0F2B33] text-white md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:justify-between">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:flex-col md:items-stretch md:gap-8 md:px-5 md:py-6">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex items-start gap-0.5">
              <span className="h-5 w-2 rounded-b-full bg-[#FBF9F2]" />
              <span className="h-4 w-2 rounded-b-full bg-[#E5DBC4]" />
              <span className="h-5 w-2 rounded-b-full bg-[#D0C09D]" />
            </span>
            <div className="leading-tight">
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Demo Dental
              </p>
              <p className="text-xs text-white/60">Lead desk</p>
            </div>
          </div>

          <nav aria-label="Dashboard" className="flex items-center gap-1 md:flex-col md:items-stretch">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${
                    active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            >
              Sign out
            </button>
          </nav>
        </div>

        <div className="hidden px-5 py-5 text-sm md:block">
          <p className="truncate text-white/60" title={email}>{email}</p>
          <button onClick={signOut} className="mt-1 font-medium text-white underline-offset-4 hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}