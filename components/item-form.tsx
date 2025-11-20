'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DrawerClose, DrawerFooter } from '@/components/ui/drawer'

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating'
}

interface ItemFormProps {
    categoryId: string
    templateSchema: TemplateField[]
    onSuccess?: () => void
}

export function ItemForm({ categoryId, templateSchema, onSuccess }: ItemFormProps) {
    const [title, setTitle] = useState('')
    const [properties, setProperties] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handlePropertyChange = (fieldId: string, value: any) => {
        setProperties((prev) => ({ ...prev, [fieldId]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
            })

            if (error) throw error

            setTitle('')
            setProperties({})
            router.refresh()
            onSuccess?.()
        } catch (error) {
            console.error('Error creating item:', error)
            alert('Failed to create item')
        } finally {
            setLoading(false)
        }
    }

    const renderFieldInput = (field: TemplateField) => {
        switch (field.type) {
            case 'text':
            case 'link':
                return (
                    <Input
                        value={properties[field.id] || ''}
                        onChange={(e) => handlePropertyChange(field.id, e.target.value)}
                        placeholder={field.type === 'link' ? 'https://...' : ''}
                    />
                )
            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={field.id}
                            checked={properties[field.id] || false}
                            onCheckedChange={(checked) => handlePropertyChange(field.id, checked)}
                        />
                        <Label htmlFor={field.id} className="font-normal text-muted-foreground">
                            {field.name}
                        </Label>
                    </div>
                )
            case 'date':
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !properties[field.id] && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {properties[field.id] ? format(properties[field.id], "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={properties[field.id]}
                                onSelect={(date) => handlePropertyChange(field.id, date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                )
            case 'rating':
                return (
                    <Select
                        value={properties[field.id]?.toString()}
                        onValueChange={(value) => handlePropertyChange(field.id, parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <SelectItem key={rating} value={rating.toString()}>
                                    {rating} Star{rating > 1 ? 's' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            default:
                return null
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Item Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter item title"
                        required
                    />
                </div>

                {templateSchema.map((field) => (
                    <div key={field.id} className="space-y-2">
                        {field.type !== 'checkbox' && <Label>{field.name}</Label>}
                        {renderFieldInput(field)}
                    </div>
                ))}
            </div>

            <DrawerFooter className="px-0">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Item'}
                </Button>
                <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DrawerClose>
            </DrawerFooter>
        </form>
    )
}
