const DB_NAME = 'rankvault_db';
const DB_VERSION = 1;
const STORE = 'kv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // fall through — caller may keep localStorage mirror
  }
}

/** migrate old localStorage vault into idb once */
export async function migrateFromLocalStorage() {
  try {
    const existing = await idbGet('rb_vault');
    if (existing) return;
    const raw = localStorage.getItem('rb_vault');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    await idbSet('rb_vault', parsed);
    const folders = localStorage.getItem('rb_folders');
    if (folders) await idbSet('rb_folders', JSON.parse(folders));
    const cols = localStorage.getItem('rb_cols');
    if (cols) await idbSet('rb_cols', JSON.parse(cols));
    const activity = localStorage.getItem('rb_activity');
    if (activity) await idbSet('rb_activity', JSON.parse(activity));
  } catch {
    // ignore migration errors
  }
}
