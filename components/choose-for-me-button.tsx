'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { ChooseForMeModal } from '@/components/choose-for-me-modal'

interface Item {
    id: string
    title: string
    status: string
    properties_value: Record<string, any>
    notes: string
}

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating'
}

interface ChooseForMeButtonProps {
    items: Item[]
    templateSchema: TemplateField[]
}

export function ChooseForMeButton({ items, templateSchema }: ChooseForMeButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)} disabled={items.length === 0}>
                <Sparkles className="mr-2 h-4 w-4" />
                Choose for Me
            </Button>
            <ChooseForMeModal
                items={items}
                templateSchema={templateSchema}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    )
}
