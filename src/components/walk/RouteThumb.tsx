// Liste satırları için rota önizlemesi (harita karosu çekmeden, sadece çizgi).
export default function RouteThumb({ path, className }: { path: [number, number][]; className?: string }) {
    if (path.length < 2) {
        return (
            <div className={`bg-[#E9EFE2] flex items-center justify-center text-xl ${className || ''}`}>🐾</div>
        );
    }
    const lats = path.map(p => p[0]);
    const lngs = path.map(p => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const span = Math.max(maxLat - minLat, maxLng - minLng, 0.0002);
    const toXY = ([lat, lng]: [number, number]) => {
        const x = 12 + ((lng - minLng) / span) * 76 + (76 - ((maxLng - minLng) / span) * 76) / 2;
        const y = 88 - ((lat - minLat) / span) * 76 - (76 - ((maxLat - minLat) / span) * 76) / 2;
        return [x, y] as const;
    };
    const points = path.map(p => toXY(p).map(n => n.toFixed(1)).join(',')).join(' ');
    const [sx, sy] = toXY(path[0]);
    return (
        <div className={`bg-[#E9EFE2] ${className || ''}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <polyline points={points} fill="none" stroke="#EE5B3D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={sx} cy={sy} r="4.5" fill="#201B16" stroke="#FFFFFF" strokeWidth="2" />
            </svg>
        </div>
    );
}
