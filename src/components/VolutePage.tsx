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
  digest?: string | null;
  note?: string | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  created_at?: string;
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
async function digestOf(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function VolutePage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [spiral, setSpiral] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. hashing and the upload may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/volute_turns?select=*&order=created_at.desc&limit=8`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setSpiral(Array.isArray(rows) ? rows : []))
      .catch(() => setSpiral([]));
  }, [row?.id]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/volute_turns?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function turn() {
    if (!file || !title.trim()) {
      setError('a title and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const digest = await digestOf(file);
      const published = await publishLocalFile(file, {
        caption: note.trim() || title.trim(),
        author: author.trim(),
        cardTitle: title.trim(),
        color: '#5E5CE6',
        meta: { desk: 'volute', digest },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'upload failed');
      const saved = await fetch(`${SB_URL}/rest/v1/volute_turns`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id: published.id,
          title: title.trim(),
          digest,
          note: note.trim() || null,
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
      navigate('volute', published.id);
    } catch (e: any) {
      setError(e?.message || 'could not turn the spiral');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${location.origin}/volute/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">volute</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">a spiral, not a cabinet</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">The checksum is taken in the tab. The file still lands in the share table. Discord unfurls /volute.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <h2 className="text-[22px] font-semibold tracking-tight">{row.title}</h2>
            {row.note && <p className="mt-2 text-[16px] leading-relaxed text-[#3a3a3c]">{row.note}</p>}
            <p className="mt-3 break-all font-mono text-[12px] leading-relaxed text-[#6e6e73]">{row.digest}</p>
            <p className="mt-3 text-[13px] text-[#6e6e73]">{row.file_name}{row.size ? ` · ${pretty(row.size)}` : ''}{row.author ? ` · ${row.author}` : ''}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url && <a href={row.file_url} className="rounded-full bg-[#5E5CE6] px-4 py-2 text-[14px] font-medium text-white">open file</a>}
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">{copied ? 'copied' : 'copy card link'}</button>
              <button onClick={() => navigate('volute')} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">new turn</button>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <label className="block text-[13px] text-[#6e6e73]">title of the turn</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="morning proof" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">note beside the checksum</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="why this file was turned" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">signed</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="optional" />
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-4 text-[15px] transition hover:bg-[#fafafa]">
              <span>{file ? file.name : 'local file'}</span>
              <span className="text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-2 text-[13px] text-[#a15c07]">{slow}</p>}
            {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} onClick={turn} className="mt-5 rounded-full bg-[#5E5CE6] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#4b49c9] disabled:opacity-60">{busy ? 'turning…' : 'turn the spiral'}</button>
          </motion.section>
        )}
        {spiral.length > 0 && (
          <section className="mt-8">
            <p className="text-[13px] text-[#6e6e73]">recent turns</p>
            <ul className="mt-3 space-y-2">
              {spiral.map((item) => (
                <li key={item.id}>
                  <button onClick={() => navigate('volute', item.id)} className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5">
                    <span className="block text-[15px] font-medium">{item.title}</span>
                    <span className="mt-1 block truncate font-mono text-[12px] text-[#6e6e73]">{item.digest}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
