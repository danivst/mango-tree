/**
 * @file geolocation.ts
 * @description Utility for getting geographical location from an IP address.
 * Uses the free ipapi.co service (no API key required for basic usage).
 */

import axios from "axios";
import logger from "../utils/logger";

/**
 * Interface for geolocation response from ipapi.co
 */
export interface GeoLocation {
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

/**
 * Resolves an IP address to a physical location.
 * Skips lookups for local/private IP ranges. Returns a formatted string "City, Country".
 *
 * @param ipAddress - The target IPv4 or IPv6 address
 * @returns Promise resolving to formatted location string or "Unknown location"
 * @throws {Error} Internal service errors are caught and return a fallback string
 *
 * @example
 * ```typescript
 * const loc = await getLocationFromIP("8.8.8.8");
 * // returns "Mountain View, United States"
 * ```
 */
export const getLocationFromIP = async (ipAddress: string): Promise<string> => {
  // Don't query for localhost/private IPs
  if (!ipAddress || ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
    return 'Local connection';
  }

  try {
    // Using ipapi.co - free tier: 1000 requests/day, no API key required
    const response = await axios.get<GeoLocation>(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 3000, // 3 second timeout to avoid delaying login
      headers: {
        'User-Agent': 'MangoTree/1.0.0'
      }
    });

    const data = response.data;

    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    } else if (data.country_name) {
      return data.country_name;
    } else {
      return 'Unknown location';
    }
  } catch (error: any) {
    logger.warn({ ip: ipAddress, message: error?.message }, "Geolocation lookup failed");
    return 'Unknown location';
  }
};