import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "New England (PADD 1A) fuel prices, weather, and markets for New Hampshire.",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/fuel", label: "Fuel" },
  { href: "/weather", label: "Weather" },
  { href: "/stocks", label: "Stocks" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl space-y-1 px-4 py-6 text-xs text-slate-500">
            <p>
              Guest mode · New Hampshire focus · Pump fuel prices are New England
              (PADD 1A) regional averages.
            </p>
            <p>
              Informational only and may be delayed. Signals are short-term
              heuristics, not guarantees. Not financial or investment advice.
            </p>
            <p>
              Fuel:{" "}
              <a
                href="https://www.eia.gov/"
                className="underline hover:text-slate-700"
                target="_blank"
                rel="noreferrer"
              >
                EIA
              </a>{" "}
              · Weather:{" "}
              <a
                href="https://open-meteo.com/"
                className="underline hover:text-slate-700"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>{" "}
              (
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                className="underline hover:text-slate-700"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>
              ; values rounded) · Stocks: sample data.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
