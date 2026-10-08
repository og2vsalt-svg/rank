import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Pin = {
  id: string;
  place?: string | null;
  reading?: string | null;
  file_name?: string | null;
  mime?: string | null;
  size?: number;
  file_url?: string | null;
  author?: string | null;
  pretty?: string | null;
  warn?: string | null;
};

const SLOW = 8 * 1024 * 1024;
const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export default function KeystonePage() {
  const { shareId, navigate } = useRouter();
  const [place, setPlace] = useState('');
  const [reading, setReading] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Pin | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)} — this may open slowly. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    fetch(`/api/keystone?id=${encodeURIComponent(shareId)}`).then(async (res) => {
      if (!res.ok) { if (!stop) setError('that pin is not on the arch'); return; }
      const data = await res.json();
      if (!stop) setRow(data);
    }).catch(() => { if (!stop) setError('could not reach the pin'); });
    return () => { stop = true; };
  }, [shareId]);

  async function fileIt(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('choose a local file first'); return; }
    if (!place.trim()) { setError('name the place'); return; }
    setBusy(true); setError(''); setWarn(slow);
    try {
      const id = uid();
      const path = `${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const up = await fetch(`${SB_URL}/storage/v1/object/shares/${path}`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
        body: file,
      });
      if (!up.ok) {
        const text = await up.text();
        throw new Error(text.slice(0, 180) || 'storage did not take the file. it was not refused for size.');
      }
      const fileUrl = `${SB_URL}/storage/v1/object/public/shares/${path}`;
      const res = await fetch('/api/keystone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, place: place.trim(), reading, author, file_name: file.name, mime: file.type || 'application/octet-stream', size: file.size, file_url: fileUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not write the pin');
      if (data.warn) setWarn(data.warn);
      navigate('keystone', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'pin failed');
    } finally {
      setBusy(false);
    }
  }

  const link = typeof window !== 'undefined' && row ? `${window.location.origin}/keystone/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] font-medium tracking-wide text-[#6e6e73]">rankvault · keystone</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">A pin, not a drawer.</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">Name a place, leave a reading, and hang one local file under the arch. Bytes land in storage. The pin lands in the keystones table. Older desks stay.</p>
        {shareId && row ? (
          <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="mt-10 rounded-[28px] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
            <p className="text-xs uppercase tracking-[0.16em] text-[#86868b]">{row.author || 'unsigned'}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{row.place}</h2>
            {row.reading ? <p className="mt-3 text-[17px] leading-relaxed text-[#3a3a3c]">{row.reading}</p> : null}
            <p className="mt-4 text-sm text-[#6e6e73]">{row.file_name} · {row.pretty || pretty(row.size || 0)}{row.mime ? ` · ${row.mime}` : ''}</p>
            {row.warn || warn ? <p className="mt-3 rounded-2xl bg-[#fff6e5] px-4 py-3 text-sm text-[#8a5a00]">{row.warn || warn}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {row.file_url ? <a href={row.file_url} className="rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0077ed]">Open file</a> : null}
              <button type="button" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-full bg-[#f5f5f7] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition active:scale-[0.98]">{copied ? 'Copied' : 'Copy link'}</button>
              <button type="button" onClick={() => navigate('voussoir')} className="rounded-full px-4 py-2.5 text-sm text-[#0071e3]">See the arch</button>
            </div>
            <p className="mt-4 text-xs text-[#86868b]">Paste this link in Discord for the card.</p>
          </motion.article>
        ) : (
          <motion.form onSubmit={fileIt} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 26 }} className="mt-10 space-y-4 rounded-[28px] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
            <label className="block text-sm font-medium">Place<input value={place} onChange={(e) => setPlace(e.target.value)} className="mt-1 w-full rounded-2xl border border-black/5 bg-[#f5f5f7] px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#0071e3]/40" placeholder="north pier" /></label>
            <label className="block text-sm font-medium">Reading<input value={reading} onChange={(e) => setReading(e.target.value)} className="mt-1 w-full rounded-2xl border border-black/5 bg-[#f5f5f7] px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#0071e3]/40" placeholder="what the file is marking" /></label>
            <label className="block text-sm font-medium">Signed<input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl border border-black/5 bg-[#f5f5f7] px-4 py-3 outline-none transition focus:ring-2 focus:ring-[#0071e3]/40" placeholder="optional" /></label>
            <label className="block text-sm font-medium">Local file<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 w-full text-sm" /></label>
            {slow ? <p className="rounded-2xl bg-[#fff6e5] px-4 py-3 text-sm text-[#8a5a00]">{slow}</p> : null}
            {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
            {warn ? <p className="text-sm text-[#8a5a00]">{warn}</p> : null}
            <button disabled={busy} className="rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-medium text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-50">{busy ? 'Pinning…' : 'Set the keystone'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
