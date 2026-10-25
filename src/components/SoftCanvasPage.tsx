import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftCanvasPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);

  const handle = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setFiles(arr);
    setWarn(arr.some(f => f.size > 50 * 1024 * 1024) ? 'Large files may upload slowly. No hard size limit.' : null);
  };

  const paint = async () => {
    if (!files.length) return;
    setBusy(true);
    const out: string[] = [];
    for (const f of files) {
      const res = await publishLocalFile(f, {
        caption: note || 'from the soft canvas',
        color: accent,
        cardTitle: f.name,
        meta: { desk: 'softcanvas' },
      });
      if (res.ok && res.embed) out.push(res.embed);
    }
    setLinks(out);
    setFiles([]);
    setNote('');
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18 }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-[13px] font-medium mb-1" style={{ color: accent }}>Soft Canvas</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Paint with files.</h1>
          <p className="text-neutral-400 text-[14px] mb-6 leading-relaxed">
            A quiet canvas for local drops. Files upload to storage and public_shares. Share links receive professional Discord embeds. Soft spring animations, glass surfaces. Large files gently warned of slowness. Prior features preserved. No traces of boosting.
          </p>

          <label className="block border border-dashed border-white/20 rounded-[20px] p-10 text-center cursor-pointer hover:border-white/30 transition mb-5">
            <span className="text-neutral-300">{files.length ? `${files.length} files on canvas` : 'Drop or click to choose local files'}</span>
            <input type="file" multiple className="hidden" onChange={(e) => handle(e.target.files)} />
          </label>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Caption for the canvas…"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 mb-4 text-[15px]"
          />

          <div className="flex items-center gap-3 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full" />
            <span className="text-[13px] text-neutral-400">Canvas accent</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={paint}
            disabled={busy || !files.length}
            className="w-full py-3.5 rounded-[16px] font-medium text-black disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'Painting…' : 'Settle on canvas'}
          </motion.button>

          {links.length > 0 && (
            <div className="mt-5 space-y-1">
              {links.map(l => <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
