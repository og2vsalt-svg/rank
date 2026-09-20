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
  downloads: number;
  note: string;
  trashed: boolean;
}

interface VaultContextType {
  files: VaultFile[];
  trash: VaultFile[];
  folders: string[];
  usedBytes: number;
  addFiles: (fileList: FileList | File[], folder?: string) => Promise<{ ok: boolean; error?: string; warn?: string }>;
  removeFile: (id: string) => void;
  restoreFile: (id: string) => void;
  purgeFile: (id: string) => void;
  emptyTrash: () => void;
  togglePublic: (id: string) => void;
  toggleStar: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  moveFile: (id: string, folder: string) => void;
  moveMany: (ids: string[], folder: string) => void;
  trashMany: (ids: string[]) => void;
  addFolder: (name: string) => void;
  setNote: (id: string, note: string) => void;
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
      downloads: f.downloads || 0,
      note: f.note || '',
      trashed: !!f.trashed,
    }));
  } catch {
    return [];
  }
}

function saveAll(files: VaultFile[]) {
  try {
    localStorage.setItem('rb_vault', JSON.stringify(files));
  } catch {
    // browser storage can get sluggish with huge payloads; keep state in memory
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
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        createdAt: new Date().toISOString(),
        ownerId: user.id,
        public: false,
        folder,
        starred: false,
        downloads: 0,
        note: '',
        trashed: false,
      });
    }
    setAll((prev) => [...next, ...prev]);
    return { ok: true, warn };
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

  const duplicateFile = useCallback((id: string) => {
    setAll((prev) => {
      const src = prev.find((f) => f.id === id);
      if (!src) return prev;
      const copy: VaultFile = {
        ...src,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name: src.name.replace(/(\.[^.]+)?$/, (m) => ' copy' + m),
        createdAt: new Date().toISOString(),
        public: false,
        downloads: 0,
        trashed: false,
      };
      return [copy, ...prev];
    });
  }, []);

  const bumpDownload = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, downloads: (f.downloads || 0) + 1 } : f)));
  }, []);

  const getFile = useCallback((id: string) => all.find((f) => f.id === id), [all]);
  const getPublicFile = useCallback((id: string) => all.find((f) => f.id === id && f.public && !f.trashed), [all]);

  return (
    <VaultContext.Provider value={{ files, trash, folders, usedBytes, addFiles, removeFile, restoreFile, purgeFile, emptyTrash, togglePublic, toggleStar, renameFile, moveFile, moveMany, trashMany, addFolder, setNote, duplicateFile, bumpDownload, getFile, getPublicFile }}>
      {children}
    </VaultContext.Provider>
  );
}
