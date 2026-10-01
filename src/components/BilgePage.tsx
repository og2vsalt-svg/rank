import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function BilgePage() {
  const [title, setTitle] = useState('note');
  const [body, setBody] = useState('');
  const [hours, setHours] = useState('0');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [id, setId] = useState('');

  const words = useMemo(() => body.trim().split(/\s+/).filter(Boolean).length, [body]);
  const urls = id ? shareUrls(id) : null;

  const pour = async () => {
    setErr('');
    setWarn(null);
    if (!body.trim()) {
      setErr('write something first');
      return;
    }
    setBusy(true);
    const name = (title.trim() || 'note').replace(/[^\w.\- ]+/g, '').slice(0, 80) || 'note';
    const text = `# ${name}\n\n${body.trim()}\n`;
    const file = new File([text], `${name}.txt`, { type: 'text/plain' });
    const h = Number(hours) || 0;
    const expiresAt = h > 0 ? new Date(Date.now() + h * 3600_000).toISOString() : null;
    const res = await publishLocalFile(file, { caption: body.trim().slice(0, 180), expiresAt });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not land the note');
      return;
    }
    setId(res.id);
    setWarn(res.warn || null);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">bilge</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">pour a note into the share db</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            This is not a vault drawer. The text becomes a public .txt row, and Discord unfurls the /s card.
          </p>
        </motion.div>
        <div className="mt-8 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="glass w-full rounded-2xl px-4 py-3 text-[14px] outline-none" placeholder="title" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="glass w-full rounded-3xl px-4 py-3 text-[14px] leading-relaxed outline-none" placeholder="the note" />
          <label className="flex items-center justify-between text-[13px] text-white/55">
            fade after hours
            <input value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d]/g, ''))} className="glass w-20 rounded-xl px-3 py-2 text-right text-white outline-none" />
          </label>
          <p className="text-[12px] text-white/40">{words} words · 0 keeps it until you stop linking it</p>
          <button onClick={pour} disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-transform active:scale-[0.98] disabled:opacity-60">
            {busy ? 'pouring…' : 'pour'}
          </button>
          {err && <p className="text-[13px] text-red-300">{err}</p>}
          {warn && <p className="text-[13px] text-amber-200">{warn}</p>}
          {urls && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5">
              <p className="text-[13px] text-white/50">discord card</p>
              <p className="mt-1 break-all text-[14px]">{urls.embed}</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
