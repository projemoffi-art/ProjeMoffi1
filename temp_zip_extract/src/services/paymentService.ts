"use client";

import { supabase } from "@/lib/supabase";

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export const paymentService = {
  /**
   * Initializes a payment session.
   * In a real iyzico integration, this would call your backend to get a checkout form URL.
   */
  async initializeCheckout(planId: string, userId: string) {
    console.log(`Initializing checkout for plan ${planId} and user ${userId}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      token: "mock_token_" + Math.random().toString(36).substring(7),
      checkoutUrl: "#" 
    };
  },

  /**
   * Completes the payment process and updates user status.
   */
  async completeSubscription(userId: string, planId: string): Promise<PaymentResult> {
    try {
      // 1. Simulate payment processing with bank
      await new Promise(resolve => setTimeout(resolve, 2500));

      // 2. Update user status in Supabase
      // Assuming 'profiles' table has 'is_prime' and 'subscription_tier'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_prime: true, 
          subscription_tier: planId,
          prime_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Create a system notification for the user
      await supabase.from('notifications').insert([{
        user_id: userId,
        type: 'system',
        title: 'Hoş Geldin Elite!',
        content: 'Moffi Elite üyeliğin başarıyla aktif edildi. Tüm ayrıcalıkların keyfini çıkar!',
        is_read: false
      }]);

      return { success: true, orderId: "MOF-" + Math.random().toString(36).substring(7).toUpperCase() };
    } catch (error: any) {
      console.error("Payment completion error:", error);
      return { success: false, error: error.message };
    }
  }
};
