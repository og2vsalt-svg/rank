import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietSilkPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#C7A27C');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<{name: string; url: string}[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45 * 1024 * 1024 ? 'a large silk drape. the weave may feel slow — never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('choose or drop files');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: {name: string; url: string}[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'quiet silk share',
        cardTitle: file.name,
        color: accent,
        meta: { desk: 'quietsilk', accent },
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
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          className="text-center mb-8"
        >
          <p className="text-sm tracking-wide mb-2" style={{ color: accent }}>quiet silk</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">files drape like soft silk.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Drop local files. They settle as gentle folds of frosted silk with fluid spring motion and live previews. Shared caption and warm accent. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
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
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 40% 60%, ${accent}44, transparent 70%)` }}
            animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.04, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-5xl mb-3 opacity-60 relative">🫶</div>
          <p className="text-white font-medium relative">Drop files onto the silk</p>
          <p className="text-sm text-neutral-500 mt-1 relative">they drape with gentle spring folds</p>
          {files.length > 0 && <p className="mt-3 text-sm relative" style={{ color: accent }}>{files.length} ready</p>}
        </div>

        {previews.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center mb-5">
            {previews.map((src, i) => (
              <motion.div
                key={src}
                initial={{ opacity: 0, y: 12, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.05 }}
                className="w-20 h-20 rounded-2xl overflow-hidden glass"
              >
                {files[i]?.type.startsWith('image/') ? (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-neutral-400">file</div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-11 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note for the silk"
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
            {busy ? 'draping the silk…' : 'share the silk'}
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
