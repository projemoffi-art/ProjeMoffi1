"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { ProductMockService, Product } from "@/services/mock/ProductMockService";
import { InteractiveDesignCanvas } from "@/components/studio/InteractiveDesignCanvas";
import { Preview3D } from "@/components/studio/Preview3D";
import { ExportModal } from "@/components/studio/ExportModal";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

function StudioDesignContent() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');
    const colorId = searchParams.get('colorId');

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // 3D Preview & Export state
    const [show3D, setShow3D] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [designState, setDesignState] = useState<any>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            const idToLoad = productId || 'tshirt-classic';
            const p = await ProductMockService.getProductById(idToLoad);
            setProduct(p);
            setLoading(false);
        };
        loadProduct();
    }, [productId]);

    if (loading) {
        return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;
    }

    if (!product) return <div>Product Not Found</div>;

    const productImage = product.images.front;

    return (
        <div ref={canvasContainerRef} className="h-screen w-full bg-[#09090b] overflow-hidden">
            <InteractiveDesignCanvas
                productImage={productImage}
                productName={product.name}
                onSave={(state) => {
                    setDesignState(state);
                    setShowExport(true);
                }}
            />

            {/* 3D Preview */}
            <AnimatePresence>
                {show3D && (
                    <Preview3D
                        productType={product.id?.includes('mug') ? 'mug' : product.id?.includes('tote') ? 'tote' : 'tshirt'}
                        productImage={productImage}
                        layers={designState?.layers || []}
                        onClose={() => setShow3D(false)}
                    />
                )}
            </AnimatePresence>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                canvasRef={canvasContainerRef}
                designData={designState || { layers: [], product: null }}
            />
        </div>
    );
}

export default function StudioDesignPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>}>
            <StudioDesignContent />
        </Suspense>
    );
}
