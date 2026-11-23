import type { Metadata } from "next";
import { Sparkline } from "@/components/Sparkline";
import { pct, shortDate, usd } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getStocksSnapshot } from "@/lib/sources/stocks";
import type { StockQuote } from "@/lib/types";

export const metadata: Metadata = { title: "Stocks" };
export const dynamic = "force-dynamic";

function StockRow({ quote }: { quote: StockQuote }) {
  const up = quote.changePct >= 0;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0 sm:grid-cols-[1fr_auto_120px]">
      <div>
        <p className="font-medium">{quote.symbol}</p>
        <p className="text-xs text-slate-500">{quote.name}</p>
      </div>
      <div className="text-right">
        <p className="font-medium">{usd(quote.price)}</p>
        <p className={`text-xs ${up ? "text-emerald-700" : "text-rose-600"}`}>
          {pct(quote.changePct, 2)}
        </p>
      </div>
      <div className="hidden sm:block">
        <Sparkline
          data={quote.points}
          color={up ? "#047857" : "#be123c"}
        />
      </div>
    </div>
  );
}

export default async function StocksPage() {
  const stocks = await getStocksSnapshot();
  const session = getSession();
  const watchlist =
    session.kind === "guest" ? "Curated guest watchlist" : "Your watchlist";
  const lastPoint =
    stocks.quotes[0]?.points.at(-1)?.date ?? stocks.retrievedAt;
  const asOf = shortDate(lastPoint);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Stocks</h1>
        <p className="mt-2 text-slate-600">
          {watchlist}. Signing in (coming in v2) will let you choose your own
          tickers.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Sample data for demonstration — not live market quotes.
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {stocks.quotes.map((quote) => (
          <StockRow key={quote.symbol} quote={quote} />
        ))}
      </section>

      <p className="text-xs text-slate-500">
        Source: {stocks.source} · last close {asOf}. For context only — not
        financial advice.
      </p>
    </div>
  );
}
