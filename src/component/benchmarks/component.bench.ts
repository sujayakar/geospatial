import { bench, beforeAll } from "vitest";
import { convexTest } from "convex-test";

import { api } from "../_generated/api.js";
import schema from "../schema.js";
import { modules } from "../test.setup.js";
import { Point } from "../types.js";

// ---------------------------------------------------------------------------
// Setup – executed once before any benchmark cycles start
// ---------------------------------------------------------------------------

const opts = {
  minLevel: 4,
  maxLevel: 16,
  levelMod: 2,
  maxCells: 8,
};

/** Size of the synthetic dataset used for read-heavy benchmarks. */
const DATASET_SIZE = 3000;

let t: ReturnType<typeof convexTest>;
let insertCounter = 0;

beforeAll(async () => {
  // Spin up an in-memory Convex test environment.
  t = convexTest(schema, modules);

  // Pre-seed a large dataset of random points across the globe so we can
  // profile read queries against a non-trivial amount of data.
  const insertPromises: Promise<unknown>[] = [];
  for (let i = 0; i < DATASET_SIZE; i++) {
    const doc = randomDocument(i);
    insertPromises.push(
      t.mutation(api.document.insert, {
        document: doc,
        ...opts,
      })
    );
  }
  await Promise.all(insertPromises);
});

// ---------------------------------------------------------------------------
// Benchmarks – Vitest will repeatedly invoke the callbacks below to gather
// statistics (ops/sec, rme, etc.).
// ---------------------------------------------------------------------------

bench("document.insert + document.remove (full cycle)", async () => {
  // Ensure we use a unique key every iteration to avoid constraints clashes.
  const id = insertCounter++;
  const doc = randomDocument(id);

  await t.mutation(api.document.insert, {
    document: doc,
    ...opts,
  });

  await t.mutation(api.document.remove, {
    key: doc.key,
    ...opts,
  });
});

bench("query.execute (world-wide rectangle)", async () => {
  await t.query(api.query.execute, {
    query: {
      rectangle: { west: -180, south: -90, east: 180, north: 90 },
      filtering: [],
      sorting: { interval: { startInclusive: 0, endExclusive: 1e12 } },
      maxResults: 1000,
    },
    cursor: undefined,
    ...opts,
    logLevel: "ERROR",
  });
});

bench("query.nearestPoints (k-NN)", async () => {
  await t.query(api.query.nearestPoints, {
    point: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    maxDistance: undefined,
    maxResults: 20,
    ...opts,
    nextCursor: undefined,
    logLevel: "ERROR",
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomDocument(i: number) {
  const coordinates = randomPoint();
  return {
    key: `bench_doc_${i}_${Date.now()}`,
    coordinates,
    sortKey: Math.floor(Math.random() * 1e6),
    filterKeys: {},
  } as const;
}

function randomPoint(): Point {
  return {
    latitude: Math.random() * 180 - 90, // [-90, 90]
    longitude: Math.random() * 360 - 180, // [-180, 180]
  };
}