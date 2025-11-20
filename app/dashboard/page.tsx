import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { CategoryForm } from '@/components/category-form'
import { CategoryList } from '@/components/category-list'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Lista do que fazer - Mariana e Breno</h1>
                    <p className="text-muted-foreground">
                        O que estamos planejando?
                    </p>
                </div>
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Categoria
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <div className="mx-auto w-full max-w-sm">
                            <DrawerHeader>
                                <DrawerTitle>Criar categoria</DrawerTitle>
                                <DrawerDescription>
                                    Crie novas categorias
                                </DrawerDescription>
                            </DrawerHeader>
                            <CategoryForm />
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Categorias</h2>
                <CategoryList />
            </div>
        </div>
    )
}
