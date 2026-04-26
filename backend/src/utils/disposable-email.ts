/**
 * A comprehensive set of known disposable (temporary) email provider domains.
 * This list is used to identify and filter out short-lived accounts during registration.
 * 
 * @constant {Set<string>}
 */
const disposableDomains = new Set([
  "mailinator.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "throwawaymail.com",
  "yopmail.com",
  "maildrop.cc",
  "getnada.com",
  "dispostable.com",
  "tempmail.com",
  "sharklasers.com",
  "guerillamail.info",
  "grr.la",
  "teleworm.us",
  "dayrep.com",
  "fakeinbox.com",
  "discard.email",
  "burnermail.io"
]);

/**
 * Validates whether a given email address belongs to a known disposable email provider.
 *  
 * @param {string} email - The full email address to check (e.g., "user@example.com").
 * @returns {boolean} - Returns true if the domain is found in the disposable list, otherwise false.
 * 
 * @example
 * isDisposableEmail("test@mailinator.com"); // returns true
 * isDisposableEmail("user@gmail.com");     // returns false
 */
export const isDisposableEmail = (email: string): boolean => {
  if (!email || !email.includes("@")) {
    return false;
  }

  const domain = email.split("@")[1];
  return domain ? disposableDomains.has(domain.toLowerCase()) : false;
};