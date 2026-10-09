import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Row = {
  id: string;
  name?: string | null;
  caption?: string | null;
  author?: string | null;
  mime?: string | null;
  size?: number | null;
  file_url?: string | null;
  meta?: { sky?: string; place?: string; when?: string; kind?: string } | null;
};

function pretty(n: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function DripstonePage() {
  const { shareId, navigate } = useRouter();
  const [place, setPlace] = useState('');
  const [sky, setSky] = useState('overcast');
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the drip may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(shareId)}&select=id,name,caption,author,mime,size,file_url,meta&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function raise() {
    if (!file || !place.trim()) {
      setError('a place and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: note.trim() || place.trim(),
        author: author.trim() || undefined,
        cardTitle: place.trim(),
        meta: { kind: 'dripstone', sky, place: place.trim(), when, note: note.trim() },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'the file did not land');
      navigate('dripstone', published.id);
    } catch (e: any) {
      setError(e?.message || 'could not set the drip');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${location.origin}/dripstone/${row.id}` : '';
  const image = row && String(row.mime || '').startsWith('image/') ? row.file_url : '';
  const meta = row?.meta || {};

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">dripstone</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">a weather lip</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">Not a cabinet. Pin one local file under a place, a sky, and a time. The bytes land in the share table. Discord unfurls /dripstone. Large drops are warned, never refused. Older desks stay.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-10 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <div className="relative aspect-[16/9] overflow-hidden bg-[#1d1d1f]">
              {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-6 text-center text-[15px] text-white/70">{row.name}</div>}
            </div>
            <div className="p-6">
              <p className="text-[13px] text-[#6e6e73]">{meta.sky || 'sky'} · {meta.when || 'undated'}</p>
              <h2 className="mt-1 text-[28px] font-semibold tracking-tight">{meta.place || row.name}</h2>
              {row.caption && <p className="mt-3 text-[16px] leading-relaxed text-[#3a3a3c]">{row.caption}</p>}
              <p className="mt-3 text-[13px] text-[#6e6e73]">{row.author || 'unsigned'} · {pretty(Number(row.size) || 0)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {row.file_url && <a href={row.file_url} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white transition active:scale-[0.98]">open file</a>}
                <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition active:scale-[0.98]">{copied ? 'copied' : 'copy card link'}</button>
                <button onClick={() => navigate('dripstone')} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">another lip</button>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} onSubmit={(e) => { e.preventDefault(); raise(); }} className="mt-10 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="place — a sill, a street, a room" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={sky} onChange={(e) => setSky(e.target.value)} className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none">
                {['clear', 'overcast', 'rain', 'wind', 'night', 'fog'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what the weather did to the file" rows={3} className="w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, if you want it" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <label className="block rounded-2xl border border-dashed border-black/10 px-4 py-5 text-[14px] text-[#6e6e73]">
              <input type="file" className="block w-full text-[14px] text-[#1d1d1f]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="mt-2 block">any local file. no size cap.</span>
            </label>
            {slow && <p className="text-[13px] text-[#c93400]">{slow}</p>}
            {error && <p className="text-[13px] text-[#c93400]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60">{busy ? 'setting…' : 'set the drip'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
