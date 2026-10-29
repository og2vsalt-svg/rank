import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftMosaicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#AF52DE');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<{url: string; name: string}[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the send may feel slow. no hard limit.' : '');
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const publish = async () => {
    if (files.length === 0) {
      setErr('drop at least one local file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: {url: string; name: string}[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || title || 'soft mosaic',
          cardTitle: title.trim() || file.name,
          color: accent,
          meta: { desk: 'softmosaic', caption: caption.trim(), title: title.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
        made.push({ url: shareUrls(res.id).app, name: file.name });
      }
      setLinks(made);
      if (made[0]) {
        try { await navigator.clipboard.writeText(made.map(m => m.url).join('\n')); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 17 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>softmosaic</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a soft mosaic of shared light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop several local files. Each becomes its own share in storage and the public table, arranged as a quiet mosaic lit with your accent and shared caption. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="optional shared title…" className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#AF52DE]/50 transition" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="optional shared caption…" rows={2} className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#AF52DE]/50 transition resize-none" />
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#AF52DE]/40 p-8 text-center transition mb-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files (up to sixteen)</p>
          </label>
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div key={f.name + i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-1">
                <span className="truncate max-w-[70%]">{f.name}</span>
                <button type="button" onClick={() => remove(i)} className="text-neutral-500 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>
          {warn && <p className="text-xs text-amber-300/80 mb-3 mt-2">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={busy || files.length === 0} className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition mt-2" style={{ background: accent }}>
            {busy ? 'mosaicing…' : 'publish mosaic'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {links.map((l) => (
                <motion.a key={l.url} href={l.url} target="_blank" rel="noreferrer" whileHover={{ y: -2 }} className="glass rounded-2xl p-3 text-xs text-neutral-300 break-all block">
                  {l.name}
                </motion.a>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
