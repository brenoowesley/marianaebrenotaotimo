'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export type FieldType = 'text' | 'checkbox' | 'date' | 'link' | 'rating'

export interface TemplateField {
    id: string
    name: string
    type: FieldType
}

interface TemplateBuilderProps {
    fields: TemplateField[]
    onChange: (fields: TemplateField[]) => void
}

export function TemplateBuilder({ fields, onChange }: TemplateBuilderProps) {
    const addField = () => {
        const newField: TemplateField = {
            id: crypto.randomUUID(),
            name: '',
            type: 'text',
        }
        onChange([...fields, newField])
    }

    const removeField = (id: string) => {
        onChange(fields.filter((field) => field.id !== id))
    }

    const updateField = (id: string, key: keyof TemplateField, value: string) => {
        onChange(
            fields.map((field) =>
                field.id === id ? { ...field, [key]: value } : field
            )
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Template Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                </Button>
            </div>
            <div className="space-y-2">
                {fields.map((field) => (
                    <div key={field.id} className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Field Name</Label>
                            <Input
                                value={field.name}
                                onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                placeholder="e.g. Rating"
                            />
                        </div>
                        <div className="w-[140px] space-y-1">
                            <Label className="text-xs text-muted-foreground">Type</Label>
                            <Select
                                value={field.type}
                                onValueChange={(value) =>
                                    updateField(field.id, 'type', value as FieldType)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="link">Link</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mb-0.5 text-destructive hover:text-destructive"
                            onClick={() => removeField(field.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {fields.length === 0 && (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        No fields added. Click "Add Field" to define your template.
                    </div>
                )}
            </div>
        </div>
    )
}
