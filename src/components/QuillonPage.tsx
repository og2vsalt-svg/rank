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
  for_whom: string;
  promise?: string | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
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

export default function QuillonPage() {
  const { shareId, navigate } = useRouter();
  const [forWhom, setForWhom] = useState('');
  const [promise, setPromise] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. sending may feel slow. the slip is not refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/quillon_slips?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function guard() {
    if (!file || !forWhom.trim()) {
      setError('who it is for, and the local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: promise.trim() || `for ${forWhom.trim()}`,
        author: author.trim(),
        cardTitle: `for ${forWhom.trim()}`,
        color: '#BF5AF2',
        meta: { desk: 'quillon', forWhom: forWhom.trim() },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'upload failed');
      const saved = await fetch(`${SB_URL}/rest/v1/quillon_slips`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id: published.id,
          for_whom: forWhom.trim(),
          promise: promise.trim() || null,
          author: author.trim() || null,
          file_name: file.name,
          file_url: published.url,
          mime: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180));
      const rows = await saved.json();
      setRow(rows[0] || null);
      navigate('quillon', published.id);
    } catch (e: any) {
      setError(e?.message || 'could not set the guard');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${location.origin}/quillon/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">quillon</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">a guard on the handoff</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">Name who the file is for and the promise that travels with it. Not a vault list. Discord unfurls /quillon.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] text-[#6e6e73]">for</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-tight">{row.for_whom}</h2>
            {row.promise && <p className="mt-4 text-[17px] leading-relaxed">{row.promise}</p>}
            <p className="mt-4 text-[13px] text-[#6e6e73]">{row.file_name}{row.size ? ` · ${pretty(row.size)}` : ''}{row.author ? ` · ${row.author}` : ''}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url && <a href={row.file_url} className="rounded-full bg-[#0A84FF] px-4 py-2 text-[14px] font-medium text-white">open file</a>}
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">{copied ? 'copied' : 'copy card link'}</button>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <label className="block text-[13px] text-[#6e6e73]">for</label>
            <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="a name" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">promise</label>
            <textarea value={promise} onChange={(e) => setPromise(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="what travels with the file" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">from</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="optional" />
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-4 text-[15px] hover:bg-[#fafafa]">
              <span>{file ? file.name : 'local file'}</span>
              <span className="text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-2 text-[13px] text-[#a15c07]">{slow}</p>}
            {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} onClick={guard} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0071e3] disabled:opacity-60">{busy ? 'setting…' : 'set the guard'}</button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
