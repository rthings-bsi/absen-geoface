/**
 * GPS Utilities - Haversine Formula
 * Menghitung jarak antara dua titik koordinat GPS
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Menghitung jarak dalam meter antara dua koordinat menggunakan Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam meter
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Memeriksa apakah user berada dalam radius tertentu dari titik referensi
 */
export function isWithinRadius(
  userPos: Coordinate,
  officePos: Coordinate,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(
    userPos.lat,
    userPos.lng,
    officePos.lat,
    officePos.lng
  );
  return distance <= radiusMeters;
}

/**
 * Format jarak untuk display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Validasi koordinat
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Default office location (Karawang)
 */
export const DEFAULT_OFFICE: Coordinate = {
  lat: -6.2671,
  lng: 107.2726,
};
