import { BusinessType } from "@/context/AuthContext";

// ============================
// BUSINESS APPLICATION
// ============================
export interface BusinessApplication {
    id: string;
    userId: string;
    businessName: string;
    businessType: BusinessType;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
    iban: string;
    status: 'pending' | 'approved' | 'rejected';
    appliedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
}

// ============================
// PRODUCTS (PetShop)
// ============================
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';
export type ProductCategory = 'food' | 'toy' | 'accessory' | 'health' | 'clothing' | 'bed' | 'other';

export interface BusinessProduct {
    id: string;
    businessId: string;
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    originalPrice?: number;
    stock: number;
    status: ProductStatus;
    images: string[];
    variants?: { name: string; options: string[] }[];
    createdAt: string;
    updatedAt: string;
}

// ============================
// ORDERS
// ============================
export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface BusinessOrder {
    id: string;
    businessId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    items: { productId: string; productName: string; quantity: number; price: number; image?: string }[];
    totalAmount: number;
    commission: number;
    netAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    trackingNumber?: string;
    notes?: string;
    orderedAt: string;
    updatedAt: string;
}

// ============================
// APPOINTMENTS (Vet)
// ============================
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface BusinessAppointment {
    id: string;
    businessId: string;
    petName: string;
    petType: string;
    ownerName: string;
    ownerPhone: string;
    service: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    notes?: string;
    price?: number;
    image?: string;
    createdAt: string;
}

// ============================
// CAMPAIGNS
// ============================
export type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'draft';

export interface BusinessCampaign {
    id: string;
    businessId: string;
    title: string;
    description: string;
    discountPercent: number;
    code?: string;
    startDate: string;
    endDate: string;
    status: CampaignStatus;
    usageCount: number;
    maxUsage?: number;
    createdAt: string;
}

// ============================
// FINANCE
// ============================
export type TransactionType = 'sale' | 'commission' | 'payout' | 'refund';

export interface FinanceTransaction {
    id: string;
    businessId: string;
    type: TransactionType;
    amount: number;
    description: string;
    relatedOrderId?: string;
    date: string;
    status: 'completed' | 'pending' | 'cancelled';
}

export interface FinanceSummary {
    totalRevenue: number;
    totalCommission: number;
    netEarnings: number;
    pendingPayout: number;
    availableBalance: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
}

// ============================
// MODERATION (Admin)
// ============================
export type ReportType = 'product' | 'review' | 'social_post' | 'business';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ModerationReport {
    id: string;
    type: ReportType;
    targetId: string;
    targetTitle: string;
    reportedBy: string;
    reason: string;
    status: ReportStatus;
    createdAt: string;
    resolvedAt?: string;
    resolution?: string;
}

// ============================
// PLATFORM SETTINGS (Admin)
// ============================
export interface PlatformSettings {
    defaultCommissionRate: number;
    minPayoutAmount: number;
    maintenanceMode: boolean;
    categories: { id: string; name: string; icon: string; order: number }[];
    businessTypes: { key: BusinessType; label: string; enabled: boolean }[];
}
