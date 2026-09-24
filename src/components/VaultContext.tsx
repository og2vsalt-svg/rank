import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { idbGet, idbSet, migrateFromLocalStorage } from '../lib/localDb';
import { publishShare, type CloudMeta } from '../lib/cloudShare';

export type VaultFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folder: string;
  createdAt: string;
  public: boolean;
  starred?: boolean;
  pinned?: boolean;
  note: string;
  tags: string[];
  expiresAt?: string | null;
  color?: string;
  lockPass?: string;
  collection?: string;
  downloads?: number;
};

export type VaultEvent = { id: string; at: string; text: string };

type AddResult = { ok: boolean; ids?: string[]; error?: string; warn?: string };

interface VaultContextType {
  files: VaultFile[];
  trash: VaultFile[];
  folders: string[];
  tags: string[];
  collections: string[];
  usedBytes: number;
  activity: VaultEvent[];
  addFiles: (list: FileList | File[], folder?: string) => Promise<AddResult>;
  addText: (name: string, body: string, folder?: string) => Promise<AddResult>;
  removeFile: (id: string) => void;
  restoreFile: (id: string) => void;
  purgeFile: (id: string) => void;
  emptyTrash: () => void;
  togglePublic: (id: string) => Promise<{ ok: boolean; error?: string; warn?: string }>;
  toggleStar: (id: string) => void;
  togglePin: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  moveFile: (id: string, folder: string) => void;
  moveMany: (ids: string[], folder: string) => void;
  trashMany: (ids: string[]) => void;
  addFolder: (name: string) => void;
  renameFolder: (from: string, to: string) => void;
  setNote: (id: string, note: string) => void;
  setTags: (id: string, tags: string[]) => void;
  setExpiry: (id: string, expiresAt: string | null) => void;
  setColor: (id: string, color: string) => void;
  setLock: (id: string, lockPass: string) => void;
  duplicateFile: (id: string) => void;
  bumpDownload: (id: string) => void;
  exportVault: () => string;
  importVault: (raw: string) => { ok: boolean; error?: string };
  getPublicFile: (id: string) => (VaultFile & { isLocal?: boolean }) | undefined;
  addCollection: (name: string) => void;
  setCollection: (id: string, collection: string) => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be inside VaultProvider');
  return ctx;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

const DEFAULT_FOLDERS = ['inbox', 'drops', 'notes'];

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const scope = user?.id || 'guest';
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [trash, setTrash] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [collections, setCollections] = useState<string[]>(['unsorted']);
  const [activity, setActivity] = useState<VaultEvent[]>([]);
  const [ready, setReady] = useState(false);

  const key = (k: string) => `rb_${scope}_${k}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await migrateFromLocalStorage();
      const packed = (await idbGet<{ files: VaultFile[]; trash: VaultFile[]; folders: string[]; collections: string[]; activity: VaultEvent[] }>(key('vault'))) || undefined;
      if (cancelled) return;
      if (packed) {
        setFiles(packed.files || []);
        setTrash(packed.trash || []);
        setFolders(packed.folders?.length ? packed.folders : DEFAULT_FOLDERS);
        setCollections(packed.collections?.length ? packed.collections : ['unsorted']);
        setActivity(packed.activity || []);
      } else {
        setFiles([]);
        setTrash([]);
        setFolders(DEFAULT_FOLDERS);
        setCollections(['unsorted']);
        setActivity([]);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    if (!ready) return;
    void idbSet(key('vault'), { files, trash, folders, collections, activity });
  }, [files, trash, folders, collections, activity, ready, scope]);

  const log = useCallback((text: string) => {
    setActivity((prev) => [{ id: uid(), at: new Date().toISOString(), text }, ...prev].slice(0, 80));
  }, []);

  const usedBytes = useMemo(() => files.reduce((n, f) => n + (f.size || 0), 0), [files]);
  const tags = useMemo(() => {
    const s = new Set<string>();
    files.forEach((f) => (f.tags || []).forEach((t) => s.add(t)));
    return [...s];
  }, [files]);

  const addFiles = useCallback(async (list: FileList | File[], folder = 'inbox'): Promise<AddResult> => {
    const arr = Array.from(list || []);
    if (!arr.length) return { ok: false, error: 'no files' };
    const ids: string[] = [];
    const created: VaultFile[] = [];
    let warn: string | undefined;
    try {
      for (const file of arr) {
        if (file.size > 40 * 1024 * 1024) warn = 'chunky drop. encoding may feel slow. no hard cap.';
        const url = await readFileAsDataUrl(file);
        const id = uid();
        ids.push(id);
        created.push({
          id,
          name: file.name || 'untitled',
          type: file.type || 'application/octet-stream',
          size: file.size,
          url,
          folder: folder || 'inbox',
          createdAt: new Date().toISOString(),
          public: false,
          note: '',
          tags: [],
          collection: 'unsorted',
          downloads: 0,
        });
      }
      setFiles((prev) => [...created, ...prev]);
      log(`added ${created.length} file${created.length === 1 ? '' : 's'}`);
      return { ok: true, ids, warn };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'could not read file' };
    }
  }, [log]);

  const addText = useCallback(async (name: string, body: string, folder = 'notes'): Promise<AddResult> => {
    const n = (name || 'note.txt').trim();
    const file = new File([body || ''], n.endsWith('.txt') ? n : n + '.txt', { type: 'text/plain' });
    return addFiles([file], folder);
  }, [addFiles]);

  const patch = useCallback((id: string, fn: (f: VaultFile) => VaultFile) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? fn(f) : f)));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const hit = prev.find((f) => f.id === id);
      if (hit) setTrash((t) => [hit, ...t]);
      return prev.filter((f) => f.id !== id);
    });
    log('moved to trash');
  }, [log]);

  const restoreFile = useCallback((id: string) => {
    setTrash((prev) => {
      const hit = prev.find((f) => f.id === id);
      if (hit) setFiles((f) => [hit, ...f]);
      return prev.filter((f) => f.id !== id);
    });
    log('restored');
  }, [log]);

  const purgeFile = useCallback((id: string) => {
    setTrash((prev) => prev.filter((f) => f.id !== id));
    log('purged');
  }, [log]);

  const emptyTrash = useCallback(() => {
    setTrash([]);
    log('emptied trash');
  }, [log]);

  const togglePublic = useCallback(async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return { ok: false, error: 'file not found' };
    if (file.public) {
      patch(id, (f) => ({ ...f, public: false }));
      log('made private');
      return { ok: true };
    }
    const res = await publishShare({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: file.url,
      lockPass: file.lockPass,
      expiresAt: file.expiresAt,
      author: user?.username,
    });
    if (!res.ok) return { ok: false, error: res.error || 'publish failed', warn: res.warn };
    patch(id, (f) => ({ ...f, public: true }));
    log('published to cloud');
    return { ok: true, warn: res.warn };
  }, [files, patch, log, user?.username]);

  const toggleStar = useCallback((id: string) => patch(id, (f) => ({ ...f, starred: !f.starred })), [patch]);
  const togglePin = useCallback((id: string) => patch(id, (f) => ({ ...f, pinned: !f.pinned })), [patch]);
  const renameFile = useCallback((id: string, name: string) => patch(id, (f) => ({ ...f, name })), [patch]);
  const moveFile = useCallback((id: string, folder: string) => patch(id, (f) => ({ ...f, folder })), [patch]);
  const moveMany = useCallback((ids: string[], folder: string) => {
    setFiles((prev) => prev.map((f) => (ids.includes(f.id) ? { ...f, folder } : f)));
  }, []);
  const trashMany = useCallback((ids: string[]) => {
    setFiles((prev) => {
      const moving = prev.filter((f) => ids.includes(f.id));
      if (moving.length) setTrash((t) => [...moving, ...t]);
      return prev.filter((f) => !ids.includes(f.id));
    });
  }, []);
  const addFolder = useCallback((name: string) => {
    const n = name.trim().toLowerCase() || 'folder';
    setFolders((prev) => (prev.includes(n) ? prev : [...prev, n]));
  }, []);
  const renameFolder = useCallback((from: string, to: string) => {
    const n = to.trim().toLowerCase();
    if (!n) return;
    setFolders((prev) => prev.map((f) => (f === from ? n : f)));
    setFiles((prev) => prev.map((f) => (f.folder === from ? { ...f, folder: n } : f)));
  }, []);
  const setNote = useCallback((id: string, note: string) => patch(id, (f) => ({ ...f, note })), [patch]);
  const setTags = useCallback((id: string, next: string[]) => patch(id, (f) => ({ ...f, tags: next })), [patch]);
  const setExpiry = useCallback((id: string, expiresAt: string | null) => patch(id, (f) => ({ ...f, expiresAt })), [patch]);
  const setColor = useCallback((id: string, color: string) => patch(id, (f) => ({ ...f, color })), [patch]);
  const setLock = useCallback((id: string, lockPass: string) => patch(id, (f) => ({ ...f, lockPass })), [patch]);
  const duplicateFile = useCallback((id: string) => {
    setFiles((prev) => {
      const hit = prev.find((f) => f.id === id);
      if (!hit) return prev;
      return [{ ...hit, id: uid(), name: hit.name.replace(/(\.[^.]+)?$/, ' copy$1'), createdAt: new Date().toISOString(), public: false }, ...prev];
    });
  }, []);
  const bumpDownload = useCallback((id: string) => patch(id, (f) => ({ ...f, downloads: (f.downloads || 0) + 1 })), [patch]);
  const exportVault = useCallback(() => JSON.stringify({ files, trash, folders, collections, activity }), [files, trash, folders, collections, activity]);
  const importVault = useCallback((raw: string) => {
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data.files)) return { ok: false, error: 'bad vault dump' };
      setFiles(data.files);
      setTrash(data.trash || []);
      setFolders(data.folders || DEFAULT_FOLDERS);
      setCollections(data.collections || ['unsorted']);
      setActivity(data.activity || []);
      return { ok: true };
    } catch {
      return { ok: false, error: 'could not parse dump' };
    }
  }, []);
  const getPublicFile = useCallback((id: string) => {
    const hit = files.find((f) => f.id === id && f.public);
    return hit ? { ...hit, isLocal: true } : undefined;
  }, [files]);
  const addCollection = useCallback((name: string) => {
    const n = name.trim().toLowerCase() || 'collection';
    setCollections((prev) => (prev.includes(n) ? prev : [...prev, n]));
  }, []);
  const setCollection = useCallback((id: string, collection: string) => patch(id, (f) => ({ ...f, collection })), [patch]);

  const value: VaultContextType = {
    files, trash, folders, tags, collections, usedBytes, activity,
    addFiles, addText, removeFile, restoreFile, purgeFile, emptyTrash,
    togglePublic, toggleStar, togglePin, renameFile, moveFile, moveMany, trashMany,
    addFolder, renameFolder, setNote, setTags, setExpiry, setColor, setLock,
    duplicateFile, bumpDownload, exportVault, importVault, getPublicFile,
    addCollection, setCollection,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export type { CloudMeta };
