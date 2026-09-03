import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Nunito_Sans } from 'next/font/google'
import { StoreProvider } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700', '900'],
})

const nunito = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Mesa Mayor — Tracker de juegos de mesa',
  description:
    'Lleva la cuenta de tus partidas, victorias y winrate por grupo. Un tablero para dominarlos a todos.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#e6d9b8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${nunito.variable} bg-background`}>
      <body className="font-sans antialiased">
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
