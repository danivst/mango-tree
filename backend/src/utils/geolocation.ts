/**
 * @file geolocation.ts
 * @description Utility for getting geographical location from an IP address.
 * Uses the ip-api.com service and always returns English location labels.
 */

import axios from "axios";
import logger from "../utils/logger";

/**
 * Interface for geolocation response from ip-api.com
 */
export interface GeoLocation {
  status: string;
  city: string;
  country: string;
  countryCode: string;
  regionName: string;
  lat: number;
  lon: number;
  message?: string;
}

/**
 * Resolves an IP address to a physical location in English.
 * Skips lookups for local/private IP ranges. Returns a formatted string "City, Country".
 *
 * @param ipAddress - The target IPv4 or IPv6 address
 * @returns Promise resolving to formatted location string or "Unknown location"
 * @throws {Error} Internal service errors are caught and return a fallback string
 *
 * @example
 * ```ts
 * const location = await getLocationFromIP("8.8.8.8");
 * // "Mountain View, United States"
 * ```
 */
export const getLocationFromIP = async (
  ipAddress: string,
): Promise<string> => {
  // Don't query for localhost/private IPs
  if (
    !ipAddress ||
    ipAddress === "unknown" ||
    ipAddress === "::1" ||
    ipAddress === "127.0.0.1" ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("10.") ||
    ipAddress.startsWith("172.")
  ) {
    return "Local connection";
  }

  try {
    const response = await axios.get<GeoLocation>(
      `http://ip-api.com/json/${ipAddress}`,
      {
        timeout: 3000, // Avoid delaying login flows on slow lookups.
      },
    );

    const data = response.data;

    if (data.status === "success" && data.city && data.country) {
      return `${data.city}, ${data.country}`;
    }

    if (data.status === "success" && data.country) {
      return data.country;
    }

    return "Unknown location";
  } catch (error: any) {
    logger.warn(
      { ip: ipAddress, message: error?.message },
      "Geolocation lookup failed",
    );
    return "Unknown location";
  }
};
