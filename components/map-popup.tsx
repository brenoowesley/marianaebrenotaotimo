import { MapPin, Star } from 'lucide-react'

interface MapPopupProps {
    title: string
    coverImage: string | null
    notes?: string
    rating: number | null
}

/**
 * Mini Polaroid-style popup component for map markers
 * Displays item information in a compact, stylish card
 */
export function MapPopup({ title, coverImage, notes, rating }: MapPopupProps) {
    return (
        <div className="w-48 bg-white rounded-sm shadow-md overflow-hidden">
            {/* Image Area */}
            <div className="w-full aspect-square bg-muted p-2 pb-0">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover rounded-t-sm"
                    />
                ) : (
                    // Fallback placeholder
                    <div className="w-full h-full bg-gray-200 rounded-t-sm flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Caption Area */}
            <div className="p-3 space-y-1">
                {/* Title */}
                <h3 className="font-bold text-sm text-gray-900 truncate" title={title}>
                    {title}
                </h3>

                {/* Rating */}
                {rating !== null && rating > 0 && (
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold text-gray-700">
                            {rating.toFixed(1)}
                        </span>
                    </div>
                )}

                {/* Notes */}
                <p className="text-sm text-gray-600 font-handwriting line-clamp-4 leading-tight pt-1">
                    {notes || 'Sem observações.'}
                </p>
            </div>
        </div>
    )
}
