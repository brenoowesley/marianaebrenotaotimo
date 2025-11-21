import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarViewComponent } from '@/components/calendar-view-component'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CalendarViewPage() {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch all realized items with their categories
    const { data: items, error } = await supabase
        .from('items')
        .select(`
      *,
      categories (
        id,
        title,
        icon,
        template_schema
      )
    `)
        .eq('status', 'Realized')
        .order('realized_at', { ascending: false })

    if (error) {
        console.error('Error fetching items:', error)
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <CalendarIcon className="h-8 w-8" />
                            Scrapbook
                        </h1>
                        <p className="text-muted-foreground">
                            O que fizemos
                        </p>
                    </div>
                </div>
            </div>

            <CalendarViewComponent items={items || []} />
        </div>
    )
}
