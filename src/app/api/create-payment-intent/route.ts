import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@supabase/supabase-js";
import { ProductMockService } from "@/services/mock/ProductMockService";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2023-10-16' as any,
}) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function POST(req: NextRequest) {
  try {
    const { amount: clientAmount, currency = 'try', items } = await req.json();

    if (!stripeKey || !stripe) {
      return NextResponse.json(
        { error: "Stripe API Key is not configured." },
        { status: 500 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Sepet boş." }, { status: 400 });
    }

    let calculatedAmount = 0;
    const firstItemId = items[0]?.id || items[0]?.productId;
    const isMock = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstItemId);

    if (isMock) {
        for (const item of items) {
            const itemId = item.id || item.productId;
            const quantity = item.quantity || 1;
            
            if (quantity <= 0) {
                return NextResponse.json({ error: "Siparişte geçersiz ürün miktarı tespit edildi." }, { status: 400 });
            }
            
            const product = await ProductMockService.getProductById(itemId);
            if (!product) continue;
            calculatedAmount += product.price * quantity;
        }
    } else {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: "Veritabanı bağlantısı kurulamadı." }, { status: 500 });
        }
        
        const itemIds = items.map((i: any) => i.id || i.productId);
        const { data: realProducts, error } = await supabaseAdmin
            .from('products')
            .select('id, price')
            .in('id', itemIds);
            
        if (error || !realProducts) {
            return NextResponse.json({ error: "Ürünler doğrulanamadı." }, { status: 500 });
        }
        
        for (const item of items) {
            const itemId = item.id || item.productId;
            const quantity = item.quantity || 1;
            
            if (quantity <= 0) {
                return NextResponse.json({ error: "Siparişte geçersiz ürün miktarı tespit edildi." }, { status: 400 });
            }
            
            const realProduct = realProducts.find(p => p.id === itemId);
            if (!realProduct) continue;
            
            calculatedAmount += Number(realProduct.price) * quantity;
        }
    }

    if (calculatedAmount <= 0) {
        return NextResponse.json({ error: "Geçersiz sepet tutarı." }, { status: 400 });
    }

    // Create a PaymentIntent with the secure calculated amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(calculatedAmount * 100), // Stripe uses cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        item_count: items.length,
        platform: 'Moffi Ecosystem'
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
