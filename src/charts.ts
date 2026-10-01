import {
  REFERENCE,
  US_FLEET_SHARE,
  annualProduction,
  compute,
  cumulativeFleet,
  fleetPath,
  yearForCumulative,
} from "./model";
import { formatCount, formatMoney, formatPct, formatYear } from "./format";

const NS = "http://www.w3.org/2000/svg";

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number | undefined>,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    node.setAttribute(key, String(value));
  }
  parent?.appendChild(node);
  return node;
}

function text(value: string, attrs: Record<string, string | number>, parent: Element): SVGTextElement {
  const node = el("text", attrs, parent);
  node.textContent = value;
  return node;
}

export function mountFleet(host: HTMLElement, readout: HTMLElement): void {
  const points = fleetPath(14, 120);
  const width = 760;
  const height = 440;
  const pad = { l: 62, r: 68, t: 28, b: 40 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const maxYear = 14;
  const maxCum = 1.5e9;
  const maxAnn = 700e6;
  const x = (year: number) => pad.l + (year / maxYear) * innerW;
  const yCum = (v: number) => pad.t + innerH - (v / maxCum) * innerH;
  const yAnn = (v: number) => pad.t + innerH - (Math.min(v, maxAnn) / maxAnn) * innerH;

  host.replaceChildren();
  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": "Illustrative robot deployment path from today to a one billion global fleet.",
    tabindex: "0",
  });
  host.appendChild(svg);

  const defs = el("defs", {}, svg);
  const grad = el("linearGradient", { id: "cumFill", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0%", "stop-color": "#e0a45a", "stop-opacity": "0.55" }, grad);
  el("stop", { offset: "100%", "stop-color": "#e0a45a", "stop-opacity": "0.02" }, grad);

  for (const tick of [0, 0.5e9, 1e9, 1.5e9]) {
    const y = yCum(tick);
    el("line", { x1: pad.l, x2: width - pad.r, y1: y, y2: y, stroke: "#f3ecdf", "stroke-opacity": "0.08" }, svg);
    text(tick === 0 ? "0" : `${tick / 1e9}B`, {
      x: pad.l - 10, y: y + 4, "text-anchor": "end", fill: "#aaa492", "font-size": "12",
    }, svg);
  }
  for (const year of [0, 5, 10, 14]) {
    text(String(year), {
      x: x(year), y: height - 14, "text-anchor": "middle", fill: "#aaa492", "font-size": "12",
    }, svg);
  }
  text("Global fleet", { x: 8, y: 16, fill: "#f2d2a2", "font-size": "12" }, svg);
  text("Built / year", { x: width - 8, y: 16, "text-anchor": "end", fill: "#9dceba", "font-size": "12" }, svg);

  const cumLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.year).toFixed(1)} ${yCum(p.cumulative).toFixed(1)}`).join(" ");
  const usLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.year).toFixed(1)} ${yCum(p.us).toFixed(1)}`).join(" ");
  const annLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.year).toFixed(1)} ${yAnn(p.annual).toFixed(1)}`).join(" ");
  const area = `${cumLine} L ${x(maxYear).toFixed(1)} ${yCum(0).toFixed(1)} L ${x(0).toFixed(1)} ${yCum(0).toFixed(1)} Z`;

  el("path", { d: area, fill: "url(#cumFill)", class: "chart-area" }, svg);
  el("path", { d: cumLine, fill: "none", stroke: "#e0a45a", "stroke-width": "2.4", class: "chart-line" }, svg);
  el("path", { d: usLine, fill: "none", stroke: "#f4efe6", "stroke-width": "1.6", "stroke-dasharray": "5 6", class: "chart-line" }, svg);
  el("path", { d: annLine, fill: "none", stroke: "#9dceba", "stroke-width": "2.2", class: "chart-line" }, svg);

  const billionYear = yearForCumulative(1_000_000_000);
  const marks = [
    { year: 5, label: "Year 5 · 10M built", y: pad.t + 46 },
    { year: 6.9, label: "Year 6.9 · 10M in the US", y: pad.t + 78 },
    { year: billionYear, label: "1 billion global", y: yCum(1_000_000_000) - 18 },
  ];
  for (const mark of marks) {
    const c = cumulativeFleet(mark.year);
    const px = x(mark.year);
    const py = yCum(c);
    el("line", {
      x1: px, x2: px, y1: py, y2: mark.y + 6,
      stroke: "#f2d2a2", "stroke-opacity": "0.45", "stroke-dasharray": "2 3",
    }, svg);
    el("circle", { cx: px, cy: py, r: 4.5, fill: "#0e0f0c", stroke: "#f2d2a2", "stroke-width": "1.6" }, svg);
    text(mark.label, {
      x: px + (mark.year > 10 ? -8 : 8),
      y: mark.y,
      fill: "#f4efe6",
      "font-size": "12",
      "text-anchor": mark.year > 10 ? "end" : "start",
    }, svg);
  }

  const guide = el("line", {
    x1: 0, x2: 0, y1: pad.t, y2: pad.t + innerH, stroke: "#f4efe6", "stroke-opacity": "0.45", visibility: "hidden",
  }, svg);
  const overlay = el("rect", { x: pad.l, y: pad.t, width: innerW, height: innerH, fill: "transparent" }, svg);

  const show = (year: number) => {
    const clamped = Math.min(maxYear, Math.max(0, year));
    const built = annualProduction(clamped);
    const global = cumulativeFleet(clamped);
    const us = global * US_FLEET_SHARE;
    readout.textContent = `Year ${formatYear(clamped)} — ${formatCount(built)} built that year, ${formatCount(global)} on earth, ${formatCount(us)} in the US.`;
    const px = x(clamped);
    guide.setAttribute("x1", String(px));
    guide.setAttribute("x2", String(px));
    guide.setAttribute("visibility", "visible");
    svg.dataset.year = String(clamped);
  };

  overlay.addEventListener("pointermove", (event) => {
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    show(((px - pad.l) / innerW) * maxYear);
  });
  overlay.addEventListener("pointerleave", () => {
    guide.setAttribute("visibility", "hidden");
  });
  svg.addEventListener("keydown", (event) => {
    const current = Number(svg.dataset.year ?? "13.3");
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    show(current + (event.key === "ArrowRight" ? 0.2 : -0.2));
  });
  show(billionYear);

  requestAnimationFrame(() => {
    svg.querySelectorAll<SVGPathElement>(".chart-line").forEach((path) => {
      path.style.setProperty("--len", String(path.getTotalLength()));
    });
  });
}

export function mountCurves(host: HTMLElement, readout: HTMLElement): void {
  const width = 760;
  const height = 420;
  const pad = { l: 58, r: 24, t: 24, b: 40 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const maxRobots = 600e6;
  const maxCov = 2;
  const x = (robots: number) => pad.l + (robots / maxRobots) * innerW;
  const y = (cov: number) => pad.t + innerH - (Math.min(cov, maxCov) / maxCov) * innerH;

  const samples: Array<{ robots: number; tax: number; mix: number; full: number }> = [];
  for (let robots = 0; robots <= maxRobots; robots += 8e6) {
    const tax = compute({ ...REFERENCE, usRobots: robots, ownershipShare: 0, taxRate: 0.2 });
    const mix = compute({ ...REFERENCE, usRobots: robots });
    const full = compute({ ...REFERENCE, usRobots: robots, ownershipShare: 1, taxRate: 0 });
    samples.push({
      robots,
      tax: tax.taxCoverage,
      mix: mix.combinedCoverage,
      full: full.combinedCoverage,
    });
  }

  host.replaceChildren();
  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": "Stipend coverage as the US robot fleet grows, under a profits tax, the reference mix, and full citizen ownership.",
    tabindex: "0",
  });
  host.appendChild(svg);

  for (const tick of [0, 0.5, 1, 1.5, 2]) {
    const yy = y(tick);
    el("line", { x1: pad.l, x2: width - pad.r, y1: yy, y2: yy, stroke: "#f3ecdf", "stroke-opacity": tick === 1 ? "0.35" : "0.08" }, svg);
    text(`${Math.round(tick * 100)}%`, { x: pad.l - 8, y: yy + 4, "text-anchor": "end", fill: "#aaa492", "font-size": "12" }, svg);
  }
  for (const robots of [0, 200e6, 312e6, 520e6, 600e6]) {
    text(robots === 0 ? "0" : `${Math.round(robots / 1e6)}M`, {
      x: x(robots), y: height - 14, "text-anchor": "middle", fill: "#aaa492", "font-size": "12",
    }, svg);
  }
  el("line", {
    x1: x(200e6), x2: x(200e6), y1: pad.t, y2: pad.t + innerH,
    stroke: "#f2d2a2", "stroke-opacity": "0.45", "stroke-dasharray": "3 5",
  }, svg);
  text("Reference", { x: x(200e6) - 6, y: pad.t + 14, "text-anchor": "end", fill: "#f2d2a2", "font-size": "12" }, svg);

  const pathFor = (key: "tax" | "mix" | "full") =>
    samples.map((s, i) => `${i === 0 ? "M" : "L"} ${x(s.robots).toFixed(1)} ${y(s[key]).toFixed(1)}`).join(" ");

  el("path", { d: pathFor("tax"), fill: "none", stroke: "#e7a394", "stroke-width": "2.3", class: "chart-line" }, svg);
  el("path", { d: pathFor("mix"), fill: "none", stroke: "#e0a45a", "stroke-width": "2.3", class: "chart-line" }, svg);
  el("path", { d: pathFor("full"), fill: "none", stroke: "#9dceba", "stroke-width": "2.4", class: "chart-line" }, svg);

  const guide = el("line", {
    x1: 0, x2: 0, y1: pad.t, y2: pad.t + innerH, stroke: "#f4efe6", "stroke-opacity": "0.4", visibility: "hidden",
  }, svg);
  const overlay = el("rect", { x: pad.l, y: pad.t, width: innerW, height: innerH, fill: "transparent" }, svg);

  const show = (robots: number) => {
    const r = Math.min(maxRobots, Math.max(0, robots));
    const tax = compute({ ...REFERENCE, usRobots: r, ownershipShare: 0, taxRate: 0.2 });
    const mix = compute({ ...REFERENCE, usRobots: r });
    const full = compute({ ...REFERENCE, usRobots: r, ownershipShare: 1, taxRate: 0 });
    readout.textContent = `${formatCount(r)} US robots — tax only ${formatPct(tax.taxCoverage)}, reference mix ${formatPct(mix.combinedCoverage)}, full claim ${formatPct(full.combinedCoverage)}. Profit ${formatMoney(full.profit)}.`;
    const px = x(r);
    guide.setAttribute("x1", String(px));
    guide.setAttribute("x2", String(px));
    guide.setAttribute("visibility", "visible");
    svg.dataset.robots = String(r);
  };

  overlay.addEventListener("pointermove", (event) => {
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * width;
    show(((px - pad.l) / innerW) * maxRobots);
  });
  svg.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = Number(svg.dataset.robots ?? String(REFERENCE.usRobots));
    const step = event.shiftKey ? 25e6 : 5e6;
    show(current + (event.key === "ArrowRight" ? step : -step));
  });
  show(REFERENCE.usRobots);

  requestAnimationFrame(() => {
    svg.querySelectorAll<SVGPathElement>(".chart-line").forEach((path) => {
      path.style.setProperty("--len", String(path.getTotalLength()));
    });
  });
}

export function mountCells(host: HTMLElement): void {
  const on = Number(host.dataset.on ?? "0");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  host.replaceChildren();
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement("i");
    const active = i < on;
    if (active) cell.className = "on";
    cell.title = active ? "About 1% of the labor force, matched by robots" : "About 1% of the labor force, still human";
    host.appendChild(cell);
    if (active && !reduce) {
      cell.animate(
        [{ opacity: 0.15 }, { opacity: 1 }],
        { duration: 420, delay: i * 16, easing: "ease-out", fill: "backwards" },
      );
    }
  }
}
