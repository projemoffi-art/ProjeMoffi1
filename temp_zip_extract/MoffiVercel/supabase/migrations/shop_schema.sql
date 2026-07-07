-- Create Orders Table
CREATE TABLE IF NOT EXISTS shop_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
    total_price DECIMAL(12,2) NOT NULL,
    shipping_address TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS shop_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" 
ON shop_orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON shop_orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own order items" 
ON shop_order_items FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM shop_orders 
    WHERE id = shop_order_items.order_id 
    AND user_id = auth.uid()
));

CREATE POLICY "Users can insert their own order items" 
ON shop_order_items FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM shop_orders 
    WHERE id = shop_order_items.order_id 
    AND user_id = auth.uid()
));

-- Function to update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shop_orders_updated_at
BEFORE UPDATE ON shop_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
