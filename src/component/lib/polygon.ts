import { Point, Rectangle } from "../types.js";

/**
 * Compute the axis-aligned bounding rectangle for the given polygon.
 * This ignores dateline wrapping and assumes the polygon does not cross
 * the antimeridian.
 */
export function boundingRectangle(polygon: Point[]): Rectangle {
  if (polygon.length === 0) {
    throw new Error("Cannot compute bounding rectangle of empty polygon");
  }
  let south = polygon[0].latitude;
  let north = polygon[0].latitude;
  let west = polygon[0].longitude;
  let east = polygon[0].longitude;
  for (const p of polygon) {
    south = Math.min(south, p.latitude);
    north = Math.max(north, p.latitude);
    west = Math.min(west, p.longitude);
    east = Math.max(east, p.longitude);
  }
  return { south, north, west, east };
}

/**
 * Determine whether a point is inside the provided polygon. The polygon is
 * expected to be defined as an array of vertices in order, forming a closed
 * loop. The function uses the ray-casting algorithm on the latitude/longitude
 * plane which is a reasonable approximation for small areas.
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      (yi > point.latitude) !== (yj > point.latitude) &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}