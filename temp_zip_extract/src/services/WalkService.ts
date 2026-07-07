class WalkService {
    // NEW: Get Sponsored Route (Sahil Yolu)
    async getSponsoredRoute(): Promise<[number, number][]> {
        return [
            [40.9632, 29.0645], // Voi
            [40.9615, 29.0680], // Joker Vet
            [40.9590, 29.0620], // Park
            [40.9640, 29.0660], // PetZone
        ];
    }

    // NEW: Calculate Real Street Route via OSRM
    async calculateRoute(start: [number, number], end: [number, number]): Promise<[number, number][]> {
        // Fallback for demo if APIs fail or are blocked
        try {
            // Using OSRM Public API (Demo only - heavily rate limited)
            // Coordinates in OSRM are lng,lat
            const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Return format: [lat, lng][]
                return data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            }
        } catch (err) {
            console.error("Routing error", err);
        }

        // Fallback: Straight line
        return [start, end];
    }
}

export const walkService = new WalkService();
