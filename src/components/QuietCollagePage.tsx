import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Piece = {
  file: File;
  url: string;
  id: string;
};

export default function QuietCollagePage() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'row' | 'column'>('grid');
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 30_000_000 ? 'Large images — composition may feel slower. No hard limits.' : null);
    const next: Piece[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      url: URL.createObjectURL(file),
    }));
    setPieces((p) => [...p, ...next]);
  }, []);

  const compose = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !pieces.length) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgs = await Promise.all(
      pieces.map(
        (p) =>
          new Promise<HTMLImageElement>((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = p.url;
          })
      )
    );

    const cols = layout === 'row' ? imgs.length : layout === 'column' ? 1 : Math.ceil(Math.sqrt(imgs.length));
    const rows = layout === 'column' ? imgs.length : layout === 'row' ? 1 : Math.ceil(imgs.length / cols);
    const cell = 480;
    canvas.width = cols * cell;
    canvas.height = rows * cell;
    ctx.fillStyle = '#0b0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    imgs.forEach((img, i) => {
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      const scale = Math.max(cell / img.width, cell / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, x + (cell - w) / 2, y + (cell - h) / 2, w, h);
    });

    return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png', 0.92));
  };

  const publish = async () => {
    if (!pieces.length || busy) return;
    setBusy(true);
    setLink(null);
    try {
      const blob = await compose();
      if (!blob) throw new Error('could not compose');
      const file = new File([blob], `collage-${Date.now()}.png`, { type: 'image/png' });
      const res = await publishLocalFile(file, {
        caption: caption.trim() || 'quiet collage',
        color: accent,
        cardTitle: caption.trim() || 'Quiet Collage',
        meta: { desk: 'quietcollage', pieces: pieces.length, layout },
      });
      if (res.ok && res.embed) {
        setLink(res.embed);
        try { await navigator.clipboard.writeText(res.embed); } catch {}
      } else {
        setWarn(res.error || 'publish failed');
      }
    } catch (e: any) {
      setWarn(e.message || 'compose failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Collage</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Compose a quiet collage.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several images. They settle into a single frosted composition. Choose a layout, give it a caption, and publish. The result lands in the database with a polished Discord embed on every link. Soft size warnings only — never hard limits. Apple-style spring motion on frosted glass.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-14 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop images here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <div className="flex gap-2 mb-5">
            {(['grid', 'row', 'column'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  layout === l ? 'bg-white text-black' : 'bg-white/10 text-neutral-300 hover:bg-white/15'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {pieces.length > 0 && (
              <motion.div layout className="grid grid-cols-3 gap-2 mb-6">
                {pieces.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative aspect-square rounded-xl overflow-hidden"
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPieces((prev) => prev.filter((x) => x.id !== p.id))}
                      className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded-full w-5 h-5 grid place-items-center"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <canvas ref={canvasRef} className="hidden" />

          {link && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
              <p className="text-sm text-neutral-400 mb-1">shared · copied</p>
              <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !pieces.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Composing & publishing…' : pieces.length ? `Publish collage of ${pieces.length}` : 'Drop images first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
