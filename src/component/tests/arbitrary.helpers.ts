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

export const arbitraryRectanglePolygon = fc
  .tuple(
    fc.float({ min: -80, max: 80, noNaN: true }),
    fc.float({ min: -170, max: 170, noNaN: true }),
    fc.float({ min: -80, max: 80, noNaN: true }),
    fc.float({ min: -170, max: 170, noNaN: true }),
  )
  .map(([lat1, lon1, lat2, lon2]) => {
    let south = Math.min(lat1, lat2);
    let north = Math.max(lat1, lat2);
    let west = Math.min(lon1, lon2);
    let east = Math.max(lon1, lon2);

    // Ensure the rectangle has a reasonable area (≥0.05° in each dimension)
    if (north - south < 0.05) {
      north = south + 0.05;
    }
    if (east - west < 0.05) {
      east = west + 0.05;
    }

    // Avoid polygons that span the anti-meridian to keep tests simple.
    if (east - west > 120) {
      east = west + 120;
    }

    return [
      { latitude: south, longitude: west },
      { latitude: south, longitude: east },
      { latitude: north, longitude: east },
      { latitude: north, longitude: west },
    ];
  });

export const arbitraryPolygons = fc.array(arbitraryRectanglePolygon, {
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
        return points;
      });
  });
