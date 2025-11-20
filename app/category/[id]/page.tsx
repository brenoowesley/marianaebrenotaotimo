import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, ArrowLeft, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { ItemForm } from '@/components/item-form'
import { ItemList } from '@/components/item-list'
import { ChooseForMeButton } from '@/components/choose-for-me-button'
import { CoverReposition } from '@/components/cover-reposition'
import { CategoryAnalytics } from '@/components/category-analytics'
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
        <div className="container mx-auto p-4 pb-24 space-y-6">
            {category.cover_image_url && (
                <div className="-mt-4 -mx-4 mb-6">
                    <CoverReposition
                        categoryId={category.id}
                        coverImageUrl={category.cover_image_url}
                        initialPosition={category.cover_position || 50}
                    />
                </div>
            )}

            {/* Header - Mobile First Layout */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Left: Back Button + Title */}
                <div className="flex items-start gap-3">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="mt-1">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight flex items-center gap-2 break-words">
                            <span>{category.icon}</span>
                            {category.title}
                        </h1>
                        <p className="text-muted-foreground mt-1 mb-6">
                            Gerencie seus itens dessa categoria
                        </p>

                        {/* Mobile Actions (below title) */}
                        <div className="md:hidden flex gap-2">
                            <ChooseForMeButton
                                items={plannedItems}
                                templateSchema={category.template_schema}
                            />
                            <Drawer>
                                <DrawerTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <BarChart3 className="h-4 w-4" />
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent>
                                    <div className="mx-auto w-full max-w-md p-4 h-[80vh] overflow-y-auto">
                                        <DrawerHeader>
                                            <DrawerTitle>Insights da Categoria</DrawerTitle>
                                            <DrawerDescription>
                                                Análise dos seus hábitos e itens realizados.
                                            </DrawerDescription>
                                        </DrawerHeader>
                                        <CategoryAnalytics
                                            items={items || []}
                                            templateSchema={category.template_schema}
                                        />
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        </div>
                    </div>
                </div>

                {/* Right: Desktop Actions */}
                <div className="hidden md:flex gap-2">
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button variant="outline">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Insights
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-2xl p-4 h-[80vh] overflow-y-auto">
                                <DrawerHeader>
                                    <DrawerTitle>Insights da Categoria</DrawerTitle>
                                    <DrawerDescription>
                                        Análise dos seus hábitos e itens realizados.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <CategoryAnalytics
                                    items={items || []}
                                    templateSchema={category.template_schema}
                                />
                            </div>
                        </DrawerContent>
                    </Drawer>

                    <ChooseForMeButton
                        items={plannedItems}
                        templateSchema={category.template_schema}
                    />
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Insira um item
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <div className="mx-auto w-full max-w-sm">
                                <DrawerHeader>
                                    <DrawerTitle>Insira um novo item</DrawerTitle>
                                    <DrawerDescription>
                                        Preencha os detalhes do novo item.
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

            {/* Item List */}
            <ItemList
                items={items || []}
                templateSchema={category.template_schema}
            />

            {/* Floating Action Button (Mobile Only) */}
            <div className="md:hidden">
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button
                            size="lg"
                            className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
                        >
                            <Plus className="h-6 w-6" />
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <div className="mx-auto w-full max-w-sm">
                            <DrawerHeader>
                                <DrawerTitle>Insira um novo item</DrawerTitle>
                                <DrawerDescription>
                                    Preencha os detalhes do novo item.
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
    )
}
