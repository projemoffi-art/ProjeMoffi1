const fs = require('fs');
let code = fs.readFileSync('src/app/business/orders/page.tsx', 'utf8');

// Update STATUS_CONFIG
code = code.replace(
    /pending: \{ label: 'Bekliyor'/g,
    "awaiting_payment: { label: 'Ödeme Bekliyor'"
);
code = code.replace(
    /const STATUS_FLOW: string\[\] = \['pending', 'preparing', 'shipped', 'delivered'\];/g,
    "const STATUS_FLOW: string[] = ['awaiting_payment', 'preparing', 'shipped', 'delivered'];"
);

// Fix status defaults
code = code.replace(
    /status: o\.status \|\| 'pending'/g,
    "status: o.status || 'awaiting_payment'"
);

// Replace fetchOrders
const newFetchOrders = `
    const fetchOrders = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select(\`
                    id, 
                    quantity,
                    price_at_purchase,
                    status,
                    products(name, images),
                    orders!inner(id, status, total_amount, created_at, shipping_address, user_id,
                        profiles!fk_orders_user_id(full_name, email)
                    )
                \`)
                .eq('business_id', user.id)
                .order('created_at', { ascending: false, referencedTable: 'orders' });

            if (error) throw error;

            if (data) {
                const groupedOrders = new Map();
                data.forEach((item: any) => {
                    const orderId = item.orders.id;
                    if (!groupedOrders.has(orderId)) {
                        groupedOrders.set(orderId, {
                            id: orderId,
                            businessId: user.id,
                            customerName: item.orders.profiles?.full_name || "Müşteri",
                            customerEmail: item.orders.profiles?.email || "-",
                            items: [],
                            totalAmount: 0,
                            orderStatus: item.orders.status, // ödeme durumu ('paid', vb)
                            status: item.status || 'awaiting_payment',
                            shippingAddress: item.orders.shipping_address || '',
                            trackingNumber: '', 
                            notes: '', 
                            orderedAt: item.orders.created_at
                        });
                    }
                    const orderGroup = groupedOrders.get(orderId);
                    
                    const itemTotal = Number(item.price_at_purchase) * item.quantity;
                    orderGroup.totalAmount += itemTotal;
                    
                    orderGroup.items.push({
                        itemId: item.id,
                        productName: item.products?.name || "Bilinmeyen Ürün",
                        quantity: item.quantity,
                        price: item.price_at_purchase,
                        status: item.status || 'awaiting_payment'
                    });
                });
                
                setAllOrders(Array.from(groupedOrders.values()));
            }
        } catch (err) {
            console.error("Siparişler çekilemedi:", err);
        } finally {
            setIsLoading(false);
        }
    };
`;
code = code.replace(/const fetchOrders = async \(\) => \{[\s\S]*?\}\s*\};\s*useEffect/g, newFetchOrders.trim() + '\n\n    useEffect');

// Update user effect dependency
code = code.replace(/useEffect\(\(\) => \{\n        fetchOrders\(\);\n    \}, \[\]\);/g, 'useEffect(() => {\n        if (user?.id) fetchOrders();\n    }, [user?.id]);');

// Update Detail Modal render - Remove commission blocks completely
code = code.replace(/<div className="flex justify-between items-center text-red-600 font-medium">[\s\S]*?<\/div>/g, '');
code = code.replace(/<div className="flex justify-between items-center text-green-600 font-bold mt-2">[\s\S]*?<\/div>/g, '');

// The replacement above might leave an empty line, but it's fine.

// Update handleAdvanceStatus
const newHandleAdvance = `
    const handleAdvanceStatus = async () => {
        if (!nextStatus || order.orderStatus !== 'paid') return;
        setUpdating(true);
        try {
            const itemIds = order.items.map((i: any) => i.itemId);
            const { error } = await supabase
                .from('order_items')
                .update({ status: nextStatus })
                .in('id', itemIds);
                
            if (error) throw error;
            onStatusUpdate(nextStatus);
        } catch (err) {
            console.error("Durum güncellenirken hata:", err);
            alert("Sipariş durumu güncellenemedi.");
        } finally {
            setUpdating(false);
        }
    };
`;
code = code.replace(/const handleAdvanceStatus = async \(\) => \{[\s\S]*?\}\s*\};/g, newHandleAdvance.trim());

// Update button rendering in detail modal
const oldBtnRegex = /disabled=\{updating\}[\s\S]*?<ArrowRightLeft className="w-4 h-4" \/>[\s\S]*?\{STATUS_CONFIG\[nextStatus\]\.label\} Yap[\s\S]*?<\/button>/;

const newBtn = `disabled={updating || order.orderStatus !== 'paid'}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor</> : (
                                <>
                                    <ArrowRightLeft className="w-4 h-4" />
                                    {order.orderStatus === 'paid' ? \`\${STATUS_CONFIG[nextStatus].label} Yap\` : 'Ödeme Bekleniyor'}
                                </>
                            )}
                        </button>`;

code = code.replace(oldBtnRegex, newBtn);

fs.writeFileSync('src/app/business/orders/page.tsx', code);
console.log('Script updated successfully');
