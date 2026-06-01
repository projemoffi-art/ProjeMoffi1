export default function ShopPage() {
    return (
        <main className="fixed inset-0 bg-card z-40 flex flex-col">
            <div className="flex-1 w-full h-full pt-0 pb-20">
                <iframe
                    src="https://moffi.net"
                    className="w-full h-full border-0"
                    title="Moffi Shop"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>
            {/* Footer spacing is handled by the iframe container's padding-bottom to allow BottomNav visibility if it persists, 
          but usually separate pages might have their own nav. user implies "within app", so keeping nav visible is good. */}
        </main>
    );
}
