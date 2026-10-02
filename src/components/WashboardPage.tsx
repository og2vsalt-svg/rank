import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

const ACCENTS = ['#0A84FF', '#64D2FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2'];

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function WashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const sizeLabel = useMemo(() => (file ? pretty(file.size) : ''), [file]);

  const loadRecent = async () => {
    const rows = await listPublicShares(12);
    setRecent(rows.filter((row) => (row.author || '').toLowerCase() === 'washboard').slice(0, 6));
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const take = (next: File | null) => {
    setErr('');
    setCard('');
    setFile(next);
    if (!next) return;
    setWarn(next.size > 18 * 1024 * 1024 ? 'large local file. the send may feel slow. nothing is refused.' : '');
  };

  const fileIt = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const result = await publishLocalFile(file, {
        caption: caption || `${file.type || 'file'} · ${sizeLabel}`,
        cardTitle: file.name,
        color,
        author: 'washboard',
      });
      if (!result.ok || !result.id) {
        setErr(result.error || 'the share table did not take it');
        return;
      }
      const urls = shareUrls(result.id);
      setCard(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (result.warn) setWarn(result.warn);
      await loadRecent();
    } catch (e: any) {
      setErr(e?.message || 'file failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">washboard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rinse a local file into the share table.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a cabinet. the bytes leave this tab, land in the share database, and Discord gets a card with the accent you pick. older desks stay where they are.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files?.[0] || null); }}
          >
            <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. a warning only if the send may feel slow.</p>
          </label>
          {file && (
            <div className="mt-6 space-y-3 text-sm">
              <p className="text-neutral-300">{sizeLabel} · {file.type || 'unknown type'}</p>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="line Discord should show" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
              <div className="flex gap-2">
                {ACCENTS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} className="h-8 w-8 rounded-full border transition" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} />
                ))}
              </div>
              <button onClick={fileIt} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file into the share table'}</button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied: {card}</p>}
        </motion.div>
        {recent.length > 0 && (
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mt-4 space-y-2">
            {recent.map((row) => (
              <li key={row.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500">{pretty(row.size)}</p>
                </div>
                <a href={shareUrls(row.id).embed} className="text-xs text-[#0a84ff] shrink-0">card</a>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
