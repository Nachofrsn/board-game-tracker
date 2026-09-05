import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Nunito_Sans } from 'next/font/google'
import { StoreProvider } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import { PwaRegister } from '@/components/pwa-register'
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
  applicationName: 'Mesa Mayor',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mesa Mayor',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#23533e',
  width: 'device-width',
  initialScale: 1,
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
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
