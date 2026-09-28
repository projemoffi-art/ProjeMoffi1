'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Navigation } from 'lucide-react';
import { ClinicCard, FilterChips, directionsUrl } from '@/components/vet/VetShared';

type MapFilter = 'all' | 'open' | 'emergency' | 'verified';

function escapeAttr(value: string) {
    return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
}

function pinIcon(clinic: any, selected: boolean) {
    const size = selected ? 52 : 42;
    const inner = clinic.imageUrl
        ? `<img src="${escapeAttr(clinic.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px" />`
        : `<span style="font:800 16px system-ui;color:#6F675B">${escapeAttr((clinic.name || 'K').charAt(0))}</span>`;
    return L.divIcon({
        className: '',
        iconSize: [size, size + 8],
        iconAnchor: [size / 2, size + 8],
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;border:3px solid ${selected ? '#EE5B3D' : '#ffffff'};box-shadow:0 4px 14px rgba(0,0,0,.25);background:#F7F3EA;display:flex;align-items:center;justify-content:center;overflow:hidden">${inner}</div>
               <div style="width:0;height:0;margin:-2px auto 0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${selected ? '#EE5B3D' : '#ffffff'}"></div>`,
    });
}

function FitBounds({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        if (points.length === 1) map.setView(points[0], 15);
        else map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
    }, [points.map(p => p.join(',')).join('|')]);
    return null;
}

interface Props {
    clinics: any[];
    userLocation: [number, number] | null;
    onClose: () => void;
    onOpenClinic: (clinic: any) => void;
    isFavorite: (id: string) => boolean;
    onToggleFavorite: (id: string) => void;
}

// Referans Ekran 3 — Harita Görünümü.
export default function ClinicMapView({ clinics, userLocation, onClose, onOpenClinic, isFavorite, onToggleFavorite }: Props) {
    const [filter, setFilter] = useState<MapFilter>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const located = useMemo(() => clinics.filter(c => c.location?.lat && c.location?.lng).filter(c => {
        if (filter === 'open') return c.isOpenNow;
        if (filter === 'verified') return c.isVerified;
        if (filter === 'emergency') return (c.features || []).some((f: string) => f.toLocaleLowerCase('tr-TR').includes('acil'));
        return true;
    }), [clinics, filter]);

    const selected = located.find(c => c.id === selectedId) || located[0] || null;
    const missing = clinics.length - clinics.filter(c => c.location?.lat).length;
    const points = located.map(c => [c.location.lat, c.location.lng] as [number, number]);
    const center: [number, number] = points[0] || userLocation || [41.0082, 28.9784];

    return (
        <div className="fixed inset-0 z-[3000] bg-background flex flex-col">
            <div className="px-4 pt-6 pb-3 space-y-3 bg-background border-b border-card-border">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} aria-label="Geri" className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-black text-foreground">Harita görünümü</h2>
                </div>
                <FilterChips<MapFilter>
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { id: 'all', label: 'Tümü' },
                        { id: 'open', label: 'Açık olanlar' },
                        { id: 'emergency', label: 'Acil servis' },
                        { id: 'verified', label: 'Moffi onaylı' },
                    ]}
                />
            </div>

            <div className="relative flex-1">
                <MapContainer center={center} zoom={13} className="absolute inset-0 z-0" zoomControl={true}>
                    <TileLayer
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap katkıcıları'
                        maxZoom={19}
                    />
                    <FitBounds points={points} />
                    {located.map(c => (
                        <Marker
                            key={c.id}
                            position={[c.location.lat, c.location.lng]}
                            icon={pinIcon(c, selected?.id === c.id)}
                            eventHandlers={{ click: () => setSelectedId(c.id) }}
                        />
                    ))}
                </MapContainer>

                {located.length === 0 && (
                    <div className="absolute inset-x-4 top-4 z-[500] bg-card border border-card-border rounded-2xl p-4 text-center text-xs font-bold text-secondary">
                        Bu filtreye uyan ve haritada konumu olan işletme yok.
                    </div>
                )}
                {missing > 0 && located.length > 0 && (
                    <div className="absolute left-4 top-4 z-[500] bg-card/95 border border-card-border rounded-xl px-3 py-2 text-[11px] font-semibold text-secondary">
                        {missing} işletme konum paylaşmadığı için haritada yok
                    </div>
                )}
            </div>

            {selected && (
                <div className="p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] bg-background border-t border-card-border space-y-3">
                    <ClinicCard
                        clinic={selected}
                        onOpen={() => onOpenClinic(selected)}
                        isFavorite={isFavorite(selected.id)}
                        onToggleFavorite={() => onToggleFavorite(selected.id)}
                    />
                    <a
                        href={directionsUrl(selected)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-12 rounded-xl bg-accent/10 text-accent font-black text-sm flex items-center justify-center gap-2"
                    >
                        <Navigation className="w-4 h-4" /> Yol tarifi
                    </a>
                </div>
            )}
        </div>
    );
}
