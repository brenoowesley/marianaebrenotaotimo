'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { EditCategoryDialog } from '@/components/edit-category-dialog'
import { DeleteCategoryDialog } from '@/components/delete-category-dialog'

interface Category {
    id: string
    title: string
    icon: string
    cover_image_url: string | null
    template_schema: any[]
}

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('categories')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                setCategories(data)
            }
            setLoading(false)
        }

        fetchCategories()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('categories_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'categories',
                },
                () => {
                    fetchCategories()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (loading) {
        return (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
                ))}
            </div>
        )
    }

    if (categories.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                No categories found. Create one to get started.
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <div key={category.id} className="relative group">
                        <Link href={`/category/${category.id}`}>
                            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 h-full overflow-hidden">
                                {category.cover_image_url && (
                                    <div className="h-32 w-full overflow-hidden">
                                        <img
                                            src={category.cover_image_url}
                                            alt={category.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-3xl leading-none">{category.icon}</span>
                                            <CardTitle className="text-base font-semibold leading-tight">
                                                {category.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(category.template_schema) && category.template_schema.map((field: any) => (
                                            <Badge
                                                key={field.id}
                                                variant="secondary"
                                                className="text-xs font-normal px-2 py-0.5"
                                            >
                                                {field.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                        e.preventDefault()
                                        setEditingCategory(category)
                                    }}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Category
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setDeletingCategory(category)
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Category
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            {editingCategory && (
                <EditCategoryDialog
                    category={editingCategory}
                    open={!!editingCategory}
                    onOpenChange={(open) => !open && setEditingCategory(null)}
                />
            )}

            {deletingCategory && (
                <DeleteCategoryDialog
                    category={deletingCategory}
                    open={!!deletingCategory}
                    onOpenChange={(open) => !open && setDeletingCategory(null)}
                />
            )}
        </>
    )
}
