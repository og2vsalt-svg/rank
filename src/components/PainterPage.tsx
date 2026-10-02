import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SWATCHES = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2', '#64D2FF', '#F5F5F7'];

export default function PainterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 24 * 1024 * 1024 ? 'big still. the send may feel slow. nothing is refused.' : '');
    const result = await publishLocalFile(file, { caption, color, author: 'painter' });
    setBusy(false);
    if (!result.ok || !result.id) {
      setErr(result.error || 'could not write the share row');
      return;
    }
    if (result.warn) setWarn(result.warn);
    const urls = shareUrls(result.id);
    setCard(urls.embed);
    try { await navigator.clipboard.writeText(urls.embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-6 sm:p-8">
          <p className="text-[13px] text-[#0a84ff] mb-2">painter</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a card colour, then the file.</h1>
          <p className="text-neutral-400 text-sm mb-6 max-w-lg">pick a local file, write the line Discord should show, and stamp a colour. the bytes land in the share table. no size lock.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 hover:border-white/30 transition p-6 cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] || null); }}>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-sm text-white">{file ? file.name : 'drop a local file, or click to choose'}</p>
            <p className="text-xs text-neutral-500 mt-1">{file ? `${Math.round(file.size / 1024)} KB` : 'images unfurl with the picture on /s'}</p>
          </label>
          {preview && file?.type.startsWith('image/') && (
            <img src={preview} alt="" className="mt-4 max-h-48 rounded-2xl object-cover" />
          )}
          <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 180))} placeholder="line on the discord card" className="mt-4 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          <div className="flex gap-2 mt-4">
            {SWATCHES.map((sw) => (
              <button key={sw} type="button" onClick={() => setColor(sw)} className="w-8 h-8 rounded-full border transition" style={{ background: sw, borderColor: color === sw ? '#fff' : 'transparent', transform: color === sw ? 'scale(1.08)' : undefined }} aria-label={sw} />
            ))}
          </div>
          <button disabled={!file || busy} onClick={send} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'filing…' : 'file it'}</button>
          {warn && <p className="text-xs text-amber-200/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-300 mt-4 break-all">discord link copied: {card}</p>}
        </motion.div>
      </div>
    </div>
  );
}
