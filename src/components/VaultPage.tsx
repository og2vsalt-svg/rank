import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault, type VaultFile } from './VaultContext';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function VaultPage() {
  const { files, folders, addFiles, removeFile, toggleStar, togglePublic, setNote, usedBytes } = useVault();
  const { navigate } = useRouter();
  const [folder, setFolder] = useState('all');
  const [q, setQ] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (folder !== 'all' && f.folder !== folder) return false;
      if (q && !f.name.toLowerCase().includes(q.toLowerCase()) && !f.note.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [files, folder, q]);

  const onDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault?.();
    const list = 'dataTransfer' in e ? e.dataTransfer.files : e.target.files;
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 50 * 1024 * 1024);
    setWarn(big ? 'large file — may feel slow, but no hard limit.' : '');
    setBusy(true);
    const res = await addFiles(list, folder === 'all' ? 'inbox' : folder);
    setBusy(false);
    if (!res.ok) setWarn(res.error || 'could not add');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">your vault</h1>
          <p className="text-neutral-400 mt-1 text-sm">local files only. nothing leaves this browser until you share.</p>
          <p className="text-neutral-500 text-xs mt-1">{pretty(usedBytes)} stored · {files.length} files</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFolder('all')} className={`px-3 py-1 rounded-full text-sm ${folder === 'all' ? 'bg-white text-black' : 'bg-white/10'}`}>all</button>
          {folders.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={`px-3 py-1 rounded-full text-sm ${folder === f ? 'bg-white text-black' : 'bg-white/10'}`}>{f}</button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search files or notes…"
          className="w-full mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition"
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="mb-6 border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-[#0A84FF]/40 transition"
        >
          <p className="text-neutral-400 text-sm">drop files here or</p>
          <label className="mt-2 inline-block px-4 py-2 rounded-full bg-[#0A84FF] text-white text-sm cursor-pointer">
            choose
            <input type="file" multiple className="hidden" onChange={onDrop} />
          </label>
          {busy && <p className="mt-2 text-xs text-[#0A84FF]">adding…</p>}
          {warn && <p className="mt-2 text-xs text-amber-400">{warn}</p>}
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{f.name}</span>
                    {f.starred && <span className="text-yellow-400 text-xs">★</span>}
                    {f.public && <span className="text-[#0A84FF] text-xs">shared</span>}
                  </div>
                  <div className="text-xs text-neutral-500">{pretty(f.size)} · {f.folder} · {new Date(f.createdAt).toLocaleDateString()}</div>
                  {f.note && <div className="text-xs text-neutral-400 mt-0.5 truncate">{f.note}</div>}
                </div>
                <button onClick={() => toggleStar(f.id)} className="text-neutral-400 hover:text-yellow-400 text-sm">★</button>
                <button onClick={() => togglePublic(f.id)} className="text-xs px-2 py-1 rounded bg-white/10">{f.public ? 'unshare' : 'share'}</button>
                <button onClick={() => removeFile(f.id)} className="text-xs text-red-400/70 hover:text-red-400">trash</button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">nothing here yet. drop a file.</p>}
        </div>
      </main>
    </div>
  );
}
