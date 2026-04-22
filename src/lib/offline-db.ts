// IndexedDB offline database for EduGest
// Stores all data locally for offline access

const DB_NAME = 'edugest-offline'
const DB_VERSION = 2

export interface OfflineRecord {
  key: string // e.g. "schools", "students?schoolId=xxx", "students/id"
  data: any
  timestamp: number
}

export interface SyncQueueItem {
  id: string
  url: string
  method: string
  body: string | null
  headers: Record<string, string>
  timestamp: number
  retries: number
}

class OfflineDB {
  private db: IDBDatabase | null = null

  private async open(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Cache store - stores API responses
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }

        // Sync queue - stores pending mutations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp')
        }

        // App state - stores general app state
        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState', { keyPath: 'key' })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve(this.db)
      }

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error)
      }
    })
  }

  // --- Cache operations ---

  async getCached(key: string): Promise<OfflineRecord | null> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readonly')
      const store = tx.objectStore('cache')
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async setCache(key: string, data: any): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')
      const record: OfflineRecord = { key, data, timestamp: Date.now() }
      store.put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async deleteCache(key: string): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')
      store.delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async clearCache(): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite')
      const store = tx.objectStore('cache')
      store.clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // --- Sync queue operations ---

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite')
      const store = tx.objectStore('syncQueue')
      const queueItem: SyncQueueItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retries: 0,
      }
      store.add(queueItem)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readonly')
      const store = tx.objectStore('syncQueue')
      const index = store.index('timestamp')
      const request = index.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite')
      const store = tx.objectStore('syncQueue')
      store.delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite')
      const store = tx.objectStore('syncQueue')
      store.clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // --- App state operations ---

  async getAppState(key: string): Promise<any> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appState', 'readonly')
      const store = tx.objectStore('appState')
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => reject(request.error)
    })
  }

  async setAppState(key: string, data: any): Promise<void> {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appState', 'readwrite')
      const store = tx.objectStore('appState')
      store.put({ key, data })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }
}

// Singleton
export const offlineDb = new OfflineDB()
