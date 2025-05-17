# Repository Review

## The Coolest Thing 🚀

**End-to-end S2 geospatial engine delivered as a Convex component.**  
The project compiles a small Go wrapper around Google's S2 geometry library to WebAssembly and drives it from TypeScript.  The result is a drop-in `@convex-dev/geospatial` component that gives any Convex app a fully-featured spatial index:

* lat/lng → S2 cell tokens, rectangle covering, distance / containment tests – all executed inside Convex workers for low-latency queries.
* Hierarchical cell streaming + Convex's reactive queries enable efficient rectangle & nearest-point look-ups that paginate automatically.
* Strong dev-exp: typed API (`GeospatialIndex<Id,…>` generics), expressive query builder (`q.in("category", …).gte("sortKey", 10)`), plus an example React-Leaflet UI.

The combination of Go → WASM → TypeScript → Convex is elegant and fairly rare in open-source components.

---

## The Worst Thing 😬

1. **Beta limitations**
   * Only rectangle queries; no polygons or buffers yet.
   * Ascending sort only; limited boolean filter logic.
2. **Fixed buffer sizes in the Go ↔ WASM bridge** – exceed them and you hit runtime errors.
3. **Convex row-read cap (1024)** forces a somewhat complex streaming/pagination pipeline.
4. **Bundled WASM binary** – base64-encoded blob inflates the repo and install size; rebuild instructions are absent.

Overall the feature set is great for prototypes or moderate datasets but can feel brittle when pushed to heavier workloads.

---

## How You Might Do This Without WASM 🛠️

| Approach | Pros | Cons |
| --- | --- | --- |
| External micro-service running native S2 (Go/C++) | Native speed, no porting effort | Extra infra and network hops |
| Pure-JS S2/H3 library | No infra, easy to bundle | 10–100× slower, more CPU in Convex worker |
| Geohash/H3 replacement | Simple math, good ecosystem | Different grid, rewrite covering logic |
| Re-implement minimal S2 subset in TS | Zero deps, deterministic | Engineering time, slower, bug-prone |
| Pre-compute cell tokens offline | Queries are pure data fetches | Only works for mostly-static data |

Choose the variant that balances performance, hosting complexity, and how dynamic your data is.