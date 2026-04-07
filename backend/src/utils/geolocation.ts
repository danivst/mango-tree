/**
 * @file geolocation.ts
 * @description Utility for getting geographical location from an IP address.
 * Uses the free ipapi.co service (no API key required for basic usage).
 */

import axios from "axios";

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
 * Fetches geographical location information for an IP address.
 * Falls back to default message if service is unavailable or IP is localhost.
 *
 * @param ipAddress - The IP address to look up
 * @returns Promise with formatted location string (e.g., "Sofia, Bulgaria") or "unknown location"
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
    console.error('Geolocation lookup failed:', error?.message || String(error));
    return 'Unknown location';
  }
};
