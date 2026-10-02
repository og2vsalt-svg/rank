import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function FashionPage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState('rankvault');
  const [subtitle, setSubtitle] = useState('a quiet file, ready to open');
  const [color, setColor] = useState('#0A84FF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [coverId, setCoverId] = useState('');
  const [fileId, setFileId] = useState('');
  const [copied, setCopied] = useState('');

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? 'large companion file. the tab may feel slow while it sends. nothing is refused.' : null), [file]);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const ctx = node.getContext('2d');
    if (!ctx) return;
    node.width = 1200;
    node.height = 630;
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, 1200, 630);
    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#070709');
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f5f5f7';
    ctx.font = '600 72px Inter, system-ui, sans-serif';
    ctx.fillText(title.slice(0, 42) || 'rankvault', 72, 300);
    ctx.fillStyle = 'rgba(245,245,247,0.62)';
    ctx.font = '400 32px Inter, system-ui, sans-serif';
    wrap(ctx, subtitle || 'filed from fashion', 72, 370, 1000, 42);
    ctx.fillStyle = color;
    ctx.fillRect(72, 230, 84, 8);
  }, [title, subtitle, color]);

  const send = async () => {
    const node = canvas.current;
    if (!node) return;
    setBusy(true);
    setErr('');
    setCoverId('');
    setFileId('');
    const blob = await new Promise<Blob | null>((resolve) => node.toBlob(resolve, 'image/png'));
    if (!blob) {
      setBusy(false);
      setErr('could not paint the cover');
      return;
    }
    const cover = new File([blob], 'fashion-cover.png', { type: 'image/png' });
    const coverRes = await publishLocalFile(cover, {
      cardTitle: title.trim() || 'fashion cover',
      caption: subtitle.trim() || 'cover card',
      author: 'fashion',
      color,
    });
    if (!coverRes.ok || !coverRes.id) {
      setBusy(false);
      setErr(coverRes.error || 'the share table did not take the cover');
      return;
    }
    setCoverId(coverRes.id);
    if (file) {
      const fileRes = await publishLocalFile(file, {
        cardTitle: file.name,
        caption: subtitle.trim() || undefined,
        author: 'fashion',
        color,
      });
      if (!fileRes.ok || !fileRes.id) {
        setBusy(false);
        setErr(fileRes.error || 'cover landed, companion file did not');
        return;
      }
      setFileId(fileRes.id);
    }
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">card desk</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">fashion</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            Paint a 1200×630 cover in the tab and file the PNG so Discord unfurls a real image. An optional local file can ride along as its own share-table row.
          </p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="glass mt-8 rounded-3xl p-5 sm:p-6">
          <canvas ref={canvas} className="w-full rounded-2xl bg-black border border-white/10" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="cover title" className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="line under the title" className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25" />
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="cover accent" className="h-10 w-14 rounded-xl bg-transparent border border-white/10" />
            <span className="text-xs text-white/45">accent</span>
          </div>
          <label className="mt-4 block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center cursor-pointer">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-200">{file ? file.name : 'optional companion file'}</span>
          </label>
          {slow && <p className="mt-3 text-sm text-amber-200/90">{slow}</p>}
          <button onClick={send} disabled={busy} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'filing…' : 'file the cover'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {coverId && <button onClick={() => copy(shareUrls(coverId).embed)} className="mt-3 w-full text-left rounded-2xl bg-white/5 px-3.5 py-2.5 border border-white/10 text-sm">{copied === shareUrls(coverId).embed ? 'copied cover' : shareUrls(coverId).embed}</button>}
          {fileId && <button onClick={() => copy(shareUrls(fileId).embed)} className="mt-2 w-full text-left rounded-2xl bg-white/5 px-3.5 py-2.5 border border-white/10 text-sm">{copied === shareUrls(fileId).embed ? 'copied file' : shareUrls(fileId).embed}</button>}
        </motion.section>
      </main>
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line: number) {
  const words = text.split(' ');
  let row = '';
  let yy = y;
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > max) {
      ctx.fillText(row, x, yy);
      row = word;
      yy += line;
    } else row = next;
  }
  if (row) ctx.fillText(row, x, yy);
}
