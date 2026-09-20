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
}

interface VaultContextType {
  files: VaultFile[];
  usedBytes: number;
  addFiles: (fileList: FileList | File[]) => Promise<{ ok: boolean; error?: string }>;
  removeFile: (id: string) => void;
  togglePublic: (id: string) => void;
  renameFile: (id: string, name: string) => void;
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
    return raw ? JSON.parse(raw) : [];
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

  useEffect(() => {
    saveAll(all);
  }, [all]);

  const files = all.filter((f) => user && f.ownerId === user.id);
  const usedBytes = files.reduce((n, f) => n + f.size, 0);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
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

  const renameFile = useCallback((id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, name: clean } : f)));
  }, []);

  const getPublicFile = useCallback((id: string) => {
    return all.find((f) => f.id === id && f.public);
  }, [all]);

  return (
    <VaultContext.Provider value={{ files, usedBytes, addFiles, removeFile, togglePublic, renameFile, getPublicFile }}>
      {children}
    </VaultContext.Provider>
  );
}
