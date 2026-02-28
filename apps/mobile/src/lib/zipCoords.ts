// Static ZIP-to-coordinate lookup for common US codes used in the prototype
// Falls back to NYC (40.7128, -74.0060) when ZIP is not found
export const ZIP_COORDS: Record<string, { lat: number; lon: number }> = {
  // NYC Area
  '10001': { lat: 40.7501, lon: -73.9996 },
  '10002': { lat: 40.7157, lon: -73.9863 },
  '10006': { lat: 40.7082, lon: -74.0131 },
  '10013': { lat: 40.7201, lon: -74.0052 },
  '10014': { lat: 40.7336, lon: -74.0027 },
  '10025': { lat: 40.7990, lon: -73.9674 },
  '11213': { lat: 40.6711, lon: -73.9366 },
  '11220': { lat: 40.6420, lon: -74.0145 },
  // Philadelphia Area
  '19103': { lat: 39.9522, lon: -75.1754 },
  '19107': { lat: 39.9491, lon: -75.1570 },
  '19132': { lat: 39.9926, lon: -75.1652 },
  '19143': { lat: 39.9477, lon: -75.2224 },
  // South Jersey
  '08103': { lat: 39.9341, lon: -75.1185 },
  '08104': { lat: 39.9271, lon: -75.1096 },
  // Atlanta
  '30303': { lat: 33.7490, lon: -84.3880 },
  '30310': { lat: 33.7340, lon: -84.4270 },
  // Chicago
  '60601': { lat: 41.8855, lon: -87.6181 },
  '60637': { lat: 41.7803, lon: -87.5990 },
  // Houston
  '77002': { lat: 29.7532, lon: -95.3685 },
  '77021': { lat: 29.7097, lon: -95.3517 },
  // Los Angeles
  '90001': { lat: 33.9731, lon: -118.2479 },
  '90011': { lat: 34.0070, lon: -118.2584 },
  // Miami
  '33101': { lat: 25.7617, lon: -80.1918 },
  '33136': { lat: 25.7799, lon: -80.2020 },
  // Detroit
  '48201': { lat: 42.3314, lon: -83.0457 },
  '48238': { lat: 42.3836, lon: -83.1385 },
};

export const DEFAULT_COORDS = { lat: 40.7128, lon: -74.0060 }; // NYC

export function resolveZip(zip: string): { lat: number; lon: number } {
  return ZIP_COORDS[zip.trim()] ?? DEFAULT_COORDS;
}
