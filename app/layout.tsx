import './globals.css'
import type { Metadata } from 'next'
import { Inter, Caveat } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/utils/supabase/server'

const inter = Inter({ subsets: ['latin'] })
const caveat = Caveat({
    subsets: ['latin'],
    variable: '--font-handwriting',
    weight: ['400', '700']
})


export const metadata: Metadata = {
    title: 'Mariana e Breno tá ótimo',
    description: 'Lista do que fazer - Mariana e Breno',
    icons: {
        icon: '/icon.png',
        apple: '/apple-touch-icon.png',
    },
    appleWebApp: {
        capable: true,
        title: 'MB Tá Ótimo!',
        statusBarStyle: 'black-translucent',
    },
    formatDetection: {
        telephone: false,
    },
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}


export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isAuthenticated = !!user

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} ${caveat.variable}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {isAuthenticated && <Header />}
                    <main className={isAuthenticated ? 'pb-16 md:pb-0' : ''}>
                        {children}
                    </main>
                    {isAuthenticated && <BottomNav />}
                </ThemeProvider>
            </body>
        </html>
    )
}
