/**
 * Validation Utilities
 * Common input validation and data checks
 */

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0;
}

/**
 * Validate rating (0-5)
 */
export function isValidRating(rating) {
  return typeof rating === 'number' && rating >= 0 && rating <= 5;
}

/**
 * Validate date is in the future
 */
export function isFutureDate(date) {
  return new Date(date) > new Date();
}

/**
 * Validate date is in the past
 */
export function isPastDate(date) {
  return new Date(date) < new Date();
}

/**
 * Validate booking data
 */
export function validateBookingData(data) {
  const errors = [];

  if (!data.serviceType || !['companionship', 'transportation'].includes(data.serviceType)) {
    errors.push('Invalid service type');
  }
  if (!data.scheduledDate || !isFutureDate(data.scheduledDate)) {
    errors.push('Scheduled date must be in the future');
  }
  if (!isPositiveNumber(data.price)) {
    errors.push('Price must be a positive number');
  }
  if (data.duration && !isPositiveNumber(data.duration)) {
    errors.push('Duration must be a positive number');
  }

  return errors;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount) {
  if (!isPositiveNumber(amount)) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  if (amount < 0.5) {
    return { valid: false, error: 'Amount must be at least $0.50' };
  }
  if (amount > 10000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }
  return { valid: true };
}