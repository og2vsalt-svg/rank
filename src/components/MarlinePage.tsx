import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function MarlinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [line, setLine] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [card, setCard] = useState('');

  const slow = useMemo(() => (file && file.size > 18 * 1024 * 1024 ? 'heavy still. drawing the caption may hitch. it will not be refused.' : null), [file]);

  const onFile = (f: File | null) => {
    setFile(f);
    setCard('');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (line.trim()) {
        const pad = 28;
        ctx.fillStyle = 'rgba(5,5,6,0.55)';
        ctx.fillRect(0, canvas.height - 84, canvas.width, 84);
        ctx.fillStyle = '#f5f5f7';
        ctx.font = '600 28px Inter, system-ui, sans-serif';
        ctx.fillText(line.trim().slice(0, 72), pad, canvas.height - 34);
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png');
      });
      const named = new File([blob], (file.name.replace(/\.[^.]+$/, '') || 'still') + '-marline.png', { type: 'image/png' });
      const res = await publishLocalFile(named, {
        caption: line.trim().slice(0, 180) || file.name,
        author: author.trim() || undefined,
        color: '#0A84FF',
      });
      setBusy(false);
      if (!res.ok) {
        setError(res.error || 'did not land');
        return;
      }
      setWarn(res.warn || slow);
      setCard(res.embed || '');
    } catch (err: any) {
      setBusy(false);
      setError(err?.message || 'could not draw the still');
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">marline</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">A caption on the still.</motion.h1>
        <p className="mt-3 max-w-xl text-zinc-400">Draw a line onto a local image in the tab, then file the composed PNG. Discord uses the picture on the card. This is a press, not a vault.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <input type="file" accept="image/*" className="block w-full text-sm text-zinc-400" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          {file && <p className="mt-2 text-sm text-zinc-500">{file.name} · {pretty(file.size)}{slow ? ` · ${slow}` : ''}</p>}
          {preview && <img src={preview} alt="" className="mt-4 max-h-72 w-full rounded-2xl object-contain bg-black/40" />}
          <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="line burned into the still" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="credit (optional)" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none focus:border-[#0A84FF]" />
          <button disabled={busy || !file} onClick={send} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40">{busy ? 'pressing…' : 'file the still'}</button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200">{warn}</p>}
          {card && <a className="mt-4 block text-sm text-[#7ab8ff] underline" href={card}>{card}</a>}
        </motion.div>
      </main>
    </div>
  );
}
