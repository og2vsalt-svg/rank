import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SkegPage() {
  const [name, setName] = useState('still.png');
  const [soft, setSoft] = useState(8);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');

  async function onPick(file: File) {
    setWarn(file.size > 18 * 1024 * 1024 ? 'large still. the canvas may feel slow. it is not refused.' : '');
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.filter = `blur(${soft}px)`;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    const inset = Math.round(Math.min(canvas.width, canvas.height) * 0.08);
    ctx.drawImage(bmp, inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
    setPreview(canvas.toDataURL('image/png'));
    setName(file.name.replace(/\.[^.]+$/, '') + '-skeg.png');
    setCard('');
  }

  async function fileIt() {
    if (!preview) return;
    setBusy(true);
    const blob = await (await fetch(preview)).blob();
    const file = new File([blob], name, { type: 'image/png' });
    const res = await publishLocalFile(file, { cardTitle: name, caption: 'skeg still', author: 'skeg', color: '#5AC8FA' });
    setBusy(false);
    if (!res.ok || !res.id) {
      setNote(res.error || 'share table missed it');
      return;
    }
    setCard(res.embed || shareUrls(res.id).embed);
    setNote('filed. image cards unfurl with the picture.');
    if (res.warn) setWarn(res.warn);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">skeg</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">A still, softened.</motion.h1>
        <p className="mt-3 text-zinc-400">A local image gets a soft edge in the tab. Filing writes the PNG into the share database. Discord shows the picture.</p>
        <div className="mt-8 space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <label className="block text-xs text-zinc-500">soft edge {soft}px
            <input type="range" min={0} max={24} value={soft} onChange={(e) => setSoft(Number(e.target.value))} className="mt-2 w-full" />
          </label>
          <label className="flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-black/20">
            {preview ? <img src={preview} alt="softened still" className="max-h-72 w-full object-contain" /> : <span className="text-sm text-zinc-500">drop a local image</span>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
          </label>
          {warn && <p className="text-xs text-amber-200/80">{warn}</p>}
          <button onClick={fileIt} disabled={!preview || busy} className="w-full rounded-full bg-white py-3 text-sm font-medium text-black disabled:opacity-50">{busy ? 'filing…' : 'file the still'}</button>
          {note && <p className="text-sm text-zinc-400">{note}</p>}
          {card && <button onClick={() => navigator.clipboard.writeText(card)} className="w-full text-left text-xs text-[#9ecbff]">{card}</button>}
        </div>
      </main>
    </div>
  );
}
