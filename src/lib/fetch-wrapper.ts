// Fetch Wrapper - intercepts all API calls and adds offline support
// This replaces the global fetch without modifying any component code
import { offlineDb } from './offline-db'
import { syncManager } from './sync-manager'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache validity

function isApiUrl(url: string): boolean {
  return url.includes('/api/')
}

function getCacheKey(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

function getEmptyResponse(url: string): Response {
  console.log('[Offline] Returning empty response for:', url)

  if (url.includes('/api/schools')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/students')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/teachers')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/classes')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/subjects')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/grades')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/payments')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/school-years')) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  if (url.includes('/api/dashboard/stats')) {
    return new Response(JSON.stringify({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalPayments: 0, paymentCount: 0, totalSubjects: 0, recentEnrollments: [], paymentStats: [], maleCount: 0, femaleCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' } })
  }

  return new Response(JSON.stringify({ error: 'Hors ligne', queued: false }), { status: 503, headers: { 'Content-Type': 'application/json' } })
}

async function getCachedResponse(url: string): Promise<Response> {
  const cacheKey = getCacheKey(url)
  const cached = await offlineDb.getCached(cacheKey)

  if (cached) {
    const age = Date.now() - cached.timestamp
    if (age < CACHE_TTL) {
      console.log('[Offline] ✅ Cache hit:', cacheKey, `(${Math.round(age / 1000)}s old)`)
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Offline-Cache': 'true' },
      })
    } else {
      console.log('[Offline] ⚠️ Cache expired:', cacheKey)
    }
  } else {
    console.log('[Offline] ❌ Cache miss:', cacheKey)
  }

  return getEmptyResponse(url)
}

async function queueMutation(url: string, method: string, body: string | null, headers: Record<string, string> = {}): Promise<void> {
  await syncManager.queueMutation(url, method, body, headers)
}

// Install the enhanced fetch - called only on client side
export function installOfflineFetch(): void {
  if (typeof window === 'undefined') return

  // Store original fetch
  const originalFetch = window.fetch.bind(window)

  // The enhanced fetch function
  async function offlineFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = (init?.method || 'GET').toUpperCase()
    const isOnline = navigator.onLine

    // For non-API requests, pass through
    if (!isApiUrl(url)) {
      return originalFetch(input, init)
    }

    // --- GET requests: try network, fallback to cache ---
    if (method === 'GET') {
      if (isOnline) {
        try {
          const response = await originalFetch(input, init)
          if (response.ok) {
            const clone = response.clone()
            const data = await clone.json()
            await offlineDb.setCache(getCacheKey(url), data)
          }
          return response
        } catch (error) {
          console.warn('[Offline] Network error for GET, trying cache:', url)
          return getCachedResponse(url)
        }
      } else {
        return getCachedResponse(url)
      }
    }

    // --- Mutation requests (POST, PUT, DELETE): try network, queue if offline ---
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      if (isOnline) {
        try {
          const response = await originalFetch(input, init)
          if (response.ok) {
            const cacheKey = getCacheKey(url)
            const listKey = cacheKey.split('/').slice(0, -1).join('/') || cacheKey
            await offlineDb.deleteCache(listKey)
            await offlineDb.deleteCache(cacheKey)
          }
          return response
        } catch (error) {
          console.warn('[Offline] Network error for mutation, queueing:', method, url)
          await queueMutation(url, method, init?.body ? init.body.toString() : null, init?.headers as Record<string, string>)
          return new Response(JSON.stringify({ queued: true, message: 'Action enregistrée. Synchronisation en cours...' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } else {
        await queueMutation(url, method, init?.body ? init.body.toString() : null, init?.headers as Record<string, string>)
        return new Response(JSON.stringify({ queued: true, message: 'Action enregistrée hors-ligne. Elle sera synchronisée automatiquement.' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return originalFetch(input, init)
  }

  // Replace global fetch
  window.fetch = offlineFetch
  console.log('[Offline] ✅ Enhanced fetch installed')

  // Setup online/offline listeners
  const goOnline = async () => {
    console.log('[Offline] 🟢 Network online')
    await syncManager.updateStatus(true)
  }
  const goOffline = async () => {
    console.log('[Offline] 🔴 Network offline')
    await syncManager.updateStatus(false)
  }

  window.addEventListener('online', goOnline)
  window.addEventListener('offline', goOffline)

  // Start auto-sync every 30 seconds
  syncManager.startAutoSync(30000)

  // Initial status
  syncManager.updateStatus(navigator.onLine)

  // Preload cache
  preloadCache(originalFetch)
}

async function preloadCache(originalFetch: typeof fetch): Promise<void> {
  if (!navigator.onLine) return

  console.log('[Offline] Preloading cache...')
  const endpoints = ['/api/schools']

  for (const endpoint of endpoints) {
    try {
      const response = await originalFetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        await offlineDb.setCache(endpoint, data)
        console.log(`[Offline] Preloaded: ${endpoint}`)
      }
    } catch {
      // Silently fail
    }
  }
}
