/**
 * Care Pack Service
 * Handles prepaid visit packages: purchases, redemptions, balance tracking
 */

import { base44 } from '@/api/base44Client';
import { CARE_PACKS } from '@/lib/config/constants';

export const carePackService = {
  /**
   * Get all active care packs for a user
   */
  async getActivePacks(ownerEmail) {
    return base44.entities.CarePack.filter({
      owner_email: ownerEmail,
      status: 'active',
    }, '-purchased_at');
  },

  /**
   * Get a specific care pack
   */
  async getPack(packId) {
    const packs = await base44.entities.CarePack.filter({ id: packId }, '-created_date', 1);
    return packs[0] || null;
  },

  /**
   * Create a new care pack after payment
   */
  async createPack(ownerEmail, ownerName, packType, amountPaid, stripePaymentIntentId) {
    const packConfig = CARE_PACKS[packType];
    if (!packConfig) throw new Error(`Invalid pack type: ${packType}`);

    return base44.entities.CarePack.create({
      owner_email: ownerEmail,
      owner_name: ownerName,
      pack_type: packType,
      total_visits: packConfig.visits,
      used_visits: 0,
      remaining_visits: packConfig.visits,
      amount_paid: amountPaid,
      stripe_payment_intent_id: stripePaymentIntentId,
      status: 'active',
      purchased_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + packConfig.validDays * 24 * 60 * 60 * 1000).toISOString(),
    });
  },

  /**
   * Redeem a visit from a care pack
   */
  async redeemVisit(packId, bookingId) {
    const pack = await this.getPack(packId);
    if (!pack || pack.status !== 'active') {
      throw new Error('Pack is not active');
    }
    if (pack.remaining_visits <= 0) {
      throw new Error('No visits remaining');
    }

    const newUsed = pack.used_visits + 1;
    const newRemaining = pack.remaining_visits - 1;

    await base44.entities.CarePack.update(packId, {
      used_visits: newUsed,
      remaining_visits: newRemaining,
      status: newRemaining === 0 ? 'exhausted' : 'active',
    });

    // Link booking to pack
    await base44.entities.Booking.update(bookingId, { care_pack_id: packId });

    return { newRemaining, newUsed };
  },

  /**
   * Get total remaining visits across all active packs
   */
  async getTotalRemainingVisits(ownerEmail) {
    const packs = await this.getActivePacks(ownerEmail);
    return packs.reduce((sum, p) => sum + (p.remaining_visits || 0), 0);
  },
};