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
    maximumScale: 5,      // Allow zoom up to 5x for accessibility
    userScalable: true,    // Enable pinch-zoom
    themeColor: '#000000', // Match manifest theme-color for iOS status bar
    // Note: Input auto-zoom is prevented via CSS (font-size: 16px on inputs)
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
            <body className={`${inter.className} ${caveat.variable} h-[100dvh] overflow-hidden`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div className="h-full flex flex-col">
                        {isAuthenticated && <Header />}
                        <main className={`flex-1 overflow-y-auto over-scroll-behavior-y-contain ${isAuthenticated ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
                            {children}
                        </main>
                        {isAuthenticated && <BottomNav />}
                    </div>
                </ThemeProvider>
            </body>
        </html>
    )
}
