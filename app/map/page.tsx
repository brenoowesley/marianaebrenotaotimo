import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapWrapper } from '@/components/map-wrapper'

export const revalidate = 0

export default async function MapPage() {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch realized items with coordinates
    const { data: items } = await supabase
        .from('items')
        .select(`
            id, 
            title, 
            status,
            address,
            latitude,
            longitude,
            rating,
            item_photo_url,
            notes,
            realized_at,
            categories(title)
        `)
        .eq('status', 'Realized')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('realized_at', { ascending: false })

    // Map to location format
    const realLocations = (items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        lat: item.latitude,
        lng: item.longitude,
        address: item.address || 'Local não especificado',
        categoryName: item.categories?.title,
        coverImage: item.item_photo_url,
        rating: item.rating,
        notes: item.notes,
        realized_at: item.realized_at,
    }))

    return (
        <div className="relative h-[calc(100vh-4rem)]">
            {/* Map */}
            <MapWrapper locations={realLocations} />
        </div>
    )
}
