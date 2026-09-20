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
}

interface VaultContextType {
  files: VaultFile[];
  folders: string[];
  usedBytes: number;
  addFiles: (fileList: FileList | File[], folder?: string) => Promise<{ ok: boolean; error?: string }>;
  removeFile: (id: string) => void;
  togglePublic: (id: string) => void;
  toggleStar: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  moveFile: (id: string, folder: string) => void;
  addFolder: (name: string) => void;
  bumpDownload: (id: string) => void;
  getFile: (id: string) => VaultFile | undefined;
  getPublicFile: (id: string) => VaultFile | undefined;
}

const VaultContext = createContext<VaultContextType | null>(null);
const LIMIT = 8 * 1024 * 1024;

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
    }));
  } catch {
    return [];
  }
}

function saveAll(files: VaultFile[]) {
  localStorage.setItem('rb_vault', JSON.stringify(files));
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

  const files = all.filter((f) => user && f.ownerId === user.id);
  const usedBytes = files.reduce((n, f) => n + f.size, 0);
  const folders = Array.from(new Set(['inbox', ...extraFolders, ...files.map((f) => f.folder)]));

  const addFiles = useCallback(async (fileList: FileList | File[], folder = 'inbox') => {
    if (!user) return { ok: false, error: 'log in first' };
    const incoming = Array.from(fileList);
    if (!incoming.length) return { ok: false, error: 'no files' };
    const extra = incoming.reduce((n, f) => n + f.size, 0);
    const current = loadAll().filter((f) => f.ownerId === user.id).reduce((n, f) => n + f.size, 0);
    if (current + extra > LIMIT) return { ok: false, error: 'vault is full (8mb demo cap in-browser)' };

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
      });
    }
    setAll((prev) => [...next, ...prev]);
    return { ok: true };
  }, [user]);

  const removeFile = useCallback((id: string) => {
    setAll((prev) => prev.filter((f) => f.id !== id));
  }, []);

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

  const addFolder = useCallback((name: string) => {
    const clean = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return;
    setExtraFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const bumpDownload = useCallback((id: string) => {
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, downloads: (f.downloads || 0) + 1 } : f)));
  }, []);

  const getFile = useCallback((id: string) => all.find((f) => f.id === id), [all]);
  const getPublicFile = useCallback((id: string) => all.find((f) => f.id === id && f.public), [all]);

  return (
    <VaultContext.Provider value={{ files, folders, usedBytes, addFiles, removeFile, togglePublic, toggleStar, renameFile, moveFile, addFolder, bumpDownload, getFile, getPublicFile }}>
      {children}
    </VaultContext.Provider>
  );
}
