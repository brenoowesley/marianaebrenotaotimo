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

    const handleStarClick = (starIndex: number, isLeftHalf: boolean) => {
        if (readonly || !onChange) return
        const newValue = isLeftHalf ? starIndex - 0.5 : starIndex
        onChange(newValue)
    }

    const getStarFill = (starIndex: number) => {
        if (value >= starIndex) return 'full'
        if (value >= starIndex - 0.5) return 'half'
        return 'empty'
    }

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((starIndex) => {
                const fillType = getStarFill(starIndex)

                return (
                    <div
                        key={starIndex}
                        className={cn(
                            'relative',
                            !readonly && 'cursor-pointer group'
                        )}
                        onClick={(e) => {
                            if (readonly) return
                            const rect = e.currentTarget.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const isLeftHalf = x < rect.width / 2
                            handleStarClick(starIndex, isLeftHalf)
                        }}
                    >
                        {/* Background star (empty) */}
                        <Star
                            className={cn(
                                sizeClasses[size],
                                'text-muted-foreground',
                                !readonly && 'group-hover:scale-110 transition-transform'
                            )}
                        />

                        {/* Foreground star (filled/half-filled) */}
                        {fillType !== 'empty' && (
                            <Star
                                className={cn(
                                    sizeClasses[size],
                                    'absolute top-0 left-0 fill-yellow-400 text-yellow-400',
                                    !readonly && 'group-hover:scale-110 transition-transform'
                                )}
                                style={{
                                    clipPath: fillType === 'half' ? 'inset(0 50% 0 0)' : 'none'
                                }}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
