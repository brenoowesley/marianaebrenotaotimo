import { createClient } from '@/utils/supabase/server'
import { getCoordinates } from '@/utils/geocoding'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient()

    try {
        // 1. Fetch all Realized items that don't have coordinates yet
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select(`
                id, 
                title, 
                properties_value, 
                categories (
                    id,
                    template_schema
                )
            `)
            .eq('status', 'Realized')
            .is('latitude', null)

        if (itemsError) throw itemsError
        if (!items || items.length === 0) {
            return NextResponse.json({ message: 'No items to sync' })
        }

        const updates = []
        const logs = []

        // 2. Process each item
        for (const item of items) {
            const schema = item.categories?.template_schema as any[] || []

            // Find a field that looks like an address
            const addressField = schema.find(field =>
                field.name.toLowerCase().includes('endereço') ||
                field.name.toLowerCase().includes('address') ||
                field.name.toLowerCase().includes('local')
            )

            if (addressField) {
                const addressValue = item.properties_value?.[addressField.id]

                if (addressValue && typeof addressValue === 'string' && addressValue.trim().length > 0) {
                    // 3. Geocode
                    const coords = await getCoordinates(addressValue)

                    if (coords) {
                        // 4. Prepare update
                        updates.push(
                            supabase
                                .from('items')
                                .update({
                                    address: addressValue,
                                    latitude: coords.lat,
                                    longitude: coords.lng,
                                    geocoded_at: new Date().toISOString()
                                })
                                .eq('id', item.id)
                        )
                        logs.push(`Synced: ${item.title} -> ${addressValue} (${coords.lat}, ${coords.lng})`)

                        // Rate limiting protection (1s delay between geocodes)
                        await new Promise(resolve => setTimeout(resolve, 1000))
                    } else {
                        logs.push(`Failed to geocode: ${item.title} -> ${addressValue}`)
                    }
                } else {
                    logs.push(`Skipped: ${item.title} (Empty address value)`)
                }
            } else {
                logs.push(`Skipped: ${item.title} (No address field found in category)`)
            }
        }

        // Execute all updates
        await Promise.all(updates)

        return NextResponse.json({
            success: true,
            processed: items.length,
            updated: updates.length,
            logs
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
