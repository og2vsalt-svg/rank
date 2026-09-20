import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  File,
  FileText,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Music,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type VaultFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: number;
  dataUrl: string;
};

const DB_NAME = "rank-vault";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function listFiles(): Promise<VaultFile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as VaultFile[]).sort((a, b) => b.addedAt - a.addedAt));
    req.onerror = () => reject(req.error);
  });
}

async function putFile(file: VaultFile) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteFile(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  return `${(n / (1024 * 1024)).toFixed(1)} mb`;
}

function iconFor(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("text") || type.includes("pdf")) return FileText;
  return File;
}

export default function App() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<VaultFile | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setFiles(await listFiles());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  const used = files.reduce((acc, f) => acc + f.size, 0);

  async function ingest(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    setBusy(true);
    try {
      for (const file of incoming) {
        const dataUrl = await readAsDataUrl(file);
        await putFile({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          addedAt: Date.now(),
          dataUrl,
        });
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function download(file: VaultFile) {
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name;
    a.click();
  }

  return (
    <div className="mesh min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">rank</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">vault</h1>
            <p className="mt-2 max-w-md text-sm text-white/55">
              private files, stored on this device. drop anything in. preview, search, yank it back later.
            </p>
          </div>
          <div className="glass rounded-2xl px-4 py-3 text-sm text-white/70">
            <div className="flex items-center justify-between gap-8">
              <span>{files.length} files</span>
              <span>{formatBytes(used)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#0a84ff]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (used / (200 * 1024 * 1024)) * 100)}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 18 }}
              />
            </div>
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="glass flex h-12 flex-1 items-center gap-3 rounded-2xl px-4">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search files"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </label>
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-black transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            upload
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && ingest(e.target.files)}
          />
        </div>

        <motion.div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files) ingest(e.dataTransfer.files);
          }}
          animate={{ scale: dragging ? 1.01 : 1, borderColor: dragging ? "rgba(10,132,255,0.6)" : "rgba(255,255,255,0.1)" }}
          className="glass mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center"
        >
          <FolderOpen className="mb-3 h-8 w-8 text-white/40" />
          <p className="text-sm text-white/70">{busy ? "saving to vault…" : "drop files here"}</p>
          <p className="mt-1 text-xs text-white/35">stays in your browser. nothing leaves this machine.</p>
        </motion.div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((file) => {
              const Icon = iconFor(file.type);
              return (
                <motion.button
                  layout
                  key={file.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  onClick={() => setPreview(file)}
                  className="glass group rounded-3xl p-4 text-left transition hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                      <Icon className="h-5 w-5 text-white/80" />
                    </div>
                    <span className="text-[11px] text-white/35">{formatBytes(file.size)}</span>
                  </div>
                  <p className="mt-4 truncate text-sm font-medium text-white">{file.name}</p>
                  <p className="mt-1 text-xs text-white/35">{new Date(file.addedAt).toLocaleString()}</p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {!filtered.length && (
          <p className="mt-10 text-center text-sm text-white/35">vault is empty. drop something in.</p>
        )}
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-2xl overflow-hidden rounded-[28px]"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{preview.name}</p>
                  <p className="text-xs text-white/40">{preview.type || "file"} · {formatBytes(preview.size)}</p>
                </div>
                <button onClick={() => setPreview(null)} className="rounded-full p-2 hover:bg-white/8">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[52vh] overflow-auto bg-black/20 p-5">
                {preview.type.startsWith("image/") && (
                  <img src={preview.dataUrl} alt={preview.name} className="mx-auto max-h-[46vh] rounded-2xl" />
                )}
                {preview.type.startsWith("video/") && (
                  <video src={preview.dataUrl} controls className="mx-auto max-h-[46vh] rounded-2xl" />
                )}
                {preview.type.startsWith("audio/") && <audio src={preview.dataUrl} controls className="w-full" />}
                {!preview.type.startsWith("image/") &&
                  !preview.type.startsWith("video/") &&
                  !preview.type.startsWith("audio/") && (
                    <p className="text-sm text-white/50">no inline preview for this type. download it instead.</p>
                  )}
              </div>
              <div className="flex justify-end gap-2 px-5 py-4">
                <button
                  onClick={() => download(preview)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
                >
                  <Download className="h-4 w-4" /> download
                </button>
                <button
                  onClick={async () => {
                    await deleteFile(preview.id);
                    setPreview(null);
                    refresh();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm text-red-300"
                >
                  <Trash2 className="h-4 w-4" /> delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
