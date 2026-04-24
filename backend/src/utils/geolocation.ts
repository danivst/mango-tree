/**
 * @file geolocation.ts
 * @description Utility for getting geographical location from an IP address.
 * Uses the ip-api.com service to support localized city and country names.
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
 * Resolves an IP address to a physical location.
 * Skips lookups for local/private IP ranges. Returns a formatted string "City, Country".
 *
 * @param ipAddress - The target IPv4 or IPv6 address
 * @param lang - Target language for location names ('en' or 'bg')
 * @returns Promise resolving to formatted location string or "Unknown location"
 * @throws {Error} Internal service errors are caught and return a fallback string
 *
 * @example
 * ```typescript
 * const loc = await getLocationFromIP("8.8.8.8", "bg");
 * // returns "Маунтин Вю, Съединени щати"
 * ```
 */
export const getLocationFromIP = async (ipAddress: string, lang: string = 'en'): Promise<string> => {
  // Don't query for localhost/private IPs
  if (
    !ipAddress || 
    ipAddress === 'unknown' || 
    ipAddress === '::1' || 
    ipAddress === '127.0.0.1' || 
    ipAddress.startsWith('192.168.') || 
    ipAddress.startsWith('10.') || 
    ipAddress.startsWith('172.')
  ) {
    return lang === 'bg' ? 'Локална връзка' : 'Local connection';
  }

  try {
    /**
     * Using ip-api.com
     * Supports 'lang' parameter: en (default), bg (Bulgarian), etc.
     */
    const response = await axios.get<GeoLocation>(`http://ip-api.com/json/${ipAddress}`, {
      params: { lang },
      timeout: 3000, // 3 second timeout to avoid delaying login
    });

    const data = response.data;

    if (data.status === 'success' && data.city && data.country) {
      return `${data.city}, ${data.country}`;
    } else if (data.status === 'success' && data.country) {
      return data.country;
    } else {
      return lang === 'bg' ? 'Неизвестно местоположение' : 'Unknown location';
    }
  } catch (error: any) {
    logger.warn({ ip: ipAddress, message: error?.message }, "Geolocation lookup failed");
    return lang === 'bg' ? 'Неизвестно местоположение' : 'Unknown location';
  }
};