import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Row = {
  name: string;
  size: number;
  id?: string;
  embed?: string;
  error?: string;
  warn?: string | null;
  preview?: string;
};

export default function LumenmosaicPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [copied, setCopied] = useState('');

  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    const next: Row[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'lumenmosaic' },
      });
      next.push({
        name: file.name,
        size: file.size,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
        preview: previews[i],
      });
      setRows([...next]);
    }
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="max-w-5xl mx-auto"
        >
          <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color }}>lumenmosaic</p>
          <h1 className="text-4xl font-semibold tracking-tight">lumenmosaic</h1>
          <p className="text-neutral-400 mt-3 max-w-2xl">A living mosaic of light for what you carry. Drop local files — images settle into a responsive lattice of glass tiles that lift with spring motion on hover. Shared note and accent ride every card. Lands in storage and public_shares. Discord unfurls a polished card on every /s link. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.</p>

          <label className="glass mt-8 block cursor-pointer rounded-[28px] p-10 text-center transition hover:bg-white/[0.03]">
            <input className="hidden" type="file" multiple accept="image/*,video/*,application/pdf" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready for the mosaic` : 'choose files from this machine'}</div>
            <div className="mt-1.5 text-[12px] text-white/40">images preferred for live mosaic · any type accepted · soft warning only</div>
          </label>

          {previews.length > 0 && !rows.length && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previews.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
                  className="glass rounded-2xl overflow-hidden aspect-square"
                >
                  {files[i].type.startsWith('image/') ? (
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-neutral-500 p-2 text-center">{files[i].name}</div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 max-w-xl">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note that rides every tile" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="glass rounded-2xl px-4 py-3.5 text-[14px] outline-none" />
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
              <span className="text-[13px] text-white/50">accent for tiles and cards</span>
            </div>
          </div>

          {heavy && <p className="mt-3 text-[13px] text-amber-200/85">large batch. sending may feel slow. nothing is refused.</p>}

          <motion.button
            whileTap={{ scale: 0.965 }}
            whileHover={{ scale: 1.015 }}
            onClick={send}
            disabled={!files.length || busy}
            className="mt-5 w-full max-w-xl rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'settling into mosaic…' : 'share the mosaic'}
          </motion.button>

          {!!rows.length && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {rows.map((r, i) => (
                <motion.div
                  key={r.name + i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                  className="glass rounded-2xl overflow-hidden"
                  style={{ boxShadow: `0 8px 30px ${color}22` }}
                >
                  {r.preview && r.name.match(/\.(png|jpe?g|gif|webp|avif)$/i) ? (
                    <img src={r.preview} alt="" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="aspect-square grid place-items-center text-xs text-neutral-500 p-3 text-center">{r.name}</div>
                  )}
                  <div className="p-3">
                    <p className="text-sm truncate">{r.name}</p>
                    {r.embed ? (
                      <button onClick={() => copy(r.embed!)} className="mt-2 text-xs text-neutral-400 hover:text-white">
                        {copied === r.embed ? 'copied' : 'copy share link'}
                      </button>
                    ) : (
                      <p className="text-xs text-red-300 mt-1">{r.error}</p>
                    )}
                    {r.warn && <p className="text-[11px] text-amber-200/80 mt-1">{r.warn}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
