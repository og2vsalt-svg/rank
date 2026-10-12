import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const ACCENTS = [
  { id: 'amber', hex: '#FF9F0A', label: 'amber' },
  { id: 'blue', hex: '#0A84FF', label: 'blue' },
  { id: 'purple', hex: '#BF5AF2', label: 'purple' },
  { id: 'green', hex: '#30D158', label: 'green' },
];

export default function SolsticePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'large file. the browser may slow while sending. no hard limit — just a heads-up.' : '');
  };

  const publish = async () => {
    if (!file) {
      setErr('drop a file first');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || `solstice · ${accent.label}`,
        color: accent.hex,
        cardTitle: file.name,
        meta: { desk: 'solstice', accent: accent.id, note: note.trim() || null },
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <motion.div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: accent.hex }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent.hex }}>solstice</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet turning for one file.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop a local file under a soft solstice glow. Pick an accent, add a short note if you like. It lands in storage and the share table. Every link receives a polished Discord embed. Large files get a gentle warning only.
          </p>
          <div className="flex gap-2 mb-4">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a)}
                className={`w-8 h-8 rounded-full transition ring-2 ${accent.id === a.id ? 'ring-white' : 'ring-transparent hover:ring-white/30'}`}
                style={{ background: a.hex }}
                aria-label={a.label}
              />
            ))}
          </div>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional caption"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional longer note"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-sm text-neutral-300">{file ? file.name : 'drop or click for a file'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || !file}
            className="w-full py-3 rounded-full text-black text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: accent.hex }}
          >
            {busy ? 'turning…' : 'publish solstice'}
          </motion.button>
          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 break-all">
              copied share link: {link}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
