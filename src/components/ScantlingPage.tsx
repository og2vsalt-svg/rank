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
  note?: string | null;
  sha256?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  author?: string | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function ScantlingPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(
    () => (file && file.size > SLOW ? `about ${pretty(file.size)}. hashing and sending may feel slow. nothing is refused.` : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/scantling_passes?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function measure() {
    if (!file || !title.trim()) {
      setError('a title and a local file, both.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const hash = await sha256(file);
      const published = await publishLocalFile(file, { caption: note.trim() || title.trim(), author: author.trim(), cardTitle: title.trim() });
      if (!published.ok || !published.id) throw new Error(published.error || 'the file did not land');
      const saved = await fetch(`${SB_URL}/rest/v1/scantling_passes`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id: published.id,
          title: title.trim(),
          note: note.trim() || null,
          sha256: hash,
          file_name: file.name,
          file_url: published.url,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          share_id: published.id,
          author: author.trim() || null,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 220) || 'the measure did not save');
      const rows = await saved.json();
      setRow(rows[0]);
      navigate('scantling', published.id);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 220) : 'could not measure the file');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${window.location.origin}/scantling/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">scantling</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Measure it, then hand it over.</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">The file goes into the share table. The hash and note stay beside it. Paste the link in Discord for a card. Older desks stay on their routes.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight">{row.title}</h2>
            {row.note && <p className="mt-2 text-[16px] leading-relaxed text-[#3a3a3c]">{row.note}</p>}
            <p className="mt-4 text-[13px] text-[#6e6e73]">{row.file_name} · {pretty(Number(row.size) || 0)}{row.author ? ` · ${row.author}` : ''}</p>
            {row.sha256 && <p className="mt-3 break-all rounded-2xl bg-[#f5f5f7] px-4 py-3 font-mono text-[12px] text-[#3a3a3c]">{row.sha256}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url && <a href={row.file_url} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] text-white transition hover:bg-black">open file</a>}
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition hover:bg-[#e8e8ed]">{copied ? 'copied' : 'copy link'}</button>
              <button onClick={() => navigate('scantling')} className="rounded-full px-4 py-2 text-[14px] text-[#6e6e73]">measure another</button>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <label className="block text-[13px] text-[#6e6e73]">title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="survey of the west wall" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="what the measure is for" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">signed</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="optional" />
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-4 text-[15px] hover:bg-[#fafafa]">
              <span>{file ? file.name : 'choose a local file'}</span>
              <span className="text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-2 text-[13px] text-[#a15c07]">{slow}</p>}
            {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} onClick={measure} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0071e3] disabled:opacity-60">{busy ? 'measuring…' : 'measure and file'}</button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
