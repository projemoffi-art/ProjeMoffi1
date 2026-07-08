"use client";

import { supabase } from "@/lib/supabase";

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export const paymentService = {
  /**
   * Initializes a subscription checkout session (Iyzico / RevenueCat prep).
   */
  async createSubscriptionCheckout(planId: string, userId: string) {
    console.log(`[Iyzico/RevenueCat] Initializing checkout for plan ${planId}, user ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      token: "sub_tok_" + Math.random().toString(36).substring(7),
      checkoutUrl: "https://pay.moffi.com/checkout/simulate"
    };
  },

  /**
   * Completes the payment process and upgrades user to Prime.
   */
  async completeSubscription(userId: string, planId: string): Promise<PaymentResult> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_prime: true, 
          subscription_tier: planId,
          prime_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      return { success: true, orderId: "SUB-" + Math.random().toString(36).substring(7).toUpperCase() };
    } catch (error: any) {
      console.error("Subscription completion error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancels a subscription but allows it to run until the end of the current billing cycle (Grace Period).
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`[Webhook Prep] Cancelling subscription for user ${userId} at period end.`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // We only set the flag, we don't remove `is_prime` immediately.
      const { error } = await supabase
        .from('profiles')
        .update({ cancel_at_period_end: true })
        .eq('id', userId);

      if (error) throw error;

      return { 
        success: true, 
        message: "Aboneliğiniz iptal edildi. Fatura döneminizin sonuna kadar Prime haklarınızı kullanmaya devam edebilirsiniz." 
      };
    } catch (error: any) {
      console.error("Cancellation error:", error);
      return { success: false, message: "İptal işlemi sırasında bir hata oluştu." };
    }
  },

  /**
   * Retrieves the real subscription state from the payment provider (or our synced database).
   */
  async getSubscriptionStatus(userId: string) {
    // In production, this would call Iyzico / RevenueCat or check our local synced profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('is_prime, prime_until, cancel_at_period_end, subscription_tier')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      return { is_prime: false, status: 'free' };
    }

    return {
      is_prime: data.is_prime,
      tier: data.subscription_tier || 'free',
      next_billing_date: data.prime_until,
      will_cancel: data.cancel_at_period_end,
      status: data.is_prime ? 'active' : 'free'
    };
  }
};
