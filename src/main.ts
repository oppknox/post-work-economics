import { mountCalculator } from "./calculator";
import { mountCells, mountCurves, mountFleet } from "./charts";
import { mountForm, mountMotion } from "./motion";

const fleet = document.querySelector<HTMLElement>("#fleet-chart");
const fleetReadout = document.querySelector<HTMLElement>("#fleet-readout");
const curves = document.querySelector<HTMLElement>("#curve-chart");
const curveReadout = document.querySelector<HTMLElement>("#curve-readout");

if (fleet && fleetReadout) mountFleet(fleet, fleetReadout);
if (curves && curveReadout) mountCurves(curves, curveReadout);
document.querySelectorAll<HTMLElement>(".cells").forEach((host) => mountCells(host));

mountCalculator();
mountMotion();
mountForm();
