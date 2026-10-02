/**
 * Planning identities for The Ownership Dividend.
 * Sean Knox's reference figures are the constants. Everything else is derived.
 *
 * Two robots ≈ one worker-equivalent, so a US fleet of 200 million
 * (20% of a 1 billion global fleet) is 100 million worker-equivalents.
 * Value added scales with today's labor income per worker. Profit is pinned
 * so the reference fleet produces exactly $6 trillion — $30,000 per robot.
 */

export const LABOR_FORCE = 170_000_000;
export const ADULTS = 260_000_000;
export const LABOR_INCOME = 17.4e12;
export const ROBOTS_PER_WORKER = 2;
export const US_FLEET_SHARE = 0.2;
export const REFERENCE_ROBOTS = 200_000_000;
export const REFERENCE_PROFIT = 6e12;
export const EARLY_FLEET = 10_000_000;
export const PRODUCTION_NOW = 1_000_000;
export const PRODUCTION_YEAR_FIVE = 10_000_000;
export const NORWAY_FUND = 2e12;
export const PROPOSED_FUND = 60e12;
export const DEFAULT_YIELD = 0.05;

/** Continuous rate that takes annual output from 1M to 10M in five years. */
export const PRODUCTION_GROWTH = Math.log(PRODUCTION_YEAR_FIVE / PRODUCTION_NOW) / 5;

export interface Inputs {
  usRobots: number;
  ubiMonthly: number;
  /** Share of robot profit taken as tax, 0–1. Applied to the whole profit stream. */
  taxRate: number;
  /** Share of robot profit paid as a citizen dividend, 0–1. */
  ownershipShare: number;
  dividendYield: number;
  /** Fractional drop in production costs, used only as a purchasing-power lens. */
  costDecline: number;
}

export type FundingStatus = "overlap" | "covered" | "profit-ceiling" | "partial";

export interface Result {
  workerEquivalents: number;
  laborMultiple: number;
  laborPercent: number;
  valueAdded: number;
  profit: number;
  profitPerRobot: number;
  ubiCost: number;
  taxRevenue: number;
  ownershipDividend: number;
  claimed: number;
  usable: number;
  residual: number;
  gap: number;
  taxCoverage: number;
  ownershipCoverage: number;
  combinedCoverage: number;
  impliedFund: number;
  requiredFund: number;
  monthlyFromTax: number;
  monthlyFromOwnership: number;
  monthlyUsable: number;
  purchasingPower: number;
  realMonthly: number;
  overlap: boolean;
  status: FundingStatus;
}

export const REFERENCE: Inputs = {
  usRobots: REFERENCE_ROBOTS,
  ubiMonthly: 3000,
  taxRate: 0.2,
  ownershipShare: 0.5,
  dividendYield: DEFAULT_YIELD,
  costDecline: 0,
};

export function workerEquivalents(robots: number): number {
  return robots / ROBOTS_PER_WORKER;
}

export function valueAdded(robots: number): number {
  const perWorker = LABOR_INCOME / LABOR_FORCE;
  return workerEquivalents(robots) * perWorker;
}

/** Profit scales linearly and equals $6T at the 200M reference fleet. */
export function robotProfit(robots: number): number {
  return (robots / REFERENCE_ROBOTS) * REFERENCE_PROFIT;
}

export function ubiAnnual(monthly: number, adults = ADULTS): number {
  return monthly * 12 * adults;
}

export function perAdultMonthly(annual: number, adults = ADULTS): number {
  if (adults === 0) return 0;
  return annual / adults / 12;
}

export function compute(input: Inputs): Result {
  const usRobots = Math.max(0, input.usRobots);
  const ubiMonthly = Math.max(0, input.ubiMonthly);
  const taxRate = clamp01(input.taxRate);
  const ownershipShare = clamp01(input.ownershipShare);
  const dividendYield = Math.min(0.2, Math.max(0.005, input.dividendYield));
  const costDecline = Math.min(0.9, Math.max(0, input.costDecline));

  const we = workerEquivalents(usRobots);
  const va = valueAdded(usRobots);
  const profit = robotProfit(usRobots);
  const ubiCost = ubiAnnual(ubiMonthly);
  const taxRevenue = profit * taxRate;
  const ownershipDividend = profit * ownershipShare;
  const claimed = taxRevenue + ownershipDividend;
  const usable = Math.min(profit, claimed);
  const residual = profit - claimed;
  const gap = ubiCost - usable;
  const overlap = claimed > profit + 1;

  const taxCoverage = ratio(taxRevenue, ubiCost);
  const ownershipCoverage = ratio(ownershipDividend, ubiCost);
  const combinedCoverage = ratio(usable, ubiCost);

  const monthlyFromTax = perAdultMonthly(taxRevenue);
  const monthlyFromOwnership = perAdultMonthly(ownershipDividend);
  const monthlyUsable = perAdultMonthly(usable);
  const purchasingPower = 1 / (1 - costDecline);
  const realMonthly = monthlyUsable * purchasingPower;

  const unclaimed = 1 - taxRate - ownershipShare;

  let status: FundingStatus;
  if (overlap) status = "overlap";
  else if (ubiCost === 0 || usable + 1 >= ubiCost) status = "covered";
  else if (unclaimed <= 1e-9 && profit > 0) status = "profit-ceiling";
  else status = "partial";

  return {
    workerEquivalents: we,
    laborMultiple: we / LABOR_FORCE,
    laborPercent: we / LABOR_FORCE,
    valueAdded: va,
    profit,
    profitPerRobot: usRobots > 0 ? profit / usRobots : REFERENCE_PROFIT / REFERENCE_ROBOTS,
    ubiCost,
    taxRevenue,
    ownershipDividend,
    claimed,
    usable,
    residual,
    gap,
    taxCoverage,
    ownershipCoverage,
    combinedCoverage,
    impliedFund: ownershipDividend / dividendYield,
    requiredFund: ubiCost / dividendYield,
    monthlyFromTax,
    monthlyFromOwnership,
    monthlyUsable,
    purchasingPower,
    realMonthly,
    overlap,
    status,
  };
}

export function annualProduction(year: number): number {
  return PRODUCTION_NOW * Math.exp(PRODUCTION_GROWTH * year);
}

/** Integral of the production curve from year 0. The path starts at an empty fleet. */
export function cumulativeFleet(year: number): number {
  if (year <= 0) return 0;
  return (PRODUCTION_NOW / PRODUCTION_GROWTH) * (Math.exp(PRODUCTION_GROWTH * year) - 1);
}

export function yearForCumulative(target: number): number {
  if (target <= 0) return 0;
  const rt = Math.log((target * PRODUCTION_GROWTH) / PRODUCTION_NOW + 1);
  return rt / PRODUCTION_GROWTH;
}

export interface FleetPoint {
  year: number;
  annual: number;
  cumulative: number;
  us: number;
}

export function fleetPath(maxYear = 16, steps = 96): FleetPoint[] {
  const points: FleetPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const year = (maxYear * i) / steps;
    const cumulative = cumulativeFleet(year);
    points.push({
      year,
      annual: annualProduction(year),
      cumulative,
      us: cumulative * US_FLEET_SHARE,
    });
  }
  return points;
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function ratio(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return part / whole;
}

export function statusCopy(result: Result, input: Inputs): string {
  switch (result.status) {
    case "overlap":
      return "Tax and ownership are claims on the same profit. Together they exceed the stream, so usable funding stops at robot profit and the surplus is double-counted.";
    case "covered":
      return "Usable funding covers this stipend in nominal dollars. The purchasing-power lens shows what that money buys if robot costs have already fallen.";
    case "profit-ceiling":
      if (input.ownershipShare >= input.taxRate) {
        return "The citizen claim already takes every dollar of profit the tax does not. The remaining gap is larger than this fleet. A bigger fleet, or lower prices, has to close it.";
      }
      return "This tax rate already takes the profit the citizen fund does not own. Raising the rate further does not fund the stipend. A larger fleet or lower prices has to close the gap.";
    default:
      return "Coverage is partial. Raising the citizen share closes more of the gap than raising the tax, up to the profit this fleet actually earns.";
  }
}
