import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema.js";
import { modules } from "../test.setup.js";
import { api } from "../_generated/api.js";

const opts = {
  minLevel: 4,
  maxLevel: 16,
  levelMod: 2,
  maxCells: 8,
};

test("polygon query handles clockwise winding", async () => {
  const t = convexTest(schema, modules);
  const polygonCCW = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
    { latitude: 1, longitude: 1 },
    { latitude: 1, longitude: 0 },
  ];
  const polygonCW = [...polygonCCW].reverse();

  const pointInside = {
    key: "inside",
    coordinates: { latitude: 0.5, longitude: 0.5 },
    sortKey: 1,
    filterKeys: {},
  };
  await t.mutation(api.document.insert, { document: pointInside, ...opts });

  const runQuery = async (poly: typeof polygonCCW) =>
    await t.query(api.query.execute, {
      query: {
        shape: { type: "polygon", polygon: poly },
        filtering: [],
        sorting: { interval: {} },
        maxResults: 16,
      },
      cursor: undefined,
      ...opts,
      logLevel: "INFO",
    });

  const ccwRes = await runQuery(polygonCCW);
  const cwRes = await runQuery(polygonCW);

  expect(ccwRes.results.length).toBe(1);
  expect(cwRes.results.length).toBe(1);
});

test("polygon query ignores duplicate first/last vertex", async () => {
  const t = convexTest(schema, modules);
  const polygon = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
    { latitude: 1, longitude: 1 },
    { latitude: 1, longitude: 0 },
    { latitude: 0, longitude: 0 }, // duplicate closing vertex
  ];
  const doc = {
    key: "dup",
    coordinates: { latitude: 0.2, longitude: 0.2 },
    sortKey: 1,
    filterKeys: {},
  };
  await t.mutation(api.document.insert, { document: doc, ...opts });
  const res = await t.query(api.query.execute, {
    query: {
      shape: { type: "polygon", polygon },
      filtering: [],
      sorting: { interval: {} },
      maxResults: 16,
    },
    cursor: undefined,
    ...opts,
    logLevel: "INFO",
  });
  expect(res.results.length).toBe(1);
});