import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Haversack = {
  id: string;
  errand?: string | null;
  for_whom?: string | null;
  file_name?: string | null;
  mime?: string | null;
  size?: number;
  file_url?: string | null;
  payload?: string | null;
  author?: string | null;
  picked_up?: boolean;
  warn?: string | null;
};

const SLOW = 8 * 1024 * 1024;
const DB_COPY = 900_000;
const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export default function HaversackPage() {
  const { shareId, navigate } = useRouter();
  const [errand, setErrand] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Haversack | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)} — this may open slowly. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    fetch(`/api/haversack?id=${encodeURIComponent(shareId)}`).then(async (res) => {
      if (!res.ok) { if (!stop) setError('that haversack is not on the peg'); return; }
      const data = await res.json();
      if (!stop) setRow(data);
    });
    return () => { stop = true; };
  }, [shareId]);

  async function fileIt(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('choose a local file first'); return; }
    setBusy(true); setError(''); setWarn(slow);
    try {
      const id = uid();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file';
      const path = `haversack/${id}/${safe}`;
      const up = await fetch(`${SB_URL}/storage/v1/object/shares/${path}`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
        body: file,
      });
      const fileUrl = up.ok ? `${SB_URL}/storage/v1/object/public/shares/${path}` : '';
      const payload = file.size <= DB_COPY ? await fileToBase64(file) : null;
      if (!fileUrl && !payload) { setError('could not land the file in storage or the database'); setBusy(false); return; }
      const res = await fetch('/api/haversack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, errand, for_whom: forWhom, author, file_name: file.name, mime: file.type || 'application/octet-stream', size: file.size, file_url: fileUrl || null, payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error || 'could not write the haversack'); setBusy(false); return; }
      if (data.warn) setWarn(data.warn);
      setRow(data.haversack);
      navigate('haversack', id);
    } catch (err: any) {
      setError(err?.message || 'upload failed');
    } finally { setBusy(false); }
  }

  async function copy() {
    const href = shareId ? `${location.origin}/haversack/${shareId}` : '';
    if (!href) return;
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  const downloadHref = row?.file_url || (row?.payload ? `data:${row.mime || 'application/octet-stream'};base64,${row.payload}` : '');

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-16 apple-in">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[#ff9f0a]/80">haversack</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Send one file with an errand.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">The local file is written into the couriers table. Smaller files keep a byte copy in Postgres; larger ones still go, with a slowness note only. The share link unfurls in Discord. The satchel and courier desks stay.</p>
        {shareId && row ? (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-8 glass rounded-3xl p-6 apple-card">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{row.picked_up ? 'picked up' : 'still out'}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{row.file_name}</h2>
            <p className="mt-2 text-neutral-300">{row.errand || 'no errand written'}</p>
            <p className="mt-3 text-sm text-neutral-500">{row.for_whom ? `for ${row.for_whom} · ` : ''}{pretty(Number(row.size) || 0)}{row.author ? ` · ${row.author}` : ''}{row.payload ? ' · copy kept in the database' : ' · address kept in the database'}</p>
            {warn || row.warn ? <p className="mt-3 text-sm text-amber-300/90">{warn || row.warn}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {downloadHref ? <a href={downloadHref} download={row.file_name || 'haversack'} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">download</a> : null}
              <button onClick={copy} className="px-4 py-2 rounded-full glass text-sm">{copied ? 'copied' : 'copy discord link'}</button>
              <button onClick={() => navigate('pegboard')} className="px-4 py-2 rounded-full glass text-sm text-neutral-300">open the pegboard</button>
            </div>
          </motion.article>
        ) : (
          <form onSubmit={fileIt} className="mt-8 glass rounded-3xl p-6 space-y-4 apple-card">
            <label className="block text-sm text-neutral-400">errand
              <input value={errand} onChange={(e) => setErrand(e.target.value)} placeholder="print this, or keep it until Friday" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm text-neutral-400">for
                <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="name on the tag" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
              </label>
              <label className="block text-sm text-neutral-400">from
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
              </label>
            </div>
            <label className="block text-sm text-neutral-400">local file
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:text-black" />
            </label>
            {slow ? <p className="text-sm text-amber-300/90">{slow}</p> : <p className="text-sm text-neutral-500">no size cap. a note appears only if the drop may be slow.</p>}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button disabled={busy} className="px-5 py-2.5 rounded-full bg-[#ff9f0a] text-black text-sm font-medium disabled:opacity-60">{busy ? 'hanging…' : 'hang the haversack'}</button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
