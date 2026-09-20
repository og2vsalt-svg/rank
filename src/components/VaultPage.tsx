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
  if (type.startsWith('image/')) return 'img';
  if (type.startsWith('video/')) return 'vid';
  if (type.startsWith('audio/')) return 'aud';
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('zip') || type.includes('compressed')) return 'zip';
  if (type.startsWith('text/') || type.includes('json')) return 'txt';
  return 'file';
}

function kindOf(type: string) {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'doc';
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
  const [kind, setKind] = useState<'all' | 'image' | 'video' | 'audio' | 'doc'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [sort, setSort] = useState<'new' | 'name' | 'size'>('new');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState<VaultFile | null>(null);
  const [newFolder, setNewFolder] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [snipName, setSnipName] = useState('');
  const [snipBody, setSnipBody] = useState('');
  const [showSnip, setShowSnip] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  const source = showTrash ? trash : files;
  const sleepy = usedBytes > 80 * 1024 * 1024;

  const shown = useMemo(() => {
    const list = source.filter((f) => {
      if (!showTrash && onlyStarred && !f.starred) return false;
      if (!showTrash && folder !== 'all' && f.folder !== folder) return false;
      if (!showTrash && tag !== 'all' && !(f.tags || []).includes(tag)) return false;
      if (kind !== 'all' && kindOf(f.type) !== kind) return false;
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
  }, [source, query, folder, tag, onlyStarred, showTrash, sort, kind]);

  const recents = useMemo(() => files.slice(0, 8), [files]);

  const ping = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
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

  const downloadSelected = async () => {
    const pile = files.filter((f) => selected.includes(f.id));
    for (const f of pile) {
      const a = document.createElement('a');
      a.href = f.dataUrl;
      a.download = f.name;
      a.click();
      bumpDownload(f.id);
      await new Promise((r) => setTimeout(r, 180));
    }
    ping(pile.length > 3 ? 'started a pile of downloads — tab might feel sleepy' : `downloading ${pile.length}`);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">vault</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">your files, locally hosted.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">drop or paste anything in. preview, pin, tag, expire a public link. no hard size cap — just a heads up if a drop might make this tab sleepy.</p>
        </motion.div>

        {!isLoggedIn ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-lg text-white mb-2">sign in to open your vault</p>
            <p className="text-sm text-neutral-500 mb-6">same account keeps your folders together on this device.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate('login')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">log in</button>
              <button onClick={() => navigate('signup')} className="px-5 py-2.5 rounded-full border border-white/15 text-sm text-white">sign up</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <p className="text-xs text-neutral-500">{formatBytes(usedBytes)} on this device · {user?.username} · {trash.length} in trash · paste a file anytime</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-xs">
                  <div className={`h-full rounded-full ${sleepy ? 'bg-amber-400' : 'bg-[#0a84ff]'}`} style={{ width: Math.min(100, (usedBytes / (120 * 1024 * 1024)) * 100) + '%' }} />
                </div>
                {sleepy && <p className="text-[11px] text-amber-300/80 mt-1">this device is holding a lot. still no cap, just might feel slow.</p>}
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
                  <button onClick={() => setShowActivity((v) => !v)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10">activity</button>
                </div>
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search files, notes, tags" className="sm:w-56 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50" />
            </div>

            {showActivity && (
              <div className="glass rounded-3xl p-4 mb-5 max-h-48 overflow-auto">
                {activity.length === 0 && <p className="text-xs text-neutral-500">nothing yet</p>}
                {activity.map((ev) => (
                  <p key={ev.id} className="text-xs text-neutral-400 py-1 border-b border-white/5 last:border-0">{new Date(ev.at).toLocaleString()} · {ev.text}</p>
                ))}
              </div>
            )}

            {!showTrash && recents.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-neutral-500 mb-2">recents</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recents.map((f) => (
                    <button key={f.id} onClick={() => setPreview(f)} className="shrink-0 w-28 glass rounded-2xl p-2 text-left hover:-translate-y-0.5">
                      <div className="h-16 rounded-xl bg-black/30 overflow-hidden flex items-center justify-center mb-1.5">
                        {f.type.startsWith('image/') ? <img src={f.dataUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-neutral-400">{iconFor(f.type)}</span>}
                      </div>
                      <p className="text-[11px] truncate text-white">{f.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              {(['all','image','video','audio','doc'] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`text-xs px-3 py-1.5 rounded-full ${kind === k ? 'bg-[#0a84ff] text-white' : 'bg-white/5'}`}>{k}</button>
              ))}
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
                  <button onClick={downloadSelected} className="text-xs px-3 py-1 rounded-full bg-white text-black">download selected</button>
                  <button onClick={() => { trashMany(selected); setSelected([]); ping('sent to trash'); }} className="text-xs px-3 py-1 rounded-full text-red-400">trash selected</button>
                  <button onClick={() => setSelected(shown.map((f) => f.id))} className="text-xs px-3 py-1 rounded-full bg-white/5">select shown</button>
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
                  <form onSubmit={async (e) => { e.preventDefault(); const res = await addText(snipName, snipBody, folder === 'all' ? 'inbox' : folder); if (res.ok) { setSnipName(''); setSnipBody(''); setShowSnip(false); ping('snippet saved'); } else ping(res.error || 'failed'); }} className="mt-3 glass rounded-3xl p-4 space-y-3">
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
                  <motion.article key={file.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className={`glass rounded-3xl p-4 flex flex-col gap-3 ${selected.includes(file.id) ? 'ring-1 ring-[#0a84ff]/50' : ''}`}>
                    <button onClick={() => setPreview(file)} className="aspect-[16/10] rounded-2xl bg-black/30 overflow-hidden flex items-center justify-center relative">
                      {file.pinned && <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white text-black">pinned</span>}
                      {file.type.startsWith('image/') ? <img src={file.dataUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-neutral-400">{iconFor(file.type)}</span>}
                    </button>
                    <div className="flex items-center gap-2">
                      {!showTrash && <input type="checkbox" checked={selected.includes(file.id)} onChange={() => toggleSelect(file.id)} className="accent-[#0a84ff]" />}
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
                          <button onClick={() => { restoreFile(file.id); ping('restored'); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5">restore</button>
                          <button onClick={() => { purgeFile(file.id); ping('gone'); }} className="text-xs px-3 py-1.5 rounded-full text-red-400">purge</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => togglePin(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">{file.pinned ? 'unpin' : 'pin'}</button>
                          <button onClick={() => toggleStar(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">{file.starred ? 'starred' : 'star'}</button>
                          <button onClick={() => togglePublic(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">{file.public ? 'public' : 'private'}</button>
                          <input defaultValue={file.lockPass} placeholder="share pass" onBlur={(e) => setLock(file.id, e.target.value)} className="text-xs w-24 px-2 py-1.5 rounded-full bg-white/5 outline-none" />
                          <button onClick={() => copyLink(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">copy link</button>
                          <button onClick={() => { duplicateFile(file.id); ping('duplicated'); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5">duplicate</button>
                          <select value={file.folder} onChange={(e) => moveFile(file.id, e.target.value)} className="text-xs px-2 py-1.5 rounded-full bg-white/5 border-0 outline-none">
                            {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <a href={file.dataUrl} download={file.name} onClick={() => bumpDownload(file.id)} className="text-xs px-3 py-1.5 rounded-full bg-white/5">download</a>
                          <button onClick={() => { removeFile(file.id); ping('sent to trash'); }} className="text-xs px-3 py-1.5 rounded-full text-red-400">delete</button>
                        </>
                      )}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {!shown.length && (
              <p className="text-center text-neutral-600 text-sm mt-10">{showTrash ? 'trash is empty' : 'nothing in this view yet'}</p>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4" onClick={() => setPreview(null)}>
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] max-w-2xl w-full max-h-[88vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-[#0a84ff] mb-1">preview</p>
                  <h3 className="text-lg font-medium text-white">{preview.name}</h3>
                  <p className="text-xs text-neutral-500">{formatBytes(preview.size)} · {preview.type || 'file'}</p>
                </div>
                <button onClick={() => setPreview(null)} className="text-sm px-3 py-1.5 rounded-full bg-white/5">close</button>
              </div>
              {preview.type.startsWith('image/') && <img src={preview.dataUrl} alt="" className="w-full rounded-2xl mb-4" />}
              {preview.type.startsWith('video/') && <video src={preview.dataUrl} controls className="w-full rounded-2xl mb-4" />}
              {preview.type.startsWith('audio/') && <audio src={preview.dataUrl} controls className="w-full mb-4" />}
              {(preview.type.startsWith('text/') || preview.type.includes('json')) && (
                <pre className="text-xs text-neutral-300 bg-black/30 rounded-2xl p-3 overflow-auto max-h-56 mb-4 whitespace-pre-wrap">{textPreview(preview)}</pre>
              )}
              <textarea defaultValue={preview.note} onBlur={(e) => setNote(preview.id, e.target.value)} placeholder="note" className="w-full bg-white/5 rounded-2xl px-3 py-2 text-sm outline-none mb-3 min-h-[72px]" />
              <form onSubmit={(e) => { e.preventDefault(); setTags(preview.id, [...(preview.tags || []), tagDraft]); setTagDraft(''); }} className="flex gap-2 mb-3">
                <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="add tag" className="flex-1 bg-white/5 rounded-full px-3 py-1.5 text-xs outline-none" />
                <button className="text-xs px-3 py-1.5 rounded-full bg-white text-black">tag</button>
              </form>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs text-neutral-500">expire public link</span>
                {[1, 6, 24, 72].map((h) => (
                  <button key={h} onClick={() => { setExpiry(preview.id, h); ping('expiry set'); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5">{h}h</button>
                ))}
                <button onClick={() => { setExpiry(preview.id, null); ping('no expiry'); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5">never</button>
              </div>
              <a href={preview.dataUrl} download={preview.name} onClick={() => bumpDownload(preview.id)} className="inline-flex text-sm px-4 py-2 rounded-full bg-white text-black font-medium">download</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] glass rounded-full px-4 py-2 text-sm text-white">{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
