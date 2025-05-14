import { fc } from "@fast-check/vitest";

const objectKeys = "abcdefghijklmnopqrstuvwxyz".split("");

export const arbitraryDocument = fc.record({
  key: fc.string(),
  sortKey: fc.float(),
  filterKeys: fc.dictionary(
    fc.string({ unit: fc.constantFrom(...objectKeys) }),
    fc.string(),
  ),
  coordinates: fc.record({
    latitude: fc.float({ min: -90, max: 90, noNaN: true }),
    longitude: fc.float({ min: -180, max: 180, noNaN: true }),
  }),
});

export const arbitraryDocuments = fc.array(arbitraryDocument, {
  minLength: 1,
  maxLength: 4,
});

// Generate random convex polygon with 3-8 vertices around random center
export const arbitraryConvexPolygon = fc
  .tuple(
    fc.float({ min: -80, max: 80, noNaN: true }),
    fc.float({ min: -170, max: 170, noNaN: true }),
  )
  .chain(([centerLat, centerLng]) => {
    const radiusLat = 0.5;
    const radiusLng = 0.5;
    return fc
      .array(
        fc.tuple(
          fc.float({ min: -radiusLat, max: radiusLat, noNaN: true }),
          fc.float({ min: -radiusLng, max: radiusLng, noNaN: true }),
        ),
        { minLength: 3, maxLength: 8 },
      )
      .map((deltas) => {
        // Shift deltas to absolute coords
        const points = deltas.map(([dLat, dLng]) => ({
          latitude: centerLat + dLat,
          longitude: centerLng + dLng,
        }));
        // Compute centroid
        const centroid = points.reduce(
          (acc, p) => {
            acc.lat += p.latitude;
            acc.lng += p.longitude;
            return acc;
          },
          { lat: 0, lng: 0 },
        );
        centroid.lat /= points.length;
        centroid.lng /= points.length;
        // Sort points by angle to centroid to ensure CCW order
        points.sort((a, b) => {
          const angleA = Math.atan2(a.latitude - centroid.lat, a.longitude - centroid.lng);
          const angleB = Math.atan2(b.latitude - centroid.lat, b.longitude - centroid.lng);
          return angleA - angleB;
        });
        // Remove consecutive duplicate vertices
        const unique = points.filter((p, idx, arr) => {
          if (idx === 0) return true;
          const prev = arr[idx - 1];
          return (
            Math.abs(p.latitude - prev.latitude) > 1e-6 ||
            Math.abs(p.longitude - prev.longitude) > 1e-6
          );
        });
        // Ensure at least 3 unique points
        if (unique.length < 3) {
          // fallback to rectangle corner points around centre
          return [
            { latitude: centerLat - 0.01, longitude: centerLng - 0.01 },
            { latitude: centerLat - 0.01, longitude: centerLng + 0.01 },
            { latitude: centerLat + 0.01, longitude: centerLng + 0.01 },
          ];
        }
        return unique;
      })
      .filter((poly) => {
        // Shoelace area calculation
        let area = 0;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          area +=
            (poly[j].longitude + poly[i].longitude) *
            (poly[j].latitude - poly[i].latitude);
        }
        return Math.abs(area) > 1e-6;
      });
  });
