/**
 * Geocoding utility using OpenStreetMap Nominatim API
 * Converts address strings to latitude/longitude coordinates
 */

interface Coordinates {
    lat: number
    lng: number
}

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
}

/**
 * Converts an address string to geographic coordinates using OSM Nominatim
 * 
 * @param address - The address string to geocode (e.g., "1600 Amphitheatre Parkway, Mountain View, CA")
 * @returns Promise resolving to coordinates object or null if geocoding fails
 * 
 * @example
 * const coords = await getCoordinates("Ponta Negra, Natal, RN, Brazil")
 * if (coords) {
 *   console.log(`Lat: ${coords.lat}, Lng: ${coords.lng}`)
 * }
 */
export async function getCoordinates(address: string): Promise<Coordinates | null> {
    // Validate input
    if (!address || address.trim().length === 0) {
        console.warn('getCoordinates: Empty address provided')
        return null
    }

    try {
        // OpenStreetMap Nominatim API endpoint
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`

        // IMPORTANT: User-Agent header is REQUIRED by OSM Nominatim policy
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DuoSyncApp/1.0 (Notion Clone Map Feature)',
            },
        })

        if (!response.ok) {
            console.error(`getCoordinates: HTTP error ${response.status} for address: ${address}`)
            return null
        }

        const data: NominatimResult[] = await response.json()

        // Check if we got any results
        if (!data || data.length === 0) {
            console.warn(`getCoordinates: No results found for address: ${address}`)
            return null
        }

        const result = data[0]

        // Parse and return coordinates
        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        }
    } catch (error) {
        // Log error but don't crash the app
        console.error('getCoordinates: Error fetching coordinates:', error)
        return null
    }
}

/**
 * Batch geocode multiple addresses
 * Note: Includes a delay between requests to respect Nominatim's rate limits (1 req/sec)
 * 
 * @param addresses - Array of address strings to geocode
 * @returns Promise resolving to array of coordinates (null for failed geocodes)
 */
export async function batchGeocode(addresses: string[]): Promise<(Coordinates | null)[]> {
    const results: (Coordinates | null)[] = []

    for (const address of addresses) {
        const coords = await getCoordinates(address)
        results.push(coords)

        // Rate limiting: Wait 1 second between requests (Nominatim policy)
        if (addresses.indexOf(address) < addresses.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    return results
}
