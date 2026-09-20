import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';
import { useVault, type VaultFile } from './VaultContext';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function iconFor(type: string) {
  if (type.startsWith('image/')) return '🖼';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('compressed')) return '📦';
  if (type.startsWith('text/') || type.includes('json')) return '✎';
  return '📁';
}

function textPreview(file: VaultFile) {
  if (!file.dataUrl.includes(',')) return '';
  try {
    return decodeURIComponent(escape(atob(file.dataUrl.split(',')[1].slice(0, 8000))));
  } catch {
    return '';
  }
}

export default function VaultPage() {
  const { isLoggedIn, user } = useAuth();
  const { navigate } = useRouter();
  const {
    files, trash, folders, tags, usedBytes, activity, addFiles, addText, removeFile, restoreFile, purgeFile, emptyTrash,
    togglePublic, toggleStar, togglePin, renameFile, moveFile, moveMany, trashMany, addFolder, setNote, setTags, setExpiry, setColor, setLock, duplicateFile, bumpDownload, exportVault, importVault,
  } = useVault();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('inbox');
  const [tag, setTag] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [sort, setSort] = useState<'new' | 'name' | 'size'>('new');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState<VaultFile | null>(null);
  const [newFolder, setNewFolder] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [snipName, setSnipName] = useState('');
  const [snipBody, setSnipBody] = useState('');
  const [showSnip, setShowSnip] = useState(false);

  const source = showTrash ? trash : files;

  const shown = useMemo(() => {
    const list = source.filter((f) => {
      if (!showTrash && onlyStarred && !f.starred) return false;
      if (!showTrash && folder !== 'all' && f.folder !== folder) return false;
      if (!showTrash && tag !== 'all' && !(f.tags || []).includes(tag)) return false;
      const q = query.trim().toLowerCase();
      if (q && !f.name.toLowerCase().includes(q) && !f.note.toLowerCase().includes(q) && !(f.tags || []).join(' ').includes(q)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return Number(b.pinned) - Number(a.pinned);
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'size') return b.size - a.size;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [source, query, folder, tag, onlyStarred, showTrash, sort]);

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const onDrop = async (list: FileList | File[] | null) => {
    if (!list || !('length' in list) || !list.length) return;
    setBusy(true);
    const res = await addFiles(list, folder === 'all' ? 'inbox' : folder);
    setBusy(false);
    if (!res.ok) ping(res.error || 'failed');
    else ping(res.warn || 'uploaded');
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!isLoggedIn || showTrash) return;
      const items = e.clipboardData?.files;
      if (items && items.length) {
        e.preventDefault();
        onDrop(items);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isLoggedIn, showTrash, folder]);

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#share?f=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      ping('link copied');
    } catch {
      ping(url);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">vault</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">your files, locally hosted.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">
            drop or paste anything in. preview, pin, tag, expire a public link. no hard size cap — just a heads up if a drop might make this tab sleepy.
          </p>
        </motion.div>

        {!isLoggedIn ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-lg text-white mb-2">sign in to open your vault</p>
            <p className="text-sm text-neutral-500 mb-6">same account keeps your folders together on this device.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('login')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition">log in</button>
              <button onClick={() => navigate('signup')} className="px-5 py-2.5 rounded-full border border-white/15 text-sm text-white hover:bg-white/5 transition">sign up</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <p className="text-xs text-neutral-500">{formatBytes(usedBytes)} on this device · {user?.username} · {trash.length} in trash · paste a file anytime</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={exportVault} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10">export vault</button>
                  <label className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer">
                    import json
                    <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const res = await importVault(f);
                      ping(res.ok ? `imported ${res.count}` : (res.error || 'import failed'));
                      e.target.value = '';
                    }} />
                  </label>
                </div>
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search files, notes, tags" className="sm:w-56 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <button onClick={() => { setShowTrash(false); setFolder('all'); }} className={`text-xs px-3 py-1.5 rounded-full transition ${!showTrash && folder === 'all' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}>all</button>
              {!showTrash && folders.map((f) => (
                <button key={f} onClick={() => { setShowTrash(false); setFolder(f); }} className={`text-xs px-3 py-1.5 rounded-full transition ${folder === f && !showTrash ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}>{f}</button>
              ))}
              <form onSubmit={(e) => { e.preventDefault(); addFolder(newFolder); setNewFolder(''); }} className="flex gap-2">
                <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="new folder" className="w-28 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs outline-none" />
              </form>
              <select value={tag} onChange={(e) => setTag(e.target.value)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border-0 outline-none">
                <option value="all">any tag</option>
                {tags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => setOnlyStarred((v) => !v)} className={`text-xs px-3 py-1.5 rounded-full ${onlyStarred ? 'bg-[#0a84ff] text-white' : 'bg-white/5'}`}>favorites</button>
              <button onClick={() => setShowTrash((v) => !v)} className={`text-xs px-3 py-1.5 rounded-full ${showTrash ? 'bg-white text-black' : 'bg-white/5'}`}>trash</button>
              <button onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="text-xs px-3 py-1.5 rounded-full bg-white/5">{view}</button>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border-0 outline-none">
                <option value="new">newest</option>
                <option value="name">name</option>
                <option value="size">size</option>
              </select>
            </div>

            <AnimatePresence>
              {selected.length > 0 && !showTrash && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 glass rounded-full px-4 py-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-400">{selected.length} selected</span>
                  <select onChange={(e) => { if (e.target.value) { moveMany(selected, e.target.value); ping('moved'); } }} className="text-xs px-2 py-1 rounded-full bg-white/5 border-0" defaultValue="">
                    <option value="" disabled>move to</option>
                    {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <button onClick={() => { trashMany(selected); setSelected([]); ping('sent to trash'); }} className="text-xs px-3 py-1 rounded-full text-red-400">trash selected</button>
                  <button onClick={() => setSelected([])} className="text-xs px-3 py-1 rounded-full bg-white/5">clear</button>
                </motion.div>
              )}
            </AnimatePresence>

            {showTrash && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-neutral-500">deleted files sit here until you purge them.</p>
                {trash.length > 0 && (
                  <button onClick={() => { emptyTrash(); ping('trash emptied'); }} className="text-xs px-3 py-1.5 rounded-full text-red-400 hover:bg-red-500/10">empty trash</button>
                )}
              </div>
            )}

            {!showTrash && (
              <motion.div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={`glass rounded-[28px] p-10 text-center cursor-pointer transition-all duration-300 ${dragOver ? 'scale-[1.01] border-[#0a84ff]/40' : ''}`}
              >
                <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
                <p className="text-white font-medium">{busy ? 'uploading…' : 'drop files here'}</p>
                <p className="text-sm text-neutral-500 mt-1">or click to browse, or paste. any size. big ones just take a second.</p>
              </motion.div>
            )}

            {!showTrash && (
              <div className="mt-4">
                <button onClick={() => setShowSnip((v) => !v)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10">{showSnip ? 'hide snippet' : 'new text snippet'}</button>
                {showSnip && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const res = await addText(snipName, snipBody, folder === 'all' ? 'inbox' : folder);
                      if (res.ok) { setSnipName(''); setSnipBody(''); setShowSnip(false); ping('snippet saved'); }
                      else ping(res.error || 'failed');
                    }}
                    className="mt-3 glass rounded-3xl p-4 space-y-3"
                  >
                    <input value={snipName} onChange={(e) => setSnipName(e.target.value)} placeholder="snippet name" className="w-full bg-white/5 rounded-2xl px-3 py-2 text-sm outline-none" />
                    <textarea value={snipBody} onChange={(e) => setSnipBody(e.target.value)} placeholder="paste notes, keys, whatever…" className="w-full bg-white/5 rounded-2xl px-3 py-2 text-sm outline-none min-h-[120px]" />
                    <button type="submit" className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">save snippet</button>
                  </form>
                )}
              </div>
            )}

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
                    className={`glass rounded-3xl p-4 flex flex-col gap-3 ${selected.includes(file.id) ? 'ring-1 ring-[#0a84ff]/50' : ''}`}
                  >
                    <button onClick={() => setPreview(file)} className="aspect-[16/10] rounded-2xl bg-black/30 overflow-hidden flex items-center justify-center relative">
                      {file.pinned && <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white text-black">pinned</span>}
                      {file.type.startsWith('image/') ? (
                        <img src={file.dataUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{iconFor(file.type)}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {!showTrash && (
                        <input type="checkbox" checked={selected.includes(file.id)} onChange={() => toggleSelect(file.id)} className="accent-[#0a84ff]" />
                      )}
                      <input defaultValue={file.name} onBlur={(e) => renameFile(file.id, e.target.value)} className="bg-transparent text-sm text-white outline-none truncate flex-1" />
                    </div>
                    <p className="text-xs text-neutral-500">{formatBytes(file.size)} · {file.folder} · {file.downloads} dl{(file.tags || []).length ? ' · ' + file.tags.join(', ') : ''}</p>
                    {!showTrash && (
                      <div className="flex gap-1.5">
                        {['none','red','orange','yellow','green','blue','purple'].map((c) => (
                          <button key={c} onClick={() => setColor(file.id, c)} className={`w-3.5 h-3.5 rounded-full ${file.color===c ? 'ring-2 ring-white/80' : ''}`} style={{ background: c==='none' ? '#3a3a3c' : c }} />
                        ))}
                      </div>
                    )}
                    {file.note && <p className="text-xs text-neutral-400 line-clamp-2">{file.note}</p>}
                    <div className="flex flex-wrap gap-2">
                      {showTrash ? (
                        <>
                          <button onClick={() => { restoreFile(file.id); ping('restored'); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">restore</button>
                          <button onClick={() => { purgeFile(file.id); ping('gone'); }} className="text-xs px-3 py-1.5 rounded-full text-red-400 hover:bg-red-500/10 transition">purge</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => togglePin(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">{file.pinned ? 'unpin' : 'pin'}</button>
                          <button onClick={() => toggleStar(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">{file.starred ? 'starred' : 'star'}</button>
                          <button onClick={() => togglePublic(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">{file.public ? 'public' : 'private'}</button>
                          <input defaultValue={file.lockPass} placeholder="share pass" onBlur={(e) => setLock(file.id, e.target.value)} className="text-xs w-24 px-2 py-1.5 rounded-full bg-white/5 outline-none" />
                          <button onClick={() => copyLink(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">copy link</button>
                          <button onClick={() => { duplicateFile(file.id); ping('duplicated'); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">duplicate</button>
                          <select value={file.folder} onChange={(e) => moveFile(file.id, e.target.value)} className="text-xs px-2 py-1.5 rounded-full bg-white/5 border-0 outline-none">
                            {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <a href={file.dataUrl} download={file.name} onClick={() => bumpDownload(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">download</a>
                          <button onClick={() => { removeFile(file.id); ping('sent to trash'); }} className="text-xs px-3 py-1.5 rounded-full text-red-400 hover:bg-red-500/10 transition">delete</button>
                        </>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {!shown.length && (
              <p className="text-center text-neutral-600 text-sm mt-10">{showTrash ? 'trash is empty.' : 'nothing in here yet.'}</p>
            )}

            {activity.length > 0 && (
              <div className="mt-12">
                <p className="text-xs text-neutral-500 mb-3">recent activity</p>
                <ul className="space-y-1.5">
                  {activity.slice(0, 8).map((ev) => (
                    <li key={ev.id} className="text-xs text-neutral-500">{new Date(ev.at).toLocaleString()} — {ev.text}</li>
                  ))}
                </ul>
              </div>
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
                {(preview.type.startsWith('text/') || preview.type.includes('json')) && (
                  <pre className="w-full text-xs text-neutral-300 whitespace-pre-wrap font-mono">{textPreview(preview)}</pre>
                )}
                {!preview.type.startsWith('image/') && !preview.type.startsWith('video/') && !preview.type.startsWith('audio/') && !preview.type.startsWith('text/') && !preview.type.includes('json') && (
                  <p className="text-sm text-neutral-400 py-10">no inline preview. just download it.</p>
                )}
              </div>
              <div className="p-4 border-t border-white/10 space-y-3">
                <textarea defaultValue={preview.note} onBlur={(e) => setNote(preview.id, e.target.value)} placeholder="add a note…" className="w-full bg-white/5 rounded-2xl px-3 py-2 text-sm outline-none min-h-[72px]" />
                <input defaultValue={(preview.tags || []).join(', ')} onBlur={(e) => setTags(preview.id, e.target.value.split(/[,\s]+/))} placeholder="tags, comma separated" className="w-full bg-white/5 rounded-2xl px-3 py-2 text-sm outline-none" />
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-neutral-500">link expiry</span>
                  <button onClick={() => setExpiry(preview.id, null)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">never</button>
                  <button onClick={() => setExpiry(preview.id, 1)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">1h</button>
                  <button onClick={() => setExpiry(preview.id, 24)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">24h</button>
                  <button onClick={() => setExpiry(preview.id, 168)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">7d</button>
                </div>
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
