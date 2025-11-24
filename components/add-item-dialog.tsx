'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from '@/components/star-rating'
import { MultiSelect } from '@/components/ui/multi-select'
import { LocationPicker } from '@/components/location-picker'

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags' | 'address'
    icon?: string
    options?: string[]
}

interface AddItemDialogProps {
    categoryId: string
    templateSchema: TemplateField[]
    existingTags?: Record<string, string[]>
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AddItemDialog({ categoryId, templateSchema, existingTags = {}, open, onOpenChange }: AddItemDialogProps) {
    const [title, setTitle] = useState('')
    const [properties, setProperties] = useState<Record<string, any>>({})
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('Please enter a title')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            const { error } = await supabase.from('items').insert({
                user_id: user.id,
                category_id: categoryId,
                title,
                properties_value: properties,
                status: 'Planned', // Default status
                latitude,
                longitude,
            })

            if (error) throw error

            setTitle('')
            setProperties({})
            setLatitude(null)
            setLongitude(null)
            router.refresh()
            onOpenChange(false)
        } catch (error) {
            console.error('Error creating item:', error)
            alert('Failed to create item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Insira um novo item</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do novo item.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="add-title">Título</Label>
                        <Input
                            id="add-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nome do item"
                            autoFocus
                        />
                    </div>

                    {/* Dynamic Property Fields */}
                    {templateSchema && templateSchema.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                            <Label className="text-sm font-semibold mb-3 block">Propriedades</Label>
                            <div className="space-y-3">
                                {templateSchema.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="text-xs flex items-center gap-1">
                                            {field.icon && <span>{field.icon}</span>}
                                            <span>{field.name}</span>
                                        </Label>

                                        {field.type === 'text' && (
                                            <Input
                                                value={properties[field.id] || ''}
                                                onChange={(e) => setProperties({
                                                    ...properties,
                                                    [field.id]: e.target.value
                                                })}
                                                placeholder={`Digite ${field.name}`}
                                            />
                                        )}

                                        {field.type === 'checkbox' && (
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`prop-${field.id}`}
                                                    checked={!!properties[field.id]}
                                                    onCheckedChange={(checked) => setProperties({
                                                        ...properties,
                                                        [field.id]: checked
                                                    })}
                                                />
                                                <Label htmlFor={`prop-${field.id}`} className="text-sm font-normal">
                                                    {field.name}
                                                </Label>
                                            </div>
                                        )}

                                        {field.type === 'date' && (
                                            <Input
                                                type="date"
                                                value={properties[field.id] || ''}
                                                onChange={(e) => setProperties({
                                                    ...properties,
                                                    [field.id]: e.target.value
                                                })}
                                            />
                                        )}

                                        {field.type === 'link' && (
                                            <Input
                                                type="url"
                                                value={properties[field.id] || ''}
                                                onChange={(e) => setProperties({
                                                    ...properties,
                                                    [field.id]: e.target.value
                                                })}
                                                placeholder="https://..."
                                            />
                                        )}

                                        {field.type === 'rating' && (
                                            <StarRating
                                                value={properties[field.id] || 0}
                                                onChange={(value) => setProperties({
                                                    ...properties,
                                                    [field.id]: value
                                                })}
                                                size="sm"
                                            />
                                        )}

                                        {field.type === 'select' && field.options && (
                                            <Select
                                                value={properties[field.id] || ''}
                                                onValueChange={(value) => setProperties({
                                                    ...properties,
                                                    [field.id]: value
                                                })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Selecione ${field.name}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {field.type === 'tags' && (
                                            <MultiSelect
                                                options={existingTags[field.id] || []}
                                                selected={properties[field.id] || []}
                                                onChange={(selected) => setProperties({
                                                    ...properties,
                                                    [field.id]: selected
                                                })}
                                                placeholder={`Selecione ${field.name}...`}
                                            />
                                        )}

                                        {field.type === 'address' && (
                                            <LocationPicker
                                                value={properties[field.id] || ''}
                                                onChange={(value, lat, lng) => {
                                                    setProperties({
                                                        ...properties,
                                                        [field.id]: value
                                                    })
                                                    if (lat && lng) {
                                                        setLatitude(lat)
                                                        setLongitude(lng)
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Item'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
