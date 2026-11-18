import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function extractPalette(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(['#0A84FF', '#64D2FF', '#FFFFFF']);
        return;
      }
      const size = 48;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const sorted = Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => {
          const [r, g, b] = k.split(',').map(Number);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });
      URL.revokeObjectURL(url);
      resolve(sorted.length ? sorted : ['#0A84FF', '#64D2FF']);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(['#0A84FF', '#64D2FF']);
    };
    img.src = url;
  });
}

export default function QuietPalettePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [palettes, setPalettes] = useState<Record<number, string[]>>({});
  const [captions, setCaptions] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; colors: string[]; caption: string }[]>([]);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) {
      setErr('only images for quiet palettes');
      return;
    }
    if (arr.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('large images — the browser may feel slow while it samples colors and sends. no hard limit.');
    } else {
      setWarn('');
    }
    setFiles((prev) => [...prev, ...arr]);
    setErr('');
    const newPalettes: Record<number, string[]> = {};
    for (let i = 0; i < arr.length; i++) {
      const palette = await extractPalette(arr[i]);
      newPalettes[files.length + i] = palette;
    }
    setPalettes((prev) => ({ ...prev, ...newPalettes }));
  }, [files.length]);

  const updateCaption = (idx: number, caption: string) => {
    setCaptions((prev) => ({ ...prev, [idx]: caption }));
  };

  const remove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPalettes((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    setCaptions((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const publishPalettes = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: typeof results = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const colors = palettes[i] || [];
        const caption = captions[i] || '';
        const accent = colors[0] || '#0A84FF';
        const res = await publishLocalFile(file, {
          caption: caption || undefined,
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'quietpalette', palette: colors, accent },
        });
        if (res.ok && res.id) {
          out.push({
            id: res.id,
            name: file.name,
            embed: shareUrls(res.id).embed,
            colors,
            caption,
          });
        } else {
          setErr(res.error || `failed on ${file.name}`);
        }
      }
      setResults(out);
      setFiles([]);
      setPalettes({});
      setCaptions({});
    } catch (e: any) {
      setErr(e?.message || 'palette failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <p className="text-[#64D2FF] text-sm font-medium mb-2 tracking-wide">quiet palette</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">draw color from the quiet.</h1>
          <p className="text-neutral-400 text-base mb-8 max-w-xl leading-relaxed">
            Drop local images. A soft client-side palette is sampled and shown. Each settles into the database with its colors and a polished Discord embed on every link. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <motion.label
            whileHover={{ y: -2 }}
            className="block cursor-pointer rounded-[28px] glass p-10 mb-6 border border-dashed border-white/15 hover:border-[#64D2FF]/40 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && onDrop(e.target.files)}
              disabled={busy}
            />
            <p className="text-white font-medium text-lg">{files.length ? `${files.length} image${files.length > 1 ? 's' : ''} ready` : 'drop images here'}</p>
            <p className="text-sm text-neutral-500 mt-2">each receives its own quiet palette</p>
          </motion.label>

          {warn && <p className="text-sm text-amber-300/90 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + f.size + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[11px] text-neutral-500">{pretty(f.size)}</p>
                  </div>
                  <button onClick={() => remove(i)} className="text-xs text-neutral-500 hover:text-white">remove</button>
                </div>
                {palettes[i] && (
                  <div className="flex gap-1.5 mb-3">
                    {palettes[i].map((c) => (
                      <div
                        key={c}
                        className="w-8 h-8 rounded-lg border border-white/10"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
                <textarea
                  value={captions[i] || ''}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="quiet caption for this palette…"
                  rows={2}
                  className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm outline-none border border-white/5 resize-none"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length > 0 && (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={publishPalettes}
              disabled={busy}
              className="w-full py-3.5 rounded-full bg-white text-black font-medium text-sm mt-4 disabled:opacity-50"
            >
              {busy ? 'settling palettes…' : `publish ${files.length} palette${files.length > 1 ? 's' : ''}`}
            </motion.button>
          )}

          {results.length > 0 && (
            <div className="mt-10 space-y-4">
              <h2 className="text-lg font-medium">your palettes</h2>
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-5"
                >
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.caption && <p className="text-xs text-neutral-400 mt-1">{r.caption}</p>}
                  <div className="flex gap-1.5 mt-3">
                    {r.colors.map((c) => (
                      <div
                        key={c}
                        className="w-6 h-6 rounded-md border border-white/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#64D2FF] mt-3 break-all">{r.embed}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.embed)}
                    className="mt-2 text-xs text-neutral-400 hover:text-white"
                  >
                    copy discord link
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <p className="mt-16 text-center text-xs text-neutral-600">all prior features preserved. this is simply another surface for colored shares.</p>
        </motion.div>
      </div>
    </div>
  );
}
