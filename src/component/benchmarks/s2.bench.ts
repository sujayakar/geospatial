import { bench, beforeAll } from "vitest";
import { S2Bindings } from "../lib/s2Bindings.js";
import { Point, Rectangle } from "../types.js";

let s2: S2Bindings;

// Load the WASM bindings **once** before any benchmarks run so the cost of
// instantiation doesn't get factored into the individual benchmark numbers.
beforeAll(async () => {
  s2 = await S2Bindings.load();
});

// A moderately-sized rectangle roughly centred on the equator.
const rectangle: Rectangle = {
  south: -10,
  west: -10,
  north: 10,
  east: 10,
};

// Two arbitrary points used by several of the micro-benchmarks below.
const pointA: Point = { latitude: 0, longitude: 0 };
const pointB: Point = { latitude: 1.5, longitude: 1.5 };

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

bench("coverRectangle (10°×10°)", () => {
  s2.coverRectangle(rectangle, /*minLevel=*/ 4, /*maxLevel=*/ 16, /*levelMod=*/ 2, /*maxCells=*/ 8);
});

bench("rectangleContains", () => {
  s2.rectangleContains(rectangle, pointA);
});

bench("pointDistance", () => {
  s2.pointDistance(pointA, pointB);
});

const worldRect: Rectangle = {
  south: -90,
  west: -180,
  north: 90,
  east: 180,
};

bench("coverRectangle (world, 10k maxCells)", () => {
  s2.coverRectangle(worldRect, /*minLevel=*/ 0, /*maxLevel=*/ 16, /*levelMod=*/ 1, /*maxCells=*/ 10_000);
});