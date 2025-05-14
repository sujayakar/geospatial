import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { test as fcTest } from "@fast-check/vitest";

import schema from "../schema.js";
import { modules } from "../test.setup.js";
import { api } from "../_generated/api.js";
import {
  arbitraryDocuments,
  arbitraryConvexPolygon,
} from "./arbitrary.helpers.js";
import { pointInPolygon } from "../lib/polygon.js";

const opts = {
  minLevel: 4,
  maxLevel: 16,
  levelMod: 2,
  maxCells: 8,
};

// Basic deterministic test

test("polygon query - basic functionality", async () => {
  const t = convexTest(schema, modules);
  const polygon = [
    { latitude: 0, longitude: 0 },
    { latitude: 0, longitude: 1 },
    { latitude: 1, longitude: 1 },
    { latitude: 1, longitude: 0 },
  ];

  const docs = [
    {
      key: "inside",
      coordinates: { latitude: 0.5, longitude: 0.5 },
      sortKey: 1,
      filterKeys: {},
    },
    {
      key: "outside",
      coordinates: { latitude: 2, longitude: 2 },
      sortKey: 2,
      filterKeys: {},
    },
  ];

  for (const doc of docs) {
    await t.mutation(api.document.insert, { document: doc, ...opts });
  }

  const result = await t.query(api.query.execute, {
    query: {
      shape: { type: "polygon", polygon },
      filtering: [],
      sorting: { interval: {} },
      maxResults: 64,
    },
    cursor: undefined,
    ...opts,
    logLevel: "INFO",
  });

  expect(result.results.map((r) => r.key).sort()).toEqual(["inside"]);
});

// Property-based test

fcTest.prop({ documents: arbitraryDocuments, polygon: arbitraryConvexPolygon })(
  "polygon query - property based testing",
  async ({ documents, polygon }) => {
    const t = convexTest(schema, modules);

    // Insert documents
    for (const document of documents) {
      await t.mutation(api.document.insert, { document, ...opts });
    }

    // Execute query
    const result = await t.query(api.query.execute, {
      query: {
        shape: { type: "polygon", polygon },
        filtering: [],
        sorting: { interval: {} },
        maxResults: 128,
      },
      cursor: undefined,
      ...opts,
      logLevel: "INFO",
    });

    const expectedKeys = Array.from(
      new Set(
        documents
          .filter((d) => pointInPolygon(d.coordinates, polygon))
          .map((d) => d.key),
      ),
    ).sort();

    const actualKeys = result.results.map((r) => r.key).sort();

    expect(actualKeys).toEqual(expectedKeys);
  },
  10000,
);