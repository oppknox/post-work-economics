import { REFERENCE, compute, statusCopy, type Inputs } from "./model";
import { formatCount, formatMoney, formatMonthly, formatMultiple, formatPct } from "./format";

const ROBOT_MIN_MILLIONS = 1;
const ROBOT_MAX_MILLIONS = 600;

interface Controls {
  robots: HTMLInputElement;
  ubi: HTMLInputElement;
  tax: HTMLInputElement;
  own: HTMLInputElement;
  yield: HTMLInputElement;
  defl: HTMLInputElement;
}

export function mountCalculator(): void {
  const controls: Controls = {
    robots: required("input#robots"),
    ubi: required("input#ubi"),
    tax: required("input#tax"),
    own: required("input#own"),
    yield: required("input#yield"),
    defl: required("input#defl"),
  };

  const fromUrl = readUrl();
  apply(controls, fromUrl ?? REFERENCE, false);
  if (!fromUrl) {
    document.querySelector<HTMLButtonElement>('[data-preset="reference"]')?.setAttribute("aria-pressed", "true");
  }
  render(controls);

  for (const input of Object.values(controls)) {
    input.addEventListener("input", () => {
      clearPressed();
      render(controls);
    });
  }

  document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset;
      apply(controls, presetInputs(preset), true);
      clearPressed();
      button.setAttribute("aria-pressed", "true");
      render(controls);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-defl]").forEach((button) => {
    button.addEventListener("click", () => {
      controls.defl.value = button.dataset.defl ?? "0";
      document.querySelectorAll<HTMLButtonElement>("[data-defl]").forEach((peer) => {
        peer.setAttribute("aria-pressed", peer === button ? "true" : "false");
      });
      render(controls);
    });
  });
}

function render(controls: Controls): void {
  const input = read(controls);
  const result = compute(input);
  paintRanges(controls);

  setText("#robots-out", formatCount(input.usRobots));
  setText("#ubi-out", `${formatMonthly(input.ubiMonthly)} / month`);
  setText("#tax-out", formatPct(input.taxRate));
  setText("#own-out", formatPct(input.ownershipShare));
  setText("#yield-out", formatPct(input.dividendYield));
  setText("#defl-out", formatPct(input.costDecline));

  const coverage = document.querySelector<HTMLElement>("#coverage");
  if (coverage) {
    coverage.textContent = formatPct(result.combinedCoverage);
    coverage.dataset.state = result.status;
  }
  setText("#gap-out", formatMoney(Math.max(0, result.gap)));
  setText("#monthly-out", formatMonthly(result.monthlyUsable));
  setText("#status", statusCopy(result, input));

  setText("#m-we", `${formatCount(result.workerEquivalents)} · ${formatMultiple(result.laborMultiple)}`);
  setText("#m-va", formatMoney(result.valueAdded));
  setText("#m-profit", formatMoney(result.profit));
  setText("#m-tax", `${formatMoney(result.taxRevenue)} · ${formatMonthly(result.monthlyFromTax)}/mo`);
  setText("#m-div", `${formatMoney(result.ownershipDividend)} · ${formatMonthly(result.monthlyFromOwnership)}/mo`);
  setText("#m-fund", formatMoney(result.impliedFund));
  setText("#m-need", formatMoney(result.requiredFund));
  setText("#m-residual", result.residual >= 0 ? formatMoney(result.residual) : "Overlap");
  setText("#m-real", `${formatMonthly(result.realMonthly)} of today’s goods`);
  setText("#m-cost", formatMoney(result.ubiCost));

  const ownH = shareOfStipend(result.ownershipDividend, result.claimed, result.usable, result.ubiCost);
  const taxH = shareOfStipend(result.taxRevenue, result.claimed, result.usable, result.ubiCost);
  setHeight("#vessel-own", ownH);
  setHeight("#vessel-tax", taxH);

  const splitOwn = input.usRobots === 0 ? 0 : result.ownershipDividend / Math.max(result.profit, 1);
  const splitTax = input.usRobots === 0 ? 0 : result.taxRevenue / Math.max(result.profit, 1);
  const splitResidual = Math.max(0, 1 - splitOwn - splitTax);
  setWidth("#split-own", Math.min(1, splitOwn));
  setWidth("#split-tax", Math.min(1, splitTax));
  setWidth("#split-rest", result.overlap ? 0 : splitResidual);

  controls.robots.setAttribute("aria-valuetext", formatCount(input.usRobots));
  controls.ubi.setAttribute("aria-valuetext", `${input.ubiMonthly} dollars per month`);
  controls.tax.setAttribute("aria-valuetext", formatPct(input.taxRate));
  controls.own.setAttribute("aria-valuetext", formatPct(input.ownershipShare));
  controls.yield.setAttribute("aria-valuetext", formatPct(input.dividendYield));
  controls.defl.setAttribute("aria-valuetext", formatPct(input.costDecline));

  writeUrl(input);
}

function shareOfStipend(part: number, claimed: number, usable: number, cost: number): number {
  if (cost <= 0 || claimed <= 0) return 0;
  return Math.min(1, (part / claimed) * (usable / cost));
}

function read(controls: Controls): Inputs {
  return {
    usRobots: robotsFromSlider(Number(controls.robots.value)),
    ubiMonthly: Number(controls.ubi.value),
    taxRate: Number(controls.tax.value) / 100,
    ownershipShare: Number(controls.own.value) / 100,
    dividendYield: Number(controls.yield.value) / 100,
    costDecline: Number(controls.defl.value) / 100,
  };
}

function apply(controls: Controls, input: Inputs, pressLens: boolean): void {
  controls.robots.value = String(sliderFromRobots(input.usRobots));
  controls.ubi.value = String(input.ubiMonthly);
  controls.tax.value = String(Math.round(input.taxRate * 100));
  controls.own.value = String(Math.round(input.ownershipShare * 100));
  controls.yield.value = String(input.dividendYield * 100);
  controls.defl.value = String(Math.round(input.costDecline * 100));
  if (pressLens) {
    document.querySelectorAll<HTMLButtonElement>("[data-defl]").forEach((button) => {
      button.setAttribute("aria-pressed", Number(button.dataset.defl) === Math.round(input.costDecline * 100) ? "true" : "false");
    });
  }
}

function paintRanges(controls: Controls): void {
  for (const input of Object.values(controls)) {
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    const pct = ((value - min) / (max - min)) * 100;
    input.style.setProperty("--p", `${pct}%`);
  }
}

function robotsFromSlider(position: number): number {
  return position * 1_000_000;
}

function sliderFromRobots(robots: number): number {
  const millions = Math.round(robots / 1_000_000);
  return Math.min(ROBOT_MAX_MILLIONS, Math.max(ROBOT_MIN_MILLIONS, millions));
}

function presetInputs(name: string | undefined): Inputs {
  switch (name) {
    case "stipend5":
      return { ...REFERENCE, ubiMonthly: 5000 };
    case "early":
      return { ...REFERENCE, usRobots: 10_000_000 };
    case "taxonly":
      return { ...REFERENCE, ownershipShare: 0, taxRate: 0.2 };
    case "full":
      return { ...REFERENCE, ownershipShare: 1, taxRate: 0 };
    default:
      return { ...REFERENCE };
  }
}

function readUrl(): Inputs | null {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) return null;
  const num = (key: string, fallback: number) => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === "" || Number.isNaN(Number(raw))) return fallback;
    return Number(raw);
  };
  return {
    usRobots: num("robots", REFERENCE.usRobots),
    ubiMonthly: num("ubi", REFERENCE.ubiMonthly),
    taxRate: num("tax", REFERENCE.taxRate * 100) / 100,
    ownershipShare: num("own", REFERENCE.ownershipShare * 100) / 100,
    dividendYield: num("yield", REFERENCE.dividendYield * 100) / 100,
    costDecline: num("defl", 0) / 100,
  };
}

function writeUrl(input: Inputs): void {
  const params = new URLSearchParams();
  if (Math.abs(input.usRobots - REFERENCE.usRobots) > 500_000) params.set("robots", String(Math.round(input.usRobots)));
  if (input.ubiMonthly !== REFERENCE.ubiMonthly) params.set("ubi", String(input.ubiMonthly));
  if (Math.abs(input.taxRate - REFERENCE.taxRate) > 0.001) params.set("tax", String(Math.round(input.taxRate * 100)));
  if (Math.abs(input.ownershipShare - REFERENCE.ownershipShare) > 0.001) params.set("own", String(Math.round(input.ownershipShare * 100)));
  if (Math.abs(input.dividendYield - REFERENCE.dividendYield) > 0.001) params.set("yield", String(input.dividendYield * 100));
  if (input.costDecline > 0.001) params.set("defl", String(Math.round(input.costDecline * 100)));
  const next = params.toString();
  const url = next ? `${location.pathname}?${next}` : location.pathname;
  history.replaceState(null, "", url);
}

function clearPressed(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
  });
}

function required(selector: string): HTMLInputElement {
  const node = document.querySelector<HTMLInputElement>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}

function setText(selector: string, value: string): void {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function setHeight(selector: string, fraction: number): void {
  const node = document.querySelector<HTMLElement>(selector);
  if (node) node.style.height = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
}

function setWidth(selector: string, fraction: number): void {
  const node = document.querySelector<HTMLElement>(selector);
  if (node) node.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
}
