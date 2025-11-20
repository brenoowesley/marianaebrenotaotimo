import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function CategoryLoading() {
    return (
        <div className="container mx-auto p-4 pb-24 space-y-6">
            {/* Cover Image Skeleton */}
            <div className="-mt-4 -mx-4 mb-6">
                <Skeleton className="h-48 w-full rounded-none" />
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    {/* Back Button */}
                    <Skeleton className="h-10 w-10 rounded-md" />

                    {/* Title & Description */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />

                        {/* Mobile Choose Button */}
                        <div className="md:hidden mt-4">
                            <Skeleton className="h-10 w-40" />
                        </div>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="grid w-full grid-cols-2 gap-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>

                {/* Card Skeletons */}
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="p-5">
                            <div className="space-y-3">
                                {/* Title */}
                                <Skeleton className="h-6 w-2/3" />

                                {/* Properties */}
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
