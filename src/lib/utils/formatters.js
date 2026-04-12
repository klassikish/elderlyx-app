/**
 * Formatting Utilities
 * Common formatting functions for dates, currency, time, etc.
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format currency with proper symbols
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format time elapsed (MM:SS or HH:MM:SS)
 */
export function formatElapsedTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format date and time nicely
 */
export function formatDateTime(date) {
  return format(new Date(date), 'MMM d, h:mm a');
}

/**
 * Format date only
 */
export function formatDate(date) {
  return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format time only
 */
export function formatTime(date) {
  return format(new Date(date), 'h:mm a');
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format address briefly
 */
export function formatAddress(address) {
  if (!address) return 'No address provided';
  return address.length > 40 ? `${address.substring(0, 37)}...` : address;
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Format rating with stars
 */
export function formatRating(rating) {
  const rounded = Math.round(rating * 10) / 10;
  const stars = Math.round(rating);
  return { value: rounded, stars };
}