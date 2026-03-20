import { jwtDecode } from "jwt-decode";
import { clearCookie } from "./cookies";

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    if (decoded.exp < currentTime) {
      // Check if user has extended expiration from "Remember me"
      const extendedExpiration = localStorage.getItem("tokenExpiration");
      if (extendedExpiration) {
        const expirationDate = new Date(extendedExpiration);
        if (expirationDate > new Date()) {
          // Extended expiration is still valid, keep token
          return true;
        } else {
          // Extended expiration has also expired
          localStorage.removeItem("tokenExpiration");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return false;
        }
      }

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiration");
    return false;
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const clearAuth = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiration");
  // Clear theme and language preferences on logout
  clearCookie("appTheme");
  clearCookie("appLanguage");
};

export const getUserRole = (): string | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.role || null;
  } catch (error) {
    return null;
  }
};

export const getUsername = (): string | null => {
  const token = getToken();
  if (!token) return null;

  try {
    // Username might not be in token, we'd need to fetch from API
    return null;
  } catch (error) {
    return null;
  }
};
