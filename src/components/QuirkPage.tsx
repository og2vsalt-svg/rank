import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Row = { id: string; oddity: string; accent?: string | null; share_id?: string | null };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function QuirkPage() {
  const { shareId, navigate } = useRouter();
  const [oddity, setOddity] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. sending may feel slow. there is no size cap.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/quirks?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setError('could not open that quirk'));
  }, [shareId]);

  async function pin() {
    if (!oddity.trim()) { setError('write the oddity'); return; }
    setBusy(true); setError('');
    let share_id: string | null = null;
    if (file) {
      const sent = await publishLocalFile(file, { caption: oddity.trim(), color: accent, cardTitle: oddity.trim().slice(0, 80) });
      if (!sent.ok || !sent.id) { setBusy(false); setError(sent.error || 'the file did not land'); return; }
      share_id = sent.id;
    }
    const id = uid();
    const body = { id, oddity: oddity.trim(), accent, share_id };
    const ins = await fetch(`${SB_URL}/rest/v1/quirks`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    setBusy(false);
    if (!ins.ok) { setError('the quirk did not save'); return; }
    const saved = await ins.json();
    setRow(Array.isArray(saved) ? saved[0] : body);
    navigate('quirk', id);
  }

  const link = row ? `${location.origin}/quirk/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] uppercase tracking-[0.18em] text-white/40">a small oddity</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Quirk</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A short note with a colour. A local file is optional, and if you add one it lands in the share table. Not a vault. Large files are warned, never refused.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <span className="inline-block h-2 w-10 rounded-full" style={{ background: row.accent || '#64D2FF' }} />
            <p className="mt-4 text-2xl font-medium tracking-tight">{row.oddity}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200">{copied ? 'copied' : 'copy quirk link'}</button>
              {row.share_id && <a href={`/s/${row.share_id}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">open the file</a>}
            </div>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); pin(); }} className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <textarea value={oddity} onChange={(e) => setOddity(e.target.value.slice(0, 400))} placeholder="the small odd thing" rows={3} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30" />
            <label className="flex items-center gap-3 text-sm text-white/60">accent <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-8 w-10 bg-transparent" /></label>
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/55 hover:border-white/30">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? `${file.name} · ${pretty(file.size)}` : 'optional local file'}
            </label>
            {slow && <p className="text-xs text-amber-200/90">{slow}</p>}
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50">{busy ? 'pinning…' : 'pin the quirk'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
