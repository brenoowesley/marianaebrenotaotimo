import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { getCoordinates } from '@/utils/geocoding'
import { NextResponse } from 'next/server'

export async function GET() {
    // Tenta usar a Service Role Key para acesso admin (Bypass RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    let supabase;
    let isAdmin = false;

    if (supabaseUrl && serviceRoleKey) {
        // Admin client - ignora RLS
        supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
        isAdmin = true
    } else {
        // Fallback para cliente normal (precisa de cookie de auth)
        supabase = createServerClient()
    }

    try {
        // DEBUG: Check auth status (only relevant if not admin)
        let user = null
        if (!isAdmin) {
            const { data } = await supabase.auth.getUser()
            user = data.user
        }

        // 1. Fetch all Realized items
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select(`
                id, 
                title, 
                properties_value,
                latitude,
                longitude, 
                categories (
                    id,
                    template_schema
                )
            `)
            .eq('status', 'Realized')

        if (itemsError) throw itemsError

        if (!items || items.length === 0) {
            return NextResponse.json({
                message: 'No Realized items found',
                debug: {
                    mode: isAdmin ? 'ADMIN (Service Role)' : 'USER (Cookie)',
                    isAuthenticated: isAdmin || !!user,
                    userId: isAdmin ? 'system' : user?.id,
                    envHasServiceKey: !!serviceRoleKey
                }
            })
        }

        const updates = []
        const logs = []

        // 2. Process each item
        for (const item of items) {
            // Fix: Handle categories as array or object safely
            const category = Array.isArray(item.categories) ? item.categories[0] : item.categories
            const schema = category?.template_schema as any[] || []

            // Find a field that looks like an address
            const addressField = schema.find(field =>
                field.name.toLowerCase().includes('endereço') ||
                field.name.toLowerCase().includes('address') ||
                field.name.toLowerCase().includes('local')
            )

            if (addressField) {
                const addressValue = item.properties_value?.[addressField.id]

                // Only update if we have an address AND (no coords OR force update)
                const needsUpdate = !item.latitude || !item.longitude

                if (addressValue && typeof addressValue === 'string' && addressValue.trim().length > 0) {
                    if (needsUpdate) {
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
                        logs.push(`Skipped: ${item.title} (Already has coordinates)`)
                    }
                } else {
                    logs.push(`Skipped: ${item.title} (Empty address value)`)
                }
            } else {
                logs.push(`Skipped: ${item.title} (No address field found in category)`)
            }
        }

        // Execute all updates
        if (updates.length > 0) {
            await Promise.all(updates)
        }

        return NextResponse.json({
            success: true,
            mode: isAdmin ? 'ADMIN' : 'USER',
            total_found: items.length,
            processed: updates.length,
            logs
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
