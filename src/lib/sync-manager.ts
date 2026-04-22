// Sync Manager - handles offline/online synchronization
import { offlineDb, type SyncQueueItem } from './offline-db'

type SyncStatus = 'online' | 'offline' | 'syncing'

class SyncManager {
  private status: SyncStatus = 'online'
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private isSyncing = false
  private maxRetries = 5

  getStatus(): SyncStatus {
    return this.status
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.status))
  }

  async updateStatus(online: boolean): Promise<void> {
    const previousStatus = this.status

    if (online && previousStatus === 'offline') {
      this.status = 'syncing'
      this.notifyListeners()
      console.log('[Sync] Back online, syncing pending changes...')
      await this.syncAll()
      this.status = 'online'
      this.notifyListeners()
    } else if (online && previousStatus === 'syncing') {
      // Already syncing, don't change
    } else if (!online) {
      this.status = 'offline'
      this.notifyListeners()
      console.log('[Sync] Went offline')
    }
  }

  async queueMutation(url: string, method: string, body: string | null, headers: Record<string, string>): Promise<void> {
    await offlineDb.addToSyncQueue({ url, method, body, headers })
    console.log(`[Sync] Queued ${method} ${url}`)
  }

  async syncAll(): Promise<void> {
    if (this.isSyncing) return
    this.isSyncing = true

    try {
      const queue = await offlineDb.getSyncQueue()

      if (queue.length === 0) {
        console.log('[Sync] Nothing to sync')
        this.isSyncing = false
        return
      }

      console.log(`[Sync] Processing ${queue.length} queued items...`)

      for (const item of queue) {
        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
              ...item.headers,
            },
            body: item.body,
          })

          if (response.ok) {
            // Success - remove from queue and update cache
            await offlineDb.removeSyncQueueItem(item.id)

            // Invalidate related cache entries
            const cacheKey = this.getCacheKeyFromUrl(item.url)
            if (cacheKey) {
              // For mutations that affect lists, clear broader cache
              const listKey = cacheKey.split('/').slice(0, -1).join('/') || cacheKey
              await offlineDb.deleteCache(listKey)
            }

            console.log(`[Sync] ✅ Synced ${item.method} ${item.url}`)
          } else {
            // Server error - increment retries
            item.retries++
            if (item.retries >= this.maxRetries) {
              console.warn(`[Sync] ❌ Max retries reached for ${item.url}, removing from queue`)
              await offlineDb.removeSyncQueueItem(item.id)
            }
          }
        } catch (error) {
          console.warn(`[Sync] Failed to sync ${item.url}:`, error)
          // Network error - stop trying, we're probably offline again
          break
        }
      }
    } finally {
      this.isSyncing = false
    }
  }

  private getCacheKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url, window.location.origin)
      return parsed.pathname + parsed.search
    } catch {
      return url
    }
  }

  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) return
    this.syncInterval = setInterval(async () => {
      if (this.status === 'online' || this.status === 'syncing') {
        const queue = await offlineDb.getSyncQueue()
        if (queue.length > 0) {
          await this.syncAll()
        }
      }
    }, intervalMs)
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = await offlineDb.getSyncQueue()
    return queue.length
  }
}

// Singleton
export const syncManager = new SyncManager()
