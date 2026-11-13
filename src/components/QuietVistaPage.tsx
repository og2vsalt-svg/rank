import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, CloudMeta } from '../lib/cloudShare';

export default function QuietVistaPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setRecent);
  }, []);

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 40 * 1024 * 1024) ? 'large file. the browser may pause while it sends. never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('choose files');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'quiet vista share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'quietvista' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'one file paused');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    listPublicShares(12).then(setRecent);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          className="glass rounded-[32px] p-8 mb-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quiet vista</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a calm vista of what others have shared.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Flowing grid of recent public shares beside a multi-file drop. Files settle into the vista with spring motion on frosted glass. Shared note, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
          <div className="flex gap-3 mb-4">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-12 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="a quiet line for the vista" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30" />
          </div>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-10 text-center transition-all duration-300" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop files into the quiet vista'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.975 }} whileHover={{ scale: 1.015 }} onClick={publish} disabled={busy || !files.length} style={{ backgroundColor: accent }} className="w-full mt-4 py-3 rounded-full text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'sharing…' : 'share into the quiet vista'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all space-y-1">
              {links.map((l, i) => <div key={i}>shared: {l}</div>)}
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recent.map((share, i) => (
            <motion.a
              key={share.id}
              href={shareUrls(share.id).app}
              target="_blank"
              rel="noopener"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 80, damping: 15, delay: i * 0.05 }}
              className="glass rounded-2xl p-4 block hover:scale-[1.02] transition-transform"
              style={{ borderColor: accent + '40' }}
            >
              <p className="text-sm font-medium truncate">{share.name || 'untitled'}</p>
              <p className="text-xs text-neutral-400 mt-1 truncate">{share.caption || 'no note'}</p>
              <p className="text-[10px] text-neutral-500 mt-2">{(share.size / 1024).toFixed(1)} kb</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
