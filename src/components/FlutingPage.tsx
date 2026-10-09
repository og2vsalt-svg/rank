import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile, publishShare, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FlutingPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [grooves, setGrooves] = useState(['', '', '']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<CloudMeta | null>(null);
  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'these grooves are carrying a large file. the tab may feel slow. nothing is refused for size.' : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetchShare(shareId).then(setRow).catch(() => setRow(null));
  }, [shareId]);

  const cut = async () => {
    const lines = grooves.map((g) => g.trim()).filter(Boolean);
    if (lines.length < 3) return;
    setBusy(true);
    setErr('');
    const caption = lines.join(' · ');
    if (file) {
      const published = await publishLocalFile(file, { caption, author: 'fluting', color: '#FFD60A', cardTitle: `${lines[0]} — fluting`, meta: { kind: 'fluting', grooves: lines } });
      setBusy(false);
      if (!published.ok || !published.id) { setErr(published.error || 'could not cut those grooves'); return; }
      setRow(published.meta || null);
      setLink(`${location.origin}/fluting/${published.id}`);
      setWarn(published.warn || slow || '');
      history.pushState(null, '', `/fluting/${published.id}`);
      return;
    }
    const id = `flute${Date.now().toString(36)}`;
    const saved = await publishShare({ id, name: `${lines[0]} — fluting`, type: 'text/plain', size: caption.length, dataUrl: `data:text/plain,${encodeURIComponent(caption)}`, author: 'fluting', caption });
    setBusy(false);
    if (!saved.ok || !saved.id) { setErr(saved.error || 'could not file the grooves'); return; }
    setLink(`${location.origin}/fluting/${saved.id}`);
    setWarn(saved.warn || '');
    history.pushState(null, '', `/fluting/${saved.id}`);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">three grooves</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Fluting</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Cut three lines. Attach a local file if you want. The bytes land in the share table and the grooves travel with the card. Paste /fluting/id in Discord. Large drops are warned, never refused. Not a drawer. Older desks stay.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          {grooves.map((groove, i) => (
            <input key={i} value={groove} onChange={(e) => setGrooves((prev) => prev.map((item, idx) => (idx === i ? e.target.value : item)))} placeholder={`groove ${i + 1}`} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#ffd60a] first:mt-0" />
          ))}
          <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center transition duration-200 hover:border-[#ffd60a]/70">
            <span className="text-sm text-white/80">{file ? file.name : 'optional file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <button disabled={grooves.some((g) => !g.trim()) || busy} onClick={cut} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'cutting…' : 'cut the grooves'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#ffe8a3]">{link} — copied on click</button>}
        </motion.div>
        {row && (
          <motion.article layout className="mt-6 rounded-3xl border border-[#ffd60a]/30 bg-white/[0.04] p-5">
            <h2 className="text-2xl font-semibold tracking-tight">{row.cardTitle || row.name}</h2>
            <p className="mt-2 text-sm text-white/60">{row.caption}</p>
            {row.url && !row.url.startsWith('data:') && <a href={row.url} className="mt-3 inline-block text-sm text-[#ffe8a3]">download {row.name}</a>}
          </motion.article>
        )}
      </main>
    </div>
  );
}
