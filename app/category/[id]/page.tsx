import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { ItemForm } from '@/components/item-form'
import { ItemList } from '@/components/item-list'
import { ChooseForMeButton } from '@/components/choose-for-me-button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface CategoryPageProps {
    params: {
        id: string
    }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch category details
    const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .single()

    if (categoryError || !category) {
        return <div>Category not found</div>
    }

    // Fetch items for this category
    const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', params.id)
        .order('created_at', { ascending: false })

    if (itemsError) {
        console.error('Error fetching items:', itemsError)
    }

    const plannedItems = (items || []).filter((item) => item.status === 'Planned')

    return (
        <div className="container mx-auto p-4 space-y-8">
            {category.cover_image_url && (
                <div className="h-48 w-full overflow-hidden rounded-lg -mt-4 -mx-4 mb-6">
                    <img
                        src={category.cover_image_url}
                        alt={category.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
                            <span>{category.icon}</span>
                            {category.title}
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your items in this category.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ChooseForMeButton
                        items={plannedItems}
                        templateSchema={category.template_schema}
                    />
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-sm">
                                <DrawerHeader>
                                    <DrawerTitle>Add New Item</DrawerTitle>
                                    <DrawerDescription>
                                        Fill in the details for your new item.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <ItemForm
                                    categoryId={category.id}
                                    templateSchema={category.template_schema}
                                />
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>

            <ItemList
                items={items || []}
                templateSchema={category.template_schema}
            />
        </div>
    )
}
