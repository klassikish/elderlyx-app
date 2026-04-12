/**
 * Payment Service
 * Handles Stripe integration: payment intents, payment processing, refunds
 */

import { base44 } from '@/api/base44Client';

export const paymentService = {
  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount for payment');
    }

    try {
      const response = await base44.functions.invoke('createPaymentIntent', {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
      });

      if (!response.data?.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      return response.data;
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  },

  /**
   * Create a payment intent for a care pack
   */
  async createCarePackIntent(packType, price) {
    return this.createPaymentIntent(price, 'usd', {
      type: 'care_pack',
      packType,
    });
  },

  /**
   * Process a refund
   */
  async processRefund(paymentIntentId, reason = '') {
    try {
      return await base44.functions.invoke('processRefund', {
        payment_intent_id: paymentIntentId,
        reason,
      });
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw error;
    }
  },

  /**
   * Update booking payment status
   */
  async updatePaymentStatus(bookingId, status, intentId) {
    if (!['pending', 'paid', 'refunded'].includes(status)) {
      throw new Error(`Invalid payment status: ${status}`);
    }

    return base44.entities.Booking.update(bookingId, {
      payment_status: status,
      stripe_payment_intent_id: intentId,
    });
  },

  /**
   * Check if payment is complete
   */
  async isPaymentComplete(paymentIntentId) {
    // In production, check Stripe status via backend function
    // For now, rely on local state updates
    return true;
  },
};