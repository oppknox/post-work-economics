export function formatCount(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}${trimNum(abs / 1_000_000_000)} billion`;
  if (abs >= 1_000_000) return `${sign}${trimNum(abs / 1_000_000)} million`;
  if (abs >= 10_000) return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
  return `${sign}${trimNum(abs)}`;
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(n);
  if (v >= 1e12) return `${sign}$${trimNum(v / 1e12)}T`;
  if (v >= 1e9) return `${sign}$${trimNum(v / 1e9)}B`;
  if (v >= 1e6) return `${sign}$${trimNum(v / 1e6)}M`;
  if (v >= 1000) return `${sign}$${Math.round(v).toLocaleString("en-US")}`;
  return `${sign}$${trimNum(v)}`;
}

export function formatMonthly(n: number): string {
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(Math.round(n));
  return `${sign}$${v.toLocaleString("en-US")}`;
}

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const pct = n * 100;
  if (Math.abs(pct) >= 99.95 && Math.abs(pct) < 100.05) return "100%";
  return `${pct.toFixed(1)}%`;
}

export function formatMultiple(n: number): string {
  return `${n.toFixed(2)}×`;
}

export function formatYear(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}` : rounded.toFixed(1);
}

function trimNum(n: number): string {
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return n.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1");
}
