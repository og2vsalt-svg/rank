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
  doorway: string;
  dedication?: string | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  seen_count?: number | null;
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

export default function TympanumPage() {
  const { shareId, navigate } = useRouter();
  const [doorway, setDoorway] = useState('');
  const [dedication, setDedication] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the semicircle may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/tympanum_fields?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function raise() {
    if (!file || !doorway.trim()) {
      setError('a doorway name and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: dedication.trim() || doorway.trim(),
        author: author.trim() || undefined,
        cardTitle: doorway.trim(),
        color: '#FF9F0A',
        meta: { desk: 'tympanum', doorway: doorway.trim() },
      });
      if (!published.ok || !published.id || !published.url) throw new Error(published.error || 'the file did not land');
      const saved = await fetch(`${SB_URL}/rest/v1/tympanum_fields`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id: published.id,
          doorway: doorway.trim().slice(0, 160),
          dedication: dedication.trim().slice(0, 400) || null,
          author: author.trim().slice(0, 80) || null,
          file_name: file.name,
          file_url: published.url,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          share_id: published.id,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180));
      const rows = await saved.json();
      setRow(rows[0] || null);
      navigate('tympanum', published.id);
    } catch (e: any) {
      setError(e?.message || 'could not raise the field');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${location.origin}/tympanum/${row.id}` : '';
  const image = row && String(row.mime || '').startsWith('image/') ? row.file_url : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">tympanum</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">a field above the door</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">Name the doorway, leave a dedication, and pin one local file into the share table. Discord unfurls /tympanum. Large drops are warned, never refused. The vault stays where it was.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-10 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <div className="relative aspect-[16/9] overflow-hidden bg-[#1d1d1f]">
              {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-6 text-center text-[15px] text-white/70">{row.file_name}</div>}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-b-[999px] border-b border-white/20" />
            </div>
            <div className="p-6">
              <p className="text-[12px] uppercase tracking-[0.14em] text-[#6e6e73]">above</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{row.doorway}</h2>
              {row.dedication && <p className="mt-2 text-[16px] leading-relaxed text-[#3a3a3c]">{row.dedication}</p>}
              <p className="mt-3 text-[13px] text-[#6e6e73]">{row.file_name}{row.size ? ` · ${pretty(row.size)}` : ''}{row.author ? ` · ${row.author}` : ''}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {row.file_url && <a href={row.file_url} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white transition active:scale-[0.98]">open file</a>}
                <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition active:scale-[0.98]">{copied ? 'copied' : 'copy card link'}</button>
                <button onClick={() => navigate('voussoir')} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">see the wedges</button>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} onSubmit={(e) => { e.preventDefault(); raise(); }} className="mt-10 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <input value={doorway} onChange={(e) => setDoorway(e.target.value)} placeholder="doorway — a name, a room, a person" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <textarea value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="a short dedication under the curve" rows={3} className="w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, if you want it" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <label className="block rounded-2xl border border-dashed border-black/10 px-4 py-5 text-[14px] text-[#6e6e73]">
              <input type="file" className="block w-full text-[14px] text-[#1d1d1f]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="mt-2 block">any local file. no size cap.</span>
            </label>
            {slow && <p className="text-[13px] text-[#c93400]">{slow}</p>}
            {error && <p className="text-[13px] text-[#c93400]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60">{busy ? 'raising…' : 'raise the field'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
