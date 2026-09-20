import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';
import { useVault, type VaultFile } from './VaultContext';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

function iconFor(type: string) {
  if (type.startsWith('image/')) return '🖼';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('compressed')) return '📦';
  return '📁';
}

export default function VaultPage() {
  const { isLoggedIn, user } = useAuth();
  const { navigate } = useRouter();
  const { files, folders, usedBytes, addFiles, removeFile, togglePublic, toggleStar, renameFile, moveFile, addFolder } = useVault();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('inbox');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState<VaultFile | null>(null);
  const [newFolder, setNewFolder] = useState('');
  const cap = 8 * 1024 * 1024;
  const pct = Math.min(100, (usedBytes / cap) * 100);

  const shown = useMemo(() => {
    return files.filter((f) => {
      if (onlyStarred && !f.starred) return false;
      if (folder !== 'all' && f.folder !== folder) return false;
      const q = query.trim().toLowerCase();
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [files, query, folder, onlyStarred]);

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const onDrop = async (list: FileList | File[] | null) => {
    if (!list || !('length' in list) || !list.length) return;
    setBusy(true);
    const res = await addFiles(list, folder === 'all' ? 'inbox' : folder);
    setBusy(false);
    ping(res.ok ? 'uploaded' : res.error || 'failed');
  };

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#share?f=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      ping('link copied');
    } catch {
      ping(url);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">vault</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">your files, locally hosted.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">
            drop anything in. preview, rename, favorite, sort into folders, share a public link. this demo lives in your browser so it stays snappy and private to this device.
          </p>
        </motion.div>

        {!isLoggedIn ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-lg text-white mb-2">sign in to open your vault</p>
            <p className="text-sm text-neutral-500 mb-6">same account you already use for boosts.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('login')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">log in</button>
              <button onClick={() => navigate('signup')} className="px-5 py-2.5 rounded-full border border-white/15 text-sm text-white hover:bg-white/5 transition">sign up</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div className="h-full bg-[#0a84ff]" initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                </div>
                <p className="text-xs text-neutral-500 mt-2">{formatBytes(usedBytes)} of 8 mb · {user?.username}</p>
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search files" className="sm:w-56 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <button onClick={() => setFolder('all')} className={`text-xs px-3 py-1.5 rounded-full transition ${folder === 'all' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}>all</button>
              {folders.map((f) => (
                <button key={f} onClick={() => setFolder(f)} className={`text-xs px-3 py-1.5 rounded-full transition ${folder === f ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}>{f}</button>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addFolder(newFolder);
                  setNewFolder('');
                }}
                className="flex gap-2"
              >
                <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="new folder" className="w-28 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs outline-none" />
              </form>
              <button onClick={() => setOnlyStarred((v) => !v)} className={`text-xs px-3 py-1.5 rounded-full ${onlyStarred ? 'bg-[#0a84ff] text-white' : 'bg-white/5'}`}>favorites</button>
              <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="text-xs px-3 py-1.5 rounded-full bg-white/5">{view}</button>
            </div>

            <motion.div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className={`glass rounded-[28px] p-10 text-center cursor-pointer transition-all duration-300 ${dragOver ? 'scale-[1.01] border-[#0a84ff]/40' : ''}`}
            >
              <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
              <p className="text-white font-medium">{busy ? 'uploading…' : 'drop files here'}</p>
              <p className="text-sm text-neutral-500 mt-1">or click to browse. images, clips, docs, whatever.</p>
            </motion.div>

            <div className={view === 'grid' ? 'mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'mt-8 space-y-3'}>
              <AnimatePresence>
                {shown.map((file) => (
                  <motion.article
                    key={file.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="glass rounded-3xl p-4 flex flex-col gap-3"
                  >
                    <button onClick={() => setPreview(file)} className="aspect-[16/10] rounded-2xl bg-black/30 overflow-hidden flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img src={file.dataUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{iconFor(file.type)}</span>
                      )}
                    </button>
                    <input
                      defaultValue={file.name}
                      onBlur={(e) => renameFile(file.id, e.target.value)}
                      className="bg-transparent text-sm text-white outline-none truncate"
                    />
                    <p className="text-xs text-neutral-500">{formatBytes(file.size)} · {file.folder}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => toggleStar(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">{file.starred ? 'starred' : 'star'}</button>
                      <button onClick={() => togglePublic(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">
                        {file.public ? 'public' : 'private'}
                      </button>
                      <button onClick={() => copyLink(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">copy link</button>
                      <select
                        value={file.folder}
                        onChange={(e) => moveFile(file.id, e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-full bg-white/5 border-0 outline-none"
                      >
                        {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <a href={file.dataUrl} download={file.name} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">download</a>
                      <button onClick={() => removeFile(file.id)} className="text-xs px-3 py-1.5 rounded-full text-red-400 hover:bg-red-500/10 transition">delete</button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {!shown.length && (
              <p className="text-center text-neutral-600 text-sm mt-10">nothing in here yet.</p>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreview(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl w-full glass rounded-[28px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm truncate pr-4">{preview.name}</p>
                <button onClick={() => setPreview(null)} className="text-sm text-neutral-400 hover:text-white">close</button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto flex justify-center bg-black/20">
                {preview.type.startsWith('image/') && <img src={preview.dataUrl} alt="" className="max-h-[65vh] rounded-xl" />}
                {preview.type.startsWith('video/') && <video src={preview.dataUrl} controls className="max-h-[65vh] rounded-xl" />}
                {preview.type.startsWith('audio/') && <audio src={preview.dataUrl} controls className="w-full" />}
                {!preview.type.startsWith('image/') && !preview.type.startsWith('video/') && !preview.type.startsWith('audio/') && (
                  <p className="text-sm text-neutral-400 py-10">no inline preview. just download it.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] glass rounded-full px-4 py-2 text-sm">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
