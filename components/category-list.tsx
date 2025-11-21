'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import { EditCategoryDialog } from '@/components/edit-category-dialog'
import { DeleteCategoryDialog } from '@/components/delete-category-dialog'

interface Category {
    id: string
    title: string
    icon: string
    cover_image_url: string | null
    cover_position: number | null
    template_schema: any[]
}

export function CategoryList({ categories = [], stats }: { categories: Category[], stats?: Record<string, number> }) {
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

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
                                            style={{ objectPosition: `center ${category.cover_position || 50}%` }}
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-3xl leading-none">{category.icon}</span>
                                            <div className="space-y-1">
                                                <CardTitle className="text-base font-semibold leading-tight">
                                                    {category.title}
                                                </CardTitle>
                                                {stats && stats[category.id] !== undefined && (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        <span>{stats[category.id].toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
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
