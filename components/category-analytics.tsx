'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Star } from 'lucide-react'

interface Item {
    id: string
    title: string
    status: string
    properties_value: Record<string, any>
    rating: number | null
}

interface TemplateField {
    id: string
    name: string
    type: 'text' | 'checkbox' | 'date' | 'link' | 'rating' | 'select' | 'tags'
    icon?: string
    options?: string[]
}

interface CategoryAnalyticsProps {
    items: Item[]
    templateSchema: TemplateField[]
}

export function CategoryAnalytics({ items, templateSchema }: CategoryAnalyticsProps) {
    // Filter only realized items
    const realizedItems = items.filter(item => item.status === 'Realized')

    // Calculate total count
    const totalCount = realizedItems.length

    // Calculate average rating based on schema
    const ratingField = templateSchema.find(field => field.type === 'rating')
    let averageRating = 0
    let ratedItemCount = 0

    if (ratingField) {
        realizedItems.forEach(item => {
            const ratingValue = item.properties_value[ratingField.id]
            if (typeof ratingValue === 'number' && ratingValue > 0) {
                averageRating += ratingValue
                ratedItemCount++
            }
        })

        if (ratedItemCount > 0) {
            averageRating = averageRating / ratedItemCount
        }
    }

    // Calculate select field distributions
    const selectFieldStats = templateSchema
        .filter(field => field.type === 'select' && field.options && field.options.length > 0)
        .map(field => {
            const optionCounts: Record<string, number> = {}

            // Initialize counts
            field.options?.forEach(option => {
                optionCounts[option] = 0
            })

            // Count occurrences
            realizedItems.forEach(item => {
                const value = item.properties_value[field.id]
                if (value && optionCounts.hasOwnProperty(value)) {
                    optionCounts[value]++
                }
            })

            // Calculate percentages
            const total = Object.values(optionCounts).reduce((sum, count) => sum + count, 0)
            const distribution = Object.entries(optionCounts).map(([option, count]) => ({
                option,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))

            return {
                fieldName: field.name,
                icon: field.icon,
                distribution: distribution.sort((a, b) => b.count - a.count) // Sort by count desc
            }
        })

    // Calculate tag field frequencies
    const tagFieldStats = templateSchema
        .filter(field => field.type === 'tags')
        .map(field => {
            const tagCounts: Record<string, number> = {}

            // Count occurrences
            realizedItems.forEach(item => {
                const tags = item.properties_value[field.id]
                if (Array.isArray(tags)) {
                    tags.forEach((tag: string) => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1
                    })
                }
            })

            // Calculate percentages (relative to total realized items)
            const distribution = Object.entries(tagCounts).map(([tag, count]) => ({
                tag,
                count,
                percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
            }))

            return {
                fieldName: field.name,
                icon: field.icon,
                distribution: distribution.sort((a, b) => b.count - a.count) // Sort by count desc
            }
        })

    if (totalCount === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">
                    Nenhum item realizado ainda. Complete alguns itens para ver as estatísticas!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                {/* Total Count */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Realizados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{totalCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalCount === 1 ? 'item' : 'itens'} completo{totalCount === 1 ? '' : 's'}
                        </p>
                    </CardContent>
                </Card>

                {/* Average Rating */}
                {ratingField && ratedItemCount > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avaliação Média
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-3xl font-bold text-primary">
                                    {averageRating.toFixed(1)}
                                </div>
                                <div className="text-muted-foreground">/5.0</div>
                            </div>
                            <div className="flex items-center gap-0.5 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < Math.round(averageRating)
                                            ? 'fill-yellow-500 text-yellow-500'
                                            : 'fill-muted text-muted'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Baseado em {ratedItemCount} {ratedItemCount === 1 ? 'avaliação' : 'avaliações'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Select Field Distributions */}
            {selectFieldStats.length > 0 && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Distribuição (Seleção)</h3>

                    {selectFieldStats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    {stat.icon && <span>{stat.icon}</span>}
                                    {stat.fieldName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stat.distribution.map((item) => (
                                    <div key={item.option} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{item.option}</span>
                                            <span className="text-muted-foreground">
                                                {item.count} ({item.percentage}%)
                                            </span>
                                        </div>
                                        <Progress value={item.percentage} className="h-2" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Tag Field Frequencies */}
            {tagFieldStats.length > 0 && (
                <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Frequência (Tags)</h3>

                    {tagFieldStats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    {stat.icon && <span>{stat.icon}</span>}
                                    {stat.fieldName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stat.distribution.length > 0 ? (
                                    stat.distribution.map((item) => (
                                        <div key={item.tag} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{item.tag}</span>
                                                <span className="text-muted-foreground">
                                                    {item.count} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <Progress value={item.percentage} className="h-2" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Nenhuma tag utilizada ainda.</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* No Data Message */}
            {selectFieldStats.length === 0 && tagFieldStats.length === 0 && (
                <Card>
                    <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        Adicione campos do tipo "Seleção" ou "Tags" ao template para ver distribuições detalhadas.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
