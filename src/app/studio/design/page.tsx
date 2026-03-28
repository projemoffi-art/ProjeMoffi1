"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { ProductMockService, Product } from "@/services/mock/ProductMockService";
import { InteractiveDesignCanvas } from "@/components/studio/InteractiveDesignCanvas";
import { Preview3D } from "@/components/studio/Preview3D";
import { ExportModal } from "@/components/studio/ExportModal";
import { Loader2, X, Box } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function StudioDesignContent() {
    const searchParams = useSearchParams();
    const productId = searchParams?.get('productId');
    const colorId = searchParams?.get('colorId');

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // 3D Preview & Export state
    const [show3D, setShow3D] = useState(true); // Default to true for sync
    const [showExport, setShowExport] = useState(false);
    const [layers, setLayers] = useState<any[]>([]);
    const [activeColor, setActiveColor] = useState<string>("#ffffff");
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            const idToLoad = productId || 'tshirt-classic';
            const p = await ProductMockService.getProductById(idToLoad);
            setProduct(p);
            if (p && colorId) {
                const color = p.colors.find(c => c.id === colorId);
                if (color) setActiveColor(color.hex);
            }
            setLoading(false);
        };
        loadProduct();
    }, [productId, colorId]);

    if (loading) {
        return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;
    }

    if (!product) return <div>Product Not Found</div>;

    const productImage = product.images.front;

    return (
        <div ref={canvasContainerRef} className="h-screen w-full bg-[#050505] overflow-hidden flex flex-col md:flex-row">
            {/* Main Canvas Area */}
            <div className="flex-1 relative order-2 md:order-1">
                <InteractiveDesignCanvas
                    productImage={productImage}
                    productName={product.name}
                    initialLayers={layers}
                    onLayersChange={setLayers}
                    onSave={(state) => {
                        setLayers(state.layers);
                        setShowExport(true);
                    }}
                />
            </div>

            {/* PERSISTENT 3D PREVIEW (Real-time Sync) */}
            <AnimatePresence>
                {show3D && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="w-full md:w-[400px] lg:w-[450px] h-[350px] md:h-full bg-[#0c0c0e] border-l border-white/10 relative z-30 order-1 md:order-2"
                    >
                        <Preview3D
                            productType={product.id?.includes('mug') ? 'mug' : product.id?.includes('tote') ? 'tote' : 'tshirt'}
                            productImage={productImage}
                            layers={layers}
                            isEmbedded={true}
                            onClose={() => setShow3D(false)}
                        />
                        
                        {/* Toggle button for mobile or when hidden */}
                        <button 
                            onClick={() => setShow3D(false)}
                            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors md:flex hidden"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Float toggle if hidden */}
            {!show3D && (
                <button 
                    onClick={() => setShow3D(true)}
                    className="absolute top-20 right-6 z-40 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all md:flex hidden"
                >
                    <Box className="w-6 h-6 text-white" />
                </button>
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={showExport}
                onClose={() => setShowExport(false)}
                canvasRef={canvasContainerRef}
                designData={{ layers, product }}
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
