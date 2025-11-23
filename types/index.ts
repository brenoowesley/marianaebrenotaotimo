// Common types used across the application

export interface CategoryStats {
    totalCount: number
    averageRating: number
    ratedItemCount: number
}

export interface ItemPropertiesValue {
    [key: string]: string | string[] | number | boolean | null
}

export interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags' | 'address'
    icon?: string
    options?: string[]
}

export interface Item {
    id: string
    title: string
    status: 'Planned' | 'Realized'
    properties_value: ItemPropertiesValue
    notes: string | null
    item_photo_url: string | null
    rating: number | null
    order_index: number | null
    realized_at?: string | null
    created_at?: string
}

export interface Category {
    id: string
    user_id: string
    title: string
    icon: string
    cover_image_url: string | null
    cover_position?: number
    template_schema: TemplateField[]
    created_at: string
}
