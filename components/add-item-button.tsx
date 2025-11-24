'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddItemDialog } from '@/components/add-item-dialog'

interface AddItemButtonProps {
    categoryId: string
    templateSchema: any[]
    existingTags: Record<string, string[]>
    isFloating?: boolean
}

export function AddItemButton({ categoryId, templateSchema, existingTags, isFloating = false }: AddItemButtonProps) {
    const [open, setOpen] = useState(false)

    if (isFloating) {
        return (
            <>
                <Button
                    size="lg"
                    className="fixed bottom-24 right-6 z-50 shadow-lg rounded-full px-6"
                    onClick={() => setOpen(true)}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Novo Item
                </Button>
                <AddItemDialog
                    categoryId={categoryId}
                    templateSchema={templateSchema}
                    existingTags={existingTags}
                    open={open}
                    onOpenChange={setOpen}
                />
            </>
        )
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Insira um item
            </Button>
            <AddItemDialog
                categoryId={categoryId}
                templateSchema={templateSchema}
                existingTags={existingTags}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    )
}
