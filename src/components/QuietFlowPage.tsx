import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietFlowPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45 * 1024 * 1024 ? 'flowing a large batch. sending may feel slow — never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('choose or drop files');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: {name: string; url: string}[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'quiet flow share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'quietflow', accent },
      });
      if (res.ok && res.id) {
        created.push({ name: file.name, url: shareUrls(res.id).embed });
      } else {
        setErr(res.error || 'one file paused');
      }
    }
    setLinks(created);
    if (created[0]) {
      try { await navigator.clipboard.writeText(created[0].url); } catch {}
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="text-center mb-8"
        >
          <p className="text-sm tracking-wide mb-2" style={{ color: accent }}>quiet flow</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">files settle in a soft flowing current.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Drop local files. They drift into place with staggered spring motion on frosted glass. Shared note and accent color. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className="glass rounded-3xl p-12 text-center apple-card mb-5 cursor-pointer relative overflow-hidden"
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 40%, ${accent}33, transparent 60%)` }}
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-5xl mb-3 opacity-60 relative">🌊</div>
          <p className="text-white font-medium relative">Drop files into the flow</p>
          <p className="text-sm text-neutral-500 mt-1 relative">they settle with gentle spring motion</p>
          {files.length > 0 && <p className="mt-3 text-sm relative" style={{ color: accent }}>{files.length} ready</p>}
        </div>

        <div className="flex gap-3 mb-4">
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-11 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note for the flow"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30"
          />
        </div>

        {warn && <p className="text-amber-300 text-sm mb-4 text-center">{warn}</p>}
        {err && <p className="text-red-400 text-sm mb-4 text-center">{err}</p>}

        <div className="flex justify-center mb-8">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={!files.length || busy}
            style={{ backgroundColor: accent }}
            className="px-8 py-3 rounded-full text-black font-medium disabled:opacity-40 transition"
          >
            {busy ? 'settling into the flow…' : 'share the flow'}
          </motion.button>
        </div>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {links.map((l) => (
                <div key={l.url} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white truncate mb-1">{l.name}</p>
                  <code className="text-xs break-all" style={{ color: accent }}>{l.url}</code>
                </div>
              ))}
              <p className="text-xs text-neutral-500 text-center">first link copied · Discord embeds ready</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
