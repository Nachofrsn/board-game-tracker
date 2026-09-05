// Service Worker for Mesa Mayor PWA
const CACHE_NAME = 'mesa-mayor-v1'

const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching warning:', err)
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
          })
        )
      }),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API routes and Auth routes - always network
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Static assets: Cache First, then Network
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        })
      })
    )
    return
  }

  // HTML Navigation requests: Network First, fallback to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return networkResponse
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse
            return caches.match('/')
          })
        })
    )
    return
  }

  // Default: Network with Cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
