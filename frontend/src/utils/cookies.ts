// frontend/src/utils/cookies.ts

export const setCookie = (
  name: string,
  value: string,
  days: number,
  path: string = "/",
) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=${path}`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string, path: string = "/") => {
  document.cookie = `${name}=; Max-Age=-99999999;path=${path}`;
};

// Alias for consistency with naming conventions
export const clearCookie = deleteCookie;
