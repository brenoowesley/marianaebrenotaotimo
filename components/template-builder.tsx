'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export type FieldType = 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select'

export interface TemplateField {
    id: string
    name: string
    type: FieldType
    icon?: string  // Custom emoji/icon for this field
    options?: string[]  // Options for select type fields
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

    const updateField = (id: string, key: keyof TemplateField, value: any) => {
        onChange(
            fields.map((field) =>
                field.id === id ? { ...field, [key]: value } : field
            )
        )
    }

    const addOption = (fieldId: string) => {
        onChange(
            fields.map(f =>
                f.id === fieldId
                    ? { ...f, options: [...(f.options || []), ''] }
                    : f
            )
        )
    }

    const updateOption = (fieldId: string, idx: number, value: string) => {
        onChange(
            fields.map(f =>
                f.id === fieldId
                    ? {
                        ...f,
                        options: f.options?.map((opt, i) => i === idx ? value : opt)
                    }
                    : f
            )
        )
    }

    const removeOption = (fieldId: string, idx: number) => {
        onChange(
            fields.map(f =>
                f.id === fieldId
                    ? {
                        ...f,
                        options: f.options?.filter((_, i) => i !== idx)
                    }
                    : f
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
            <div className="space-y-3">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <div className="flex items-end gap-2">
                            <div className="w-[60px] space-y-1">
                                <Label className="text-xs text-muted-foreground">Icon</Label>
                                <Input
                                    value={field.icon || ''}
                                    onChange={(e) => updateField(field.id, 'icon', e.target.value)}
                                    placeholder="📝"
                                    maxLength={2}
                                    className="text-center text-lg"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Field Name</Label>
                                <Input
                                    value={field.name}
                                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                    placeholder="e.g. Address, Price"
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
                                        <SelectItem value="select">Select List</SelectItem>
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

                        {/* Options management for select type */}
                        {field.type === 'select' && (
                            <div className="ml-[76px] p-3 border rounded-md bg-muted/30 space-y-2">
                                <Label className="text-xs font-semibold">Options</Label>
                                {(field.options || []).map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Input
                                            value={option}
                                            onChange={(e) => updateOption(field.id, idx, e.target.value)}
                                            placeholder="Option value"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeOption(field.id, idx)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(field.id)}
                                    className="w-full"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Option
                                </Button>
                            </div>
                        )}
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
