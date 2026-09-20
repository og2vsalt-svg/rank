import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Download,
  File,
  FileText,
  Film,
  Folder,
  FolderOpen,
  Grid2x2,
  Image as ImageIcon,
  LayoutList,
  Music,
  Pencil,
  Pin,
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
  folder: string;
  pinned: boolean;
};

const DB_NAME = "rank-vault";
const STORE = "files";
const FOLDERS_KEY = "rank-vault-folders";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function normalize(file: VaultFile): VaultFile {
  return {
    ...file,
    folder: file.folder || "inbox",
    pinned: Boolean(file.pinned),
  };
}

async function listFiles(): Promise<VaultFile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve((req.result as VaultFile[]).map(normalize).sort((a, b) => b.addedAt - a.addedAt));
    req.onerror = () => reject(req.error);
  });
}

async function putFile(file: VaultFile) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(normalize(file));
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

type SortKey = "newest" | "oldest" | "name" | "size";
type KindFilter = "all" | "image" | "video" | "audio" | "doc";

export default function App() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<VaultFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [folder, setFolder] = useState("inbox");
  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FOLDERS_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.from(new Set(["inbox", ...parsed]));
    } catch {
      return ["inbox"];
    }
  });
  const [sort, setSort] = useState<SortKey>("newest");
  const [kind, setKind] = useState<KindFilter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setFiles(await listFiles());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders.filter((f) => f !== "inbox")));
  }, [folders]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = files.filter((f) => f.folder === folder);
    if (q) next = next.filter((f) => f.name.toLowerCase().includes(q));
    if (kind === "image") next = next.filter((f) => f.type.startsWith("image/"));
    if (kind === "video") next = next.filter((f) => f.type.startsWith("video/"));
    if (kind === "audio") next = next.filter((f) => f.type.startsWith("audio/"));
    if (kind === "doc")
      next = next.filter(
        (f) => f.type.includes("text") || f.type.includes("pdf") || f.type.includes("json"),
      );
    next = [...next].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return b.size - a.size;
      if (sort === "oldest") return a.addedAt - b.addedAt;
      return b.addedAt - a.addedAt;
    });
    return next;
  }, [files, query, folder, kind, sort]);

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
          folder,
          pinned: false,
        });
      }
      await refresh();
      setToast(`saved ${incoming.length} file${incoming.length === 1 ? "" : "s"}`);
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

  function addFolder() {
    const name = window.prompt("folder name")?.trim().toLowerCase();
    if (!name) return;
    setFolders((prev) => Array.from(new Set([...prev, name])));
    setFolder(name);
  }

  async function togglePin(file: VaultFile) {
    await putFile({ ...file, pinned: !file.pinned });
    await refresh();
  }

  async function saveRename(file: VaultFile) {
    const name = renameValue.trim();
    if (name && name !== file.name) {
      await putFile({ ...file, name });
      await refresh();
    }
    setRenaming(null);
  }

  async function bulkDelete() {
    for (const id of selected) await deleteFile(id);
    setSelected([]);
    setPreview(null);
    await refresh();
  }

  async function moveSelected(target: string) {
    const map = new Map(files.map((f) => [f.id, f]));
    for (const id of selected) {
      const file = map.get(id);
      if (file) await putFile({ ...file, folder: target });
    }
    setSelected([]);
    await refresh();
    setToast(`moved to ${target}`);
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

        <div className="mt-8 flex flex-wrap gap-2">
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFolder(f);
                setSelected([]);
              }}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ${
                folder === f ? "bg-white text-black" : "glass text-white/70 hover:text-white"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              {f}
            </button>
          ))}
          <button onClick={addFolder} className="rounded-full px-3 py-1.5 text-xs text-white/50 hover:text-white">
            + folder
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="glass flex h-12 flex-1 items-center gap-3 rounded-2xl px-4">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search files"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as KindFilter)}
            className="glass h-12 rounded-2xl px-3 text-sm outline-none"
          >
            <option value="all">all types</option>
            <option value="image">images</option>
            <option value="video">videos</option>
            <option value="audio">audio</option>
            <option value="doc">docs</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="glass h-12 rounded-2xl px-3 text-sm outline-none"
          >
            <option value="newest">newest</option>
            <option value="oldest">oldest</option>
            <option value="name">name</option>
            <option value="size">size</option>
          </select>
          <button
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="glass inline-flex h-12 w-12 items-center justify-center rounded-2xl"
          >
            {view === "grid" ? <LayoutList className="h-4 w-4" /> : <Grid2x2 className="h-4 w-4" />}
          </button>
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

        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass mt-4 flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-sm"
            >
              <span className="text-white/60">{selected.length} selected</span>
              {folders.map((f) => (
                <button key={f} onClick={() => moveSelected(f)} className="rounded-full bg-white/8 px-3 py-1 text-xs">
                  move to {f}
                </button>
              ))}
              <button onClick={bulkDelete} className="ml-auto rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
                delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
          className="glass mt-6 flex min-h-[140px] flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center"
        >
          <FolderOpen className="mb-3 h-8 w-8 text-white/40" />
          <p className="text-sm text-white/70">{busy ? "saving to vault…" : `drop files into ${folder}`}</p>
          <p className="mt-1 text-xs text-white/35">stays in your browser. nothing leaves this machine.</p>
        </motion.div>

        <div className={view === "grid" ? "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "mt-8 flex flex-col gap-2"}>
          <AnimatePresence>
            {filtered.map((file) => {
              const Icon = iconFor(file.type);
              const on = selected.includes(file.id);
              return (
                <motion.div
                  layout
                  key={file.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className={`glass group relative text-left transition hover:-translate-y-0.5 ${
                    view === "grid" ? "rounded-3xl p-4" : "flex items-center gap-4 rounded-2xl px-4 py-3"
                  } ${on ? "ring-1 ring-[#0a84ff]" : ""}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => (prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id]));
                    }}
                    className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full ${
                      on ? "bg-[#0a84ff] text-white" : "bg-white/8 text-white/40"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setPreview(file)} className={view === "grid" ? "w-full text-left" : "flex flex-1 items-center gap-4 text-left"}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/8">
                      <Icon className="h-5 w-5 text-white/80" />
                    </div>
                    <div className={view === "grid" ? "mt-4" : "min-w-0 flex-1"}>
                      {renaming === file.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => saveRename(file)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(file);
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full rounded-lg bg-white/8 px-2 py-1 text-sm outline-none"
                        />
                      ) : (
                        <p className="truncate text-sm font-medium text-white">
                          {file.pinned ? "· " : ""}
                          {file.name}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-white/35">
                        {formatBytes(file.size)} · {new Date(file.addedAt).toLocaleString()}
                      </p>
                    </div>
                  </button>
                  <div className={`flex gap-1 ${view === "grid" ? "mt-3" : ""}`}>
                    <button
                      onClick={() => togglePin(file)}
                      className="rounded-full p-2 text-white/40 hover:bg-white/8 hover:text-white"
                    >
                      <Pin className={`h-3.5 w-3.5 ${file.pinned ? "text-[#0a84ff]" : ""}`} />
                    </button>
                    <button
                      onClick={() => {
                        setRenaming(file.id);
                        setRenameValue(file.name);
                      }}
                      className="rounded-full p-2 text-white/40 hover:bg-white/8 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
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
                  <p className="text-xs text-white/40">
                    {preview.type || "file"} · {formatBytes(preview.size)} · {preview.folder}
                  </p>
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

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
