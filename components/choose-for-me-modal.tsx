'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'

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

interface ChooseForMeModalProps {
    items: Item[]
    templateSchema: TemplateField[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChooseForMeModal({ items, templateSchema, open, onOpenChange }: ChooseForMeModalProps) {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null)

    const handleChoose = () => {
        if (items.length === 0) return
        const randomIndex = Math.floor(Math.random() * items.length)
        setSelectedItem(items[randomIndex])
    }

    const handleChooseAgain = () => {
        handleChoose()
    }

    // Auto-select on open
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen && items.length > 0) {
            handleChoose()
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Your Random Pick!
                    </DialogTitle>
                    <DialogDescription>
                        Here's what you should do next from your planned items.
                    </DialogDescription>
                </DialogHeader>
                {selectedItem && (
                    <div className="py-4">
                        <div className="rounded-lg border bg-accent/50 p-4 space-y-3">
                            <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
                            <div className="space-y-1 text-sm">
                                {templateSchema.map((field) => {
                                    const value = selectedItem.properties_value[field.id]
                                    if (value === undefined || value === null || value === '') return null
                                    return (
                                        <div key={field.id} className="flex justify-between">
                                            <span className="text-muted-foreground">{field.name}:</span>
                                            <span className="font-medium">{String(value)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            {selectedItem.notes && (
                                <div className="pt-2 border-t">
                                    <p className="text-sm text-muted-foreground">Notes:</p>
                                    <p className="text-sm">{selectedItem.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleChooseAgain}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Choose Again
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>
                        Got it!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
