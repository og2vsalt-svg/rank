import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { publishShare } from '../lib/cloudShare';

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
  lockPass: string;
  collection: string;
  cloudSynced?: boolean;
}

export interface VaultEvent {
  id: string;
  at: string;
  text: string;
}

interface VaultContextType {
  files: VaultFile[];
  trash: VaultFile[];
  folders: string[];
  tags: string[];
  usedBytes: number;
  activity: VaultEvent[];
  addFiles: (fileList: FileList | File[], folder?: string) => Promise<{ ok: boolean; error?: string; warn?: string }>;
  addText: (name: string, body: string, folder?: string) => Promise<{ ok: boolean; error?: string }>;
  removeFile: (id: string) => void;
  restoreFile: (id: string) => void;
  purgeFile: (id: string) => void;
  emptyTrash: () => void;
  togglePublic: (id: string) => Promise<{ ok: boolean; error?: string; cloud?: boolean }>;
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
  setLock: (id: string, pass: string) => void;
  duplicateFile: (id: string) => void;
  bumpDownload: (id: string) => void;
  exportVault: () => void;
  importVault: (file: File) => Promise<{ ok: boolean; error?: string; count?: number }>;
  getFile: (id: string) => VaultFile | undefined;
  getPublicFile: (id: string) => VaultFile | undefined;
  collections: string[];
  addCollection: (name: string) => void;
  setCollection: (id: string, collection: string) => void;
  renameFolder: (from: string, to: string) => void;
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
      lockPass: f.lockPass || '',
      collection: f.collection || '',
      cloudSynced: !!f.cloudSynced,
    }));
  } catch {
    return [];
  }
}

function saveAll(files: VaultFile[]) {
  try {
    localStorage.setItem('rb_vault', JSON.stringify(files));
  } catch {
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
    try { return JSON.parse(localStorage.getItem('rb_folders') || '[]'); } catch { return []; }
  });
  const [extraCols, setExtraCols] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rb_cols') || '[]'); } catch { return []; }
  });
  const [activity, setActivity] = useState<VaultEvent[]>(() => {
    try { return JSON.parse(localStorage.getItem('rb_activity') || '[]').slice(0, 40); } catch { return []; }
  });

  useEffect(() => { saveAll(all); }, [all]);
  useEffect(() => { localStorage.setItem('rb_folders', JSON.stringify(extraFolders)); }, [extraFolders]);
  useEffect(() => { localStorage.setItem('rb_cols', JSON.stringify(extraCols)); }, [extraCols]);
  useEffect(() => { localStorage.setItem('rb_activity', JSON.stringify(activity.slice(0, 40))); }, [activity]);

  const log = useCallback((text: string) => {
    setActivity((prev) => [{ id: uid(), at: new Date().toISOString(), text }, ...prev].slice(0, 40));
  }, []);

  const mine = all.filter((f) => user && f.ownerId === user.id);
  const files = mine.filter((f) => !f.trashed);
  const trash = mine.filter((f) => f.trashed);
  const usedBytes = mine.reduce((n, f) => n + f.size, 0);
  const folders = Array.from(new Set(['inbox', ...extraFolders, ...files.map((f) => f.folder)]));
  const tags = Array.from(new Set(files.flatMap((f) => f.tags)));
  const collections = Array.from(new Set([...extraCols, ...files.map((f) => f.collection).filter(Boolean)]));

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
        id: uid(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl,
        createdAt: new Date().toISOString(), ownerId: user.id, public: false, folder, starred: false, pinned: false,
        downloads: 0, note: '', tags: [], expiresAt: null, trashed: false, color: 'none', lockPass: '', collection: '', cloudSynced: false,
      });
    }
    setAll((prev) => [...next, ...prev]);
    log(`added ${next.length} file${next.length > 1 ? 's' : ''} to ${folder}`);
    return { ok: true, warn };
  }, [user, log]);

  const addText = useCallback(async (name: string, body: string, folder = 'inbox') => {
    if (!user) return { ok: false, error: 'log in first' };
    const cleanName = (name.trim() || 'note') + (name.endsWith('.txt') ? '' : '.txt');
    const blob = new Blob([body], { type: 'text/plain' });
    const file = new File([blob], cleanName, { type: 'text/plain' });
    const dataUrl = await readAsDataUrl(file);
    const rec: VaultFile = {
      id: uid(), name: cleanName, type: 'text/plain', size: blob.size, dataUrl, createdAt: new Date().toISOString(),
      ownerId: user.id, public: false, folder, starred: false, pinned: false, downloads: 0, note: '', tags: ['snippet'],
      expiresAt: null, trashed: false, color: 'none', lockPass: '', collection: '', cloudSynced: false,
    };
    setAll((prev) => [rec, ...prev]);
    log(`saved snippet ${cleanName}`);
    return { ok: true };
  }, [user, log]);

  const removeFile = useCallback((id: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, trashed: true } : f))); log('moved a file to trash'); }, [log]);
  const restoreFile = useCallback((id: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, trashed: false } : f))); log('restored a file'); }, [log]);
  const purgeFile = useCallback((id: string) => { setAll((prev) => prev.filter((f) => f.id !== id)); log('purged a file'); }, [log]);
  const emptyTrash = useCallback(() => { setAll((prev) => prev.filter((f) => !(user && f.ownerId === user.id && f.trashed))); log('emptied trash'); }, [user, log]);

  const togglePublic = useCallback(async (id: string) => {
    const current = all.find((f) => f.id === id);
    if (!current) return { ok: false, error: 'file missing' };
    const makingPublic = !current.public;

    setAll((prev) => prev.map((f) => (f.id === id ? { ...f, public: makingPublic } : f)));

    if (!makingPublic) {
      log('made a file private');
      return { ok: true, cloud: false };
    }

    log('publishing share to cloud db…');
    const res = await publishShare({
      id: current.id,
      name: current.name,
      type: current.type,
      size: current.size,
      dataUrl: current.dataUrl,
      lockPass: current.lockPass,
      expiresAt: current.expiresAt,
    });

    if (res.ok) {
      setAll((prev) => prev.map((f) => (f.id === id ? { ...f, public: true, cloudSynced: true } : f)));
      log('cloud share live');
      return { ok: true, cloud: true };
    }

    // still public locally so same-device links work; cloud failed
    log('cloud publish failed — link still works on this device only');
    return { ok: true, cloud: false, error: res.error };
  }, [all, log]);

  const toggleStar = useCallback((id: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f))); }, []);
  const togglePin = useCallback((id: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f))); }, []);
  const renameFile = useCallback((id: string, name: string) => { const clean = name.trim(); if (!clean) return; setAll((prev) => prev.map((f) => (f.id === id ? { ...f, name: clean } : f))); }, []);
  const moveFile = useCallback((id: string, folder: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, folder } : f))); }, []);
  const moveMany = useCallback((ids: string[], folder: string) => { const set = new Set(ids); setAll((prev) => prev.map((f) => (set.has(f.id) ? { ...f, folder } : f))); log(`moved ${ids.length} to ${folder}`); }, [log]);
  const trashMany = useCallback((ids: string[]) => { const set = new Set(ids); setAll((prev) => prev.map((f) => (set.has(f.id) ? { ...f, trashed: true } : f))); log(`trashed ${ids.length}`); }, [log]);
  const addFolder = useCallback((name: string) => { const clean = name.trim().toLowerCase().replace(/\s+/g, '-'); if (!clean) return; setExtraFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean])); }, []);
  const addCollection = useCallback((name: string) => { const clean = name.trim().toLowerCase().replace(/\s+/g, '-'); if (!clean) return; setExtraCols((prev) => (prev.includes(clean) ? prev : [...prev, clean])); log('made album ' + clean); }, [log]);
  const setCollection = useCallback((id: string, collection: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, collection } : f))); }, []);
  const renameFolder = useCallback((from: string, to: string) => { const clean = to.trim().toLowerCase().replace(/\s+/g, '-'); if (!clean || from === 'inbox') return; setAll((prev) => prev.map((f) => (f.folder === from ? { ...f, folder: clean } : f))); setExtraFolders((prev) => Array.from(new Set(prev.map((x) => (x === from ? clean : x))))); log('renamed folder'); }, [log]);
  const setNote = useCallback((id: string, note: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, note } : f))); }, []);
  const setTags = useCallback((id: string, tags: string[]) => { const clean = tags.map((t) => t.trim().toLowerCase()).filter(Boolean); setAll((prev) => prev.map((f) => (f.id === id ? { ...f, tags: Array.from(new Set(clean)) } : f))); }, []);
  const setExpiry = useCallback((id: string, hours: number | null) => { const expiresAt = hours == null ? null : new Date(Date.now() + hours * 3600 * 1000).toISOString(); setAll((prev) => prev.map((f) => (f.id === id ? { ...f, expiresAt } : f))); }, []);
  const setColor = useCallback((id: string, color: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, color } : f))); }, []);
  const setLock = useCallback((id: string, pass: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, lockPass: pass } : f))); log(pass ? 'set a share passcode' : 'cleared a share passcode'); }, [log]);
  const duplicateFile = useCallback((id: string) => { setAll((prev) => { const src = prev.find((f) => f.id === id); if (!src) return prev; const copy: VaultFile = { ...src, id: uid(), name: src.name.replace(/(\.[^.]+)?$/, (m) => ' copy' + m), createdAt: new Date().toISOString(), public: false, downloads: 0, trashed: false, pinned: false, lockPass: '', cloudSynced: false }; return [copy, ...prev]; }); log('duplicated a file'); }, [log]);
  const bumpDownload = useCallback((id: string) => { setAll((prev) => prev.map((f) => (f.id === id ? { ...f, downloads: (f.downloads || 0) + 1 } : f))); }, []);
  const exportVault = useCallback(() => { if (!user) return; const payload = { version: 1, exportedAt: new Date().toISOString(), folders: extraFolders, files: mine }; const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rank-vault-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); log('exported vault'); }, [user, extraFolders, mine, log]);
  const importVault = useCallback(async (file: File) => { if (!user) return { ok: false, error: 'log in first' }; try { const text = await file.text(); const parsed = JSON.parse(text); const incoming: VaultFile[] = Array.isArray(parsed) ? parsed : parsed.files; if (!Array.isArray(incoming)) return { ok: false, error: 'not a vault export' }; const mapped = incoming.map((f) => ({ ...f, id: uid(), ownerId: user.id, folder: f.folder || 'inbox', tags: Array.isArray(f.tags) ? f.tags : [], lockPass: f.lockPass || '', trashed: !!f.trashed, cloudSynced: false })); setAll((prev) => [...mapped, ...prev]); if (Array.isArray(parsed.folders)) setExtraFolders((prev) => Array.from(new Set([...prev, ...parsed.folders]))); log(`imported ${mapped.length} files`); return { ok: true, count: mapped.length }; } catch { return { ok: false, error: 'could not read that file' }; } }, [user, log]);
  const getFile = useCallback((id: string) => all.find((f) => f.id === id), [all]);
  const getPublicFile = useCallback((id: string) => { const f = all.find((x) => x.id === id && x.public && !x.trashed); if (!f || !stillLive(f)) return undefined; return f; }, [all]);

  return (
    <VaultContext.Provider value={{ files, trash, folders, tags, usedBytes, activity, addFiles, addText, removeFile, restoreFile, purgeFile, emptyTrash, togglePublic, toggleStar, togglePin, renameFile, moveFile, moveMany, trashMany, addFolder, setNote, setTags, setExpiry, setColor, setLock, duplicateFile, bumpDownload, exportVault, importVault, getFile, getPublicFile, collections, addCollection, setCollection, renameFolder }}>
      {children}
    </VaultContext.Provider>
  );
}
