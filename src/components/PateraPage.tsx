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
  title: string;
  motif?: string | null;
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

export default function PateraPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [motif, setMotif] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [discs, setDiscs] = useState<Row[]>([]);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the disc may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/patera_discs?select=*&order=created_at.desc&limit=12`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setDiscs(Array.isArray(rows) ? rows : []))
      .catch(() => setDiscs([]));
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/patera_discs?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function setDisc() {
    if (!file || !title.trim()) {
      setError('a title and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: motif.trim() || title.trim(),
        author: author.trim(),
        cardTitle: title.trim(),
        color: '#5E5CE6',
        meta: { desk: 'patera', motif: motif.trim() },
      });
      if (!published.ok || !published.id) {
        setError(published.error || 'the file did not land.');
        return;
      }
      const id = published.id.slice(0, 12);
      const res = await fetch(`${SB_URL}/rest/v1/patera_discs`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id,
          title: title.trim(),
          motif: motif.trim(),
          author: author.trim() || null,
          file_name: file.name,
          file_url: published.url || published.meta?.fileUrl || null,
          mime: file.type || null,
          size: file.size,
          share_id: published.id,
        }),
      });
      if (!res.ok) {
        setError('file is stored. the disc row did not save.');
        return;
      }
      navigate('patera', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something slipped.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.18em] uppercase text-[#6e6e73]">patera</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] font-semibold tracking-tight">A disc, not a cabinet.</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">One motif, one local file under the roundel. The row below is discs already set.</p>

        {row && (
          <motion.section initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mt-10 max-w-md rounded-full aspect-square bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] grid place-items-center text-center p-10">
            <div>
              <p className="text-[13px] text-[#6e6e73]">{row.motif || 'motif'}</p>
              <h2 className="mt-1 text-[26px] font-semibold tracking-tight">{row.title}</h2>
              <p className="mt-2 text-[13px] text-[#6e6e73]">{row.file_name} {row.size ? `· ${pretty(Number(row.size))}` : ''}</p>
              {row.file_url && <a href={row.file_url} className="mt-4 inline-flex rounded-full bg-[#5E5CE6] px-5 py-2 text-[14px] text-white">Open</a>}
            </div>
          </motion.section>
        )}

        <form className="mt-10 grid gap-3 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]" onSubmit={(e) => { e.preventDefault(); setDisc(); }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="name of the disc" className="rounded-2xl bg-[#f5f5f7] px-4 py-3 outline-none" />
          <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="motif — leaf, tide, a room" className="rounded-2xl bg-[#f5f5f7] px-4 py-3 outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed by" className="rounded-2xl bg-[#f5f5f7] px-4 py-3 outline-none" />
          <label className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-[14px] text-[#6e6e73]">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? file.name : 'choose a local file'}
          </label>
          {slow && <p className="text-[13px] text-[#b25000]">{slow}</p>}
          {error && <p className="text-[13px] text-[#ff3b30]">{error}</p>}
          <button disabled={busy} className="w-fit rounded-full bg-[#1d1d1f] px-5 py-2.5 text-white disabled:opacity-50">{busy ? 'setting…' : 'set the disc'}</button>
        </form>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {discs.map((item, i) => (
            <motion.button key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => navigate('patera', item.id)} className="aspect-square rounded-full bg-white shadow-sm grid place-items-center px-4 text-center">
              <span>
                <span className="block text-[14px] font-medium">{item.title}</span>
                <span className="text-[12px] text-[#6e6e73]">{item.motif}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
