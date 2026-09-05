import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mesa Mayor — Tracker de juegos de mesa',
    short_name: 'Mesa Mayor',
    description: 'Lleva la cuenta de tus partidas, victorias y winrate por grupo. Un tablero para dominarlos a todos.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#fdfbf7',
    theme_color: '#23533e',
    lang: 'es',
    categories: ['games', 'entertainment', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
