import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface VaultFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  createdAt: string;
  ownerId: string;
  public: boolean;
  folder: string;
  starred: boolean;
  pinned: boolean;
  downloads: number;
  note: string;
  tags: string[];
  expiresAt: string | null;
  trashed: boolean;
  color: string;
}

interface VaultContextType {
  files: VaultFile[];
  trash: VaultFile[];
  folders: string[];
  tags: string[];
  usedBytes: number;
  addFiles: (fileList: FileList | File[], folder?: string) => Promise<{ ok: boolean; error?: string; warn?: string }>;
  addText: (name: string, body: string, folder?: string) => Promise<{ ok: boolean; error?: string }>;
  removeFile: (id: string) => void;
  restoreFile: (id: string) => void;
  purgeFile: (id: string) => void;
  emptyTrash: () => void;
  togglePublic: (id: string) => void;
  toggleStar: (id: string) => void;
  togglePin: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  moveFile: (id: string, folder: string) => void;
  moveMany: (ids: string[], folder: string) => void;
  trashMany: (ids: string[]) => void;
  addFolder: (name: string) => void;
  setNote: (id: string, note: string) => void;
  setTags: (id: string, tags: string[]) => void;
  setExpiry: (id: string, hours: number | null) => void;
  setColor: (id: string, color: string) => void;
  duplicateFile: (id: string) => void;
  bumpDownload: (id: string) => void;
  getFile: (id: string) => VaultFile | undefined;
  getPublicFile: (id: string) => VaultFile | undefined;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be inside VaultProvider');
  return ctx;
}

function loadAll(): VaultFile[] {
  try {
    const raw = localStorage.getItem('rb_vault');
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((f: VaultFile) => ({
      ...f,
      folder: f.folder || 'inbox',
      starred: !!f.starred,
      pinned: !!f.pinned,
      downloads: f.downloads || 0,
      note: f.note || '',
      tags: Array.isArray(f.tags) ? f.tags : [],
      expiresAt: f.expiresAt || null,
      trashed: !!f.trashed,
      color: f.color || 'none',
    }));
  } catch {
    return [];
  }
}

function saveAll(files: VaultFile[]) {
  try {
    localStorage.setItem('rb_vault', JSON.stringify(files));
  } catch {
    // storage can get sleepy with huge payloads; keep it in memory
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function stillLive(f: VaultFile) {
  if (!f.expiresAt) return true;
  return +new Date(f.expiresAt) > Date.now();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [all, setAll] = useState<VaultFile[]>(() => loadAll());
  const [extraFolders, setExtraFolders] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rb_folders') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    saveAll(all);
  }, [all]);

  useEffect(() => {
    localStorage.setItem('rb_folders', JSON.stringify(extraFolders));
  }, [extraFolders]);

  const mine = all.filter((f) => user && f.ownerId === user.id);
  const files = mine.filter((f) => !f.trashed);
  const trash = mine.filter((f) => f.trashed);
  const usedBytes = mine.reduce((n, f) => n + f.size, 0);
  const folders = Array.from(new Set(['inbox', ...extraFolders, ...files.map((f) => f.folder)]));
  const tags = Array.from(new Set(files.flatMap((f) => f.tags)));

  const addFiles = useCallback(async (fileList: FileList | File[], folder = 'inbox') => {
    if (!user) return { ok: false, error: 'log in first' };
    const incoming = Array.from(fileList);
    if (!incoming.length) return { ok: false, error: 'no files' };

    const biggest = Math.max(...incoming.map((f) => f.size));
    let warn: string | undefined;
    if (biggest > 80 * 1024 * 1024) warn = 'huge file — this tab might get sluggish, no cap though';
    else if (biggest > 25 * 1024 * 1024) warn = 'big drop — encoding can feel slow on this device';

    const next: VaultFile[] = [];
    for (const file of incoming) {
      const dataUrl = await readAsDataUrl(file);
      next.push({
        id: uid(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        createdAt: new Date().toISOString(),
        ownerId: user.id,
        public: false,
        folder,
        starred: false,
        pinned: false,
        downloads: 0,
        note: '',
        tags: [],
        expiresAt: null,
        trashed: false,
        color: 'none',
      });
    }
    setAll((prev) => [...next, ...prev]);
    return { ok: true, warn };
  }, [user]);

  const addText = useCallback(async (name: string, body: string, folder = 'inbox') => {
    if (!user) return { ok: false, error: 'log in first' };
    const cleanName = (name.trim() || 'note') + (name.endsWith('.txt') ? '' : '.txt');
    const blob = new Blob([body], { type: 'text/plain' });
    const file = new File([blob], cleanName, { type: 'text/plain' });
    const dataUrl = await readAsDataUrl(file);
    const rec: VaultFile = {
      id: uid(),
      name: cleanName,
      type: 'text/plain',
      size: blob.size,
      dataUrl,
      createdAt: new Date().toISOString(),
      ownerId: user.id,
      public: false,
      folder,
      starred: false,
      pinned: false,
      downloads: 0,
      note: '',
      tags: ['snippet'],
      expiresAt: null,
      trashed: false,
      color: 'none',
    };
    setAll((prev) => [rec, ...prev]);
    return { ok: true };
  }, [user]);

  const removeFile = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, trashed: true } : f)));
  }, []);

  const restoreFile = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, trashed: false } : f)));
  }, []);

  const purgeFile = useCallback((id: string) => {
    setAll((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const emptyTrash = useCallback(() => {
    setAll((prev) => prev.filter((f) => !(user && f.ownerId === user.id && f.trashed)));
  }, [user]);

  const togglePublic = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, public: !f.public } : f)));
  }, []);

  const toggleStar = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)));
  }, []);

  const togglePin = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f)));
  }, []);

  const renameFile = useCallback((id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, name: clean } : f)));
  }, []);

  const moveFile = useCallback((id: string, folder: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, folder } : f)));
  }, []);

  const moveMany = useCallback((ids: string[], folder: string) => {
    const set = new Set(ids);
    setAll((prev) => prev.map((f) => (set.has(f.id) ? { ...f, folder } : f)));
  }, []);

  const trashMany = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setAll((prev) => prev.map((f) => (set.has(f.id) ? { ...f, trashed: true } : f)));
  }, []);

  const addFolder = useCallback((name: string) => {
    const clean = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return;
    setExtraFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const setNote = useCallback((id: string, note: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, note } : f)));
  }, []);

  const setTags = useCallback((id: string, tags: string[]) => {
    const clean = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, tags: Array.from(new Set(clean)) } : f)));
  }, []);

  const setExpiry = useCallback((id: string, hours: number | null) => {
    const expiresAt = hours == null ? null : new Date(Date.now() + hours * 3600 * 1000).toISOString();
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, expiresAt } : f)));
  }, []);

  const setColor = useCallback((id: string, color: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, color } : f)));
  }, []);

  const duplicateFile = useCallback((id: string) => {
    setAll((prev) => {
      const src = prev.find((f) => f.id === id);
      if (!src) return prev;
      const copy: VaultFile = {
        ...src,
        id: uid(),
        name: src.name.replace(/(\.[^.]+)?$/, (m) => ' copy' + m),
        createdAt: new Date().toISOString(),
        public: false,
        downloads: 0,
        trashed: false,
        pinned: false,
      };
      return [copy, ...prev];
    });
  }, []);

  const bumpDownload = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, downloads: (f.downloads || 0) + 1 } : f)));
  }, []);

  const getFile = useCallback((id: string) => all.find((f) => f.id === id), [all]);
  const getPublicFile = useCallback((id: string) => {
    const f = all.find((x) => x.id === id && x.public && !x.trashed);
    if (!f || !stillLive(f)) return undefined;
    return f;
  }, [all]);

  return (
    <VaultContext.Provider value={{ files, trash, folders, tags, usedBytes, addFiles, addText, removeFile, restoreFile, purgeFile, emptyTrash, togglePublic, toggleStar, togglePin, renameFile, moveFile, moveMany, trashMany, addFolder, setNote, setTags, setExpiry, setColor, duplicateFile, bumpDownload, getFile, getPublicFile }}>
      {children}
    </VaultContext.Provider>
  );
}
