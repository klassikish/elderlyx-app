/**
 * Error Handling Utilities
 * Consistent error handling, messages, and recovery
 */

/**
 * Custom Error Classes
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.isKnown = true;
  }
}

export class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.isKnown = true;
  }
}

export class PaymentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentError';
    this.isKnown = true;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.isKnown = true;
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error) {
  if (typeof error === 'string') return error;

  // Known error types
  if (error.name === 'ValidationError') return error.message;
  if (error.name === 'NotFoundError') return error.message;
  if (error.name === 'PaymentError') return `Payment failed: ${error.message}`;
  if (error.name === 'UnauthorizedError') return 'You do not have permission to perform this action';

  // Network errors
  if (error.code === 'NETWORK_ERROR') return 'Network error. Please check your connection.';
  if (error.status === 404) return 'Resource not found';
  if (error.status === 401) return 'Session expired. Please log in again.';
  if (error.status === 403) return 'You do not have permission.';
  if (error.status === 500) return 'Server error. Please try again later.';

  // Generic fallback
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Safe async handler for try-catch
 */
export async function handleAsync(promise) {
  try {
    return [null, await promise];
  } catch (error) {
    return [error, null];
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryAsync(fn, maxAttempts = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}