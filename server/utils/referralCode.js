const { customAlphabet } = require('nanoid');

// Create custom alphabet (uppercase letters and numbers, no confusing characters like O,0,I,1)
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

/**
 * Generate a unique referral code
 * Format: 8 characters, uppercase + numbers, no confusing characters
 * Example: AB3D5KP7
 */
function generateReferralCode() {
  return nanoid();
}

/**
 * Validate referral code format
 */
function isValidReferralCode(code) {
  if (!code || typeof code !== 'string') return false;
  // Must be 8 characters, only allowed characters
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code);
}

/**
 * Format partner name to suggested referral code
 * Example: "John Smith" -> "JSMITH"
 */
function suggestReferralCode(name) {
  if (!name) return generateReferralCode();

  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 8);

  // If too short, pad with random characters
  if (cleaned.length < 8) {
    return cleaned + nanoid(8 - cleaned.length);
  }

  return cleaned;
}

module.exports = {
  generateReferralCode,
  isValidReferralCode,
  suggestReferralCode
};
