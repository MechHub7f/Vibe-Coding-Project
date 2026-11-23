import type { StocksSnapshot } from "@/lib/types";
import stocksFixture from "@/fixtures/stocks.json";

/**
 * v1 serves sample data only.
 *
 * Live quotes need a provider whose license permits displaying them on a public
 * page. Stooq's terms forbid redistribution, and scraping Yahoo/Google is
 * against their ToS. When a licensed provider and key are available, fetch here
 * and return the same shape. See docs/data-sources.md.
 */
export async function getStocksSnapshot(): Promise<StocksSnapshot> {
  return stocksFixture as StocksSnapshot;
}
