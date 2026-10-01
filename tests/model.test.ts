import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADULTS,
  EARLY_FLEET,
  LABOR_FORCE,
  REFERENCE,
  REFERENCE_PROFIT,
  REFERENCE_ROBOTS,
  annualProduction,
  compute,
  cumulativeFleet,
  robotProfit,
  ubiAnnual,
  workerEquivalents,
  yearForCumulative,
} from "../src/model.ts";

const close = (actual: number, expected: number, rel = 1e-9) => {
  const tol = Math.max(1, Math.abs(expected) * rel);
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} ≉ ${expected}`);
};

test("early fleet is 5 million worker-equivalents, about 3 percent of labor", () => {
  close(workerEquivalents(EARLY_FLEET), 5_000_000);
  close(workerEquivalents(EARLY_FLEET) / LABOR_FORCE, 5_000_000 / 170_000_000);
});

test("reference fleet is 100 million worker-equivalents, 0.59× labor", () => {
  close(workerEquivalents(REFERENCE_ROBOTS), 100_000_000);
  close(workerEquivalents(REFERENCE_ROBOTS) / LABOR_FORCE, 100 / 170);
});

test("reference profit is exactly $6T and $30,000 per robot", () => {
  close(robotProfit(REFERENCE_ROBOTS), REFERENCE_PROFIT);
  close(robotProfit(1), 30_000);
  close(robotProfit(10_000_000), 300_000_000_000);
});

test("value added at the reference fleet is about $10.2T", () => {
  const result = compute(REFERENCE);
  close(result.valueAdded, 17.4e12 * (100 / 170));
  assert.ok(result.valueAdded > 10e12 && result.valueAdded < 10.5e12);
});

test("UBI costs lock to $9.36T and $15.6T", () => {
  close(ubiAnnual(3000), 3000 * 12 * ADULTS);
  close(ubiAnnual(3000), 9.36e12);
  close(ubiAnnual(5000), 15.6e12);
});

test("reference case: 20% tax is $1.2T, 50% ownership is a $60T fund", () => {
  const result = compute(REFERENCE);
  close(result.profit, 6e12);
  close(result.taxRevenue, 1.2e12);
  close(result.ownershipDividend, 3e12);
  close(result.impliedFund, 60e12);
  close(result.taxCoverage, 1.2 / 9.36);
  close(result.monthlyFromOwnership, 3e12 / ADULTS / 12);
  close(result.requiredFund, 9.36e12 / 0.05);
  assert.equal(result.overlap, false);
  assert.equal(result.status, "partial");
  close(result.usable, 4.2e12);
  close(result.gap, 9.36e12 - 4.2e12);
});

test("tax alone leaves most of the $3k stipend unfunded", () => {
  const result = compute({ ...REFERENCE, ownershipShare: 0, taxRate: 0.2 });
  close(result.taxCoverage, 1.2 / 9.36);
  assert.ok(result.taxCoverage < 0.15);
  assert.ok(result.gap > 8e12);
});

test("full ownership of the reference fleet pays about $1,923 a month", () => {
  const result = compute({ ...REFERENCE, ownershipShare: 1, taxRate: 0 });
  close(result.monthlyFromOwnership, 6e12 / ADULTS / 12);
  assert.equal(result.status, "profit-ceiling");
});

test("$3k from profit alone needs 312 million US robots", () => {
  const result = compute({
    ...REFERENCE,
    usRobots: 312_000_000,
    ownershipShare: 1,
    taxRate: 0,
  });
  close(result.profit, 9.36e12);
  close(result.combinedCoverage, 1);
  assert.equal(result.status, "covered");
});

test("overlap caps usable funding at profit", () => {
  const result = compute({ ...REFERENCE, ownershipShare: 0.8, taxRate: 0.5 });
  assert.equal(result.overlap, true);
  assert.equal(result.status, "overlap");
  close(result.claimed, 1.3 * 6e12);
  close(result.usable, 6e12);
});

test("production hits 10 million a year in year five and 1 billion cumulative near year 13", () => {
  close(annualProduction(0), 1_000_000);
  close(annualProduction(5), 10_000_000);
  const t = yearForCumulative(1_000_000_000);
  assert.ok(t > 13 && t < 14, `year ${t}`);
  close(cumulativeFleet(t), 1_000_000_000, 1e-6);
});

test("deflation lens multiplies purchasing power", () => {
  const result = compute({ ...REFERENCE, costDecline: 0.8 });
  close(result.purchasingPower, 5);
  close(result.realMonthly, result.monthlyUsable * 5);
});
