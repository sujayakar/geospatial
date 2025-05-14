import { Point, Rectangle } from "../types.js";

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