import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Swatch = { hex: string; weight: number };

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function samplePalette(file: File): Promise<Swatch[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const side = 48;
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, side, side);
      const data = ctx.getImageData(0, 0, side, side).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i] >> 4 << 4;
        const g = data[i + 1] >> 4 << 4;
        const b = data[i + 2] >> 4 << 4;
        const a = data[i + 3];
        if (a < 40) continue;
        const hex = rgbToHex(r, g, b);
        buckets.set(hex, (buckets.get(hex) || 0) + 1);
      }
      URL.revokeObjectURL(url);
      const swatches = [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([hex, weight]) => ({ hex, weight }));
      resolve(swatches);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('that file did not open as an image'));
    };
    img.src = url;
  });
}

export default function ThrumPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');
  const [copied, setCopied] = useState(false);

  const sizeLabel = useMemo(() => {
    if (!file) return '';
    const mb = file.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }, [file]);

  const onPick = async (next: File | null) => {
    setFile(next);
    setCard('');
    setError('');
    setSwatches([]);
    if (preview) URL.revokeObjectURL(preview);
    if (!next) {
      setPreview('');
      return;
    }
    setPreview(URL.createObjectURL(next));
    if (next.size > 24 * 1024 * 1024) setWarn('heavy image. sampling stays local, but sending the original may pause the tab.');
    else setWarn(null);
    try {
      setSwatches(await samplePalette(next));
    } catch (err: any) {
      setError(err?.message || 'could not read colours');
    }
  };

  const filePalette = async () => {
    if (!file || swatches.length === 0) return;
    setBusy(true);
    setError('');
    const payload = {
      source: file.name,
      note: note.trim(),
      swatches,
      filedAt: new Date().toISOString(),
    };
    const blob = new File([JSON.stringify(payload, null, 2)], `${file.name.replace(/\.[^.]+$/, '') || 'palette'}.palette.json`, {
      type: 'application/json',
    });
    const accent = swatches[0]?.hex;
    const res = await publishLocalFile(blob, {
      caption: note.trim() || `palette from ${file.name}`,
      color: /^#[0-9a-fA-F]{6}$/.test(accent || '') ? accent : '#0A84FF',
      author: 'thrum',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'the palette did not file');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
    setWarn(res.warn || warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">thrum</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">colours, then a file</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Drop a picture from this machine. The swatches are read here, in the tab. Filing writes a small palette file into the share table so Discord can unfurl the card.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="glass mt-8 rounded-3xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/25 text-center transition hover:border-white/30">
            {preview ? (
              <img src={preview} alt="" className="max-h-56 w-full object-cover" />
            ) : (
              <span className="px-4 py-10 text-[15px] text-white">choose an image</span>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] || null)} />
          </label>
          {file && <p className="mt-2 text-[12px] text-white/40">{file.name} · {sizeLabel}</p>}
          {swatches.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {swatches.map((s) => (
                <button key={s.hex} onClick={() => navigator.clipboard.writeText(s.hex)} className="overflow-hidden rounded-2xl border border-white/10 text-left transition hover:scale-[1.02]">
                  <span className="block h-14" style={{ background: s.hex }} />
                  <span className="block px-2.5 py-2 text-[12px] text-white/70">{s.hex}</span>
                </button>
              ))}
            </div>
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what the colours are for" className="mt-4 w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <button onClick={filePalette} disabled={!file || swatches.length === 0 || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'filing…' : 'file the palette'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {card && (
            <div className="mt-4 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{card}</p>
              <button onClick={async () => { await navigator.clipboard.writeText(card); setCopied(true); }} className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white">{copied ? 'copied' : 'discord'}</button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
