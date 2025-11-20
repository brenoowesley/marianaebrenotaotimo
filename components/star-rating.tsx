'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
    value: number
    onChange?: (value: number) => void
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    }

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                        sizeClasses[size],
                        star <= value && 'fill-yellow-400 text-yellow-400',
                        star > value && 'text-muted-foreground',
                        !readonly && 'cursor-pointer hover:scale-110 transition-transform',
                        readonly && 'cursor-default'
                    )}
                    onClick={() => !readonly && onChange?.(star)}
                />
            ))}
        </div>
    )
}
