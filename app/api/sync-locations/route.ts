import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { getCoordinates } from '@/utils/geocoding'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // Get force param
    const { searchParams } = new URL(request.url)
    const forceUpdate = searchParams.get('force') === 'true'

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
            const addressField = schema.find((field: any) =>
                field.name.toLowerCase().includes('endereço') ||
                field.name.toLowerCase().includes('address') ||
                field.name.toLowerCase().includes('local')
            )

            if (addressField) {
                const addressValue = item.properties_value?.[addressField.id]

                // Update if:
                // 1. Force update is requested
                // 2. OR coordinates are missing
                const shouldUpdate = forceUpdate || !item.latitude || !item.longitude

                if (addressValue && typeof addressValue === 'string' && addressValue.trim().length > 0) {
                    if (shouldUpdate) {
                        // Strategy 1: Exact address
                        let coords = await getCoordinates(addressValue)
                        let strategy = 'Exact'

                        // Strategy 2: Append Context (RN, Brazil) if failed
                        if (!coords && !addressValue.toLowerCase().includes('brasil')) {
                            const contextAddr = `${addressValue}, Rio Grande do Norte, Brazil`
                            coords = await getCoordinates(contextAddr)
                            strategy = 'Context Added'
                            await new Promise(resolve => setTimeout(resolve, 1000))
                        }

                        // Strategy 3: POI Search (Title + City inferred) if failed
                        if (!coords) {
                            const city = addressValue.toLowerCase().includes('natal') ? 'Natal' : 'São Miguel do Gostoso'
                            const poiAddr = `${item.title}, ${city}, Rio Grande do Norte, Brazil`
                            coords = await getCoordinates(poiAddr)
                            strategy = 'POI Search'
                            await new Promise(resolve => setTimeout(resolve, 1000))
                        }

                        // Strategy 4: Aggressive Street Only (Remove Zip, State, Country, Neighborhoods, Numbers)
                        if (!coords) {
                            const cleanAddress = addressValue
                                .replace(/\d{5}-?\d{3}/g, '') // Remove Zip (59585-000)
                                .replace(/(Rio Grande do Norte|RN|Brasil|Brazil)/gi, '') // Remove State/Country
                                .replace(/(Centro|Bairro|Vila)/gi, '') // Remove common neighborhoods
                                .replace(/\d+/g, '') // Remove numbers
                                .replace(/[-–,]/g, ' ') // Remove separators
                                .replace(/\s+/g, ' ') // Collapse spaces
                                .trim()

                            // Force City Context
                            let searchAddr = cleanAddress
                            if (!cleanAddress.toLowerCase().includes('gostoso')) {
                                searchAddr = `${cleanAddress}, São Miguel do Gostoso`
                            }

                            coords = await getCoordinates(searchAddr)
                            strategy = 'Aggressive Clean'
                            await new Promise(resolve => setTimeout(resolve, 1000))

                            if (!coords) {
                                logs.push(`Failed to geocode (All attempts): ${item.title} -> ${addressValue} (Tried: Exact, Context, POI, Aggressive: "${searchAddr}")`)
                            }
                        }

                        if (coords) {
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
                            logs.push(`Synced (${strategy}): ${item.title} -> ${addressValue} (${coords.lat}, ${coords.lng})`)
                        }
                    } else {
                        logs.push(`Skipped: ${item.title} (Already has coordinates)`)
                    }
                } else {
                    logs.push(`Skipped: ${item.title} (Empty address value)`)
                }
            } else {
                const fieldNames = schema.map((f: any) => f.name).join(', ')
                logs.push(`Skipped: ${item.title} (No address field found. Fields: ${fieldNames})`)
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
