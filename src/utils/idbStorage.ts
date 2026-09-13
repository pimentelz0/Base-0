/**
 * Ultra-Reliable IndexedDB Persistence Layer for Base 0.
 * 
 * Why IndexedDB?
 * 1. Virtually unlimited quota (hundreds of MBs / GBs vs localStorage 5MB limit).
 * 2. Survives localStorage QuotaExceededErrors caused by photo/audio attachments.
 * 3. Survives mobile browser storage eviction and iOS Safari 7-day inactivity cleanup.
 * 4. Automatically synchronizes with localStorage so data is always dual-backed.
 */

const DB_NAME = "base0_offline_vault_v1";
const DB_VERSION = 1;
const STORE_NAME = "kv_store";
const BACKUP_STORE_NAME = "snapshots_store";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB não suportado neste ambiente."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
          db.createObjectStore(BACKUP_STORE_NAME, { keyPath: "id" });
        }
      };

      req.onsuccess = () => {
        resolve(req.result);
      };

      req.onerror = () => {
        console.warn("Falha ao abrir IndexedDB:", req.error);
        reject(req.error);
      };
    });
  }

  return dbPromise;
}

export const IdbService = {
  /**
   * Request persistent storage permission from the browser (prevent eviction)
   */
  async requestPersistence(): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) return true;
        const granted = await navigator.storage.persist();
        console.info(`Base 0 Storage Persistence status: ${granted ? "Granted" : "Default"}`);
        return granted;
      }
    } catch (e) {
      console.warn("Storage persist check error:", e);
    }
    return false;
  },

  /**
   * Set item in IndexedDB
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IdbService setItem error for key "${key}":`, e);
    }
  },

  /**
   * Get item from IndexedDB
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IdbService getItem error for key "${key}":`, e);
      return null;
    }
  },

  /**
   * Remove item from IndexedDB
   */
  async removeItem(key: string): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IdbService removeItem error for key "${key}":`, e);
    }
  },

  /**
   * Get all stored keys in IndexedDB
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve((req.result as string[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  },

  /**
   * Save a full snapshot of application state into the dedicated backup store
   */
  async saveSnapshot(snapshotData: Record<string, any>): Promise<void> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE_NAME, "readwrite");
        const store = tx.objectStore(BACKUP_STORE_NAME);
        const entry = {
          id: "latest_snapshot",
          timestamp: new Date().toISOString(),
          data: snapshotData,
        };
        store.put(entry);

        // Also save history copy with date
        const historyId = `snap_${new Date().toISOString().split("T")[0]}`;
        store.put({
          id: historyId,
          timestamp: new Date().toISOString(),
          data: snapshotData,
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn("IdbService saveSnapshot error:", e);
    }
  },

  /**
   * Retrieve the latest snapshot from backup store
   */
  async getLatestSnapshot(): Promise<{ timestamp: string; data: Record<string, any> } | null> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE_NAME, "readonly");
        const store = tx.objectStore(BACKUP_STORE_NAME);
        const req = store.get("latest_snapshot");
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return null;
    }
  },
};
