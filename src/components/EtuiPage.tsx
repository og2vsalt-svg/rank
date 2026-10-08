import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;
const LININGS = ['#0A84FF', '#5E5CE6', '#FF9F0A', '#30D158', '#FF375F', '#64D2FF'];

type Row = {
  id: string;
  label: string;
  lining?: string | null;
  accent?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  share_id?: string | null;
  author?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function EtuiPage() {
  const { shareId, navigate } = useRouter();
  const [label, setLabel] = useState('');
  const [lining, setLining] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(LININGS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(
    () => (file && file.size > SLOW ? `about ${pretty(file.size)}. the tab may feel slow. nothing is refused.` : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/etuis?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function fileIt() {
    if (!file || !label.trim()) {
      setError('a label and a local file, both.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, { caption: lining.trim() || label.trim(), author: author.trim() });
      if (!published.ok || !published.meta) throw new Error(published.error || 'the file did not land');
      const id = published.meta.id;
      const saved = await fetch(`${SB_URL}/rest/v1/etuis`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id,
          label: label.trim(),
          lining: lining.trim() || null,
          accent,
          file_name: file.name,
          file_url: published.meta.fileUrl,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          share_id: id,
          author: author.trim() || null,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()) || 'the case row did not save');
      const rows = await saved.json();
      setRow(rows[0]);
      navigate('etui', id);
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 220) : 'could not file the case');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${window.location.origin}/etui/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">
          etui
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">
          A small case for one file.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
          The bytes go to storage and the share table. The label and lining sit in the etuis table. Paste the link in Discord for a card. Older desks stay where they are.
        </p>

        {row ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <div className="h-1.5 w-16 rounded-full" style={{ background: row.accent || '#0A84FF' }} />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">{row.label}</h2>
            {row.lining && <p className="mt-2 text-[16px] leading-relaxed text-[#3a3a3c]">{row.lining}</p>}
            <p className="mt-4 text-[13px] text-[#6e6e73]">
              {row.file_name} · {pretty(Number(row.size) || 0)}{row.author ? ` · ${row.author}` : ''}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url && (
                <a href={row.file_url} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] text-white transition hover:bg-black">
                  open file
                </a>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition hover:bg-[#e8e8ed]"
              >
                {copied ? 'copied' : 'copy link'}
              </button>
              <button onClick={() => navigate('bandbox')} className="rounded-full px-4 py-2 text-[14px] text-[#6e6e73] hover:text-[#1d1d1f]">
                see the window
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <label className="block text-[13px] text-[#6e6e73]">label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none ring-0 focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="mother's recipe card" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">lining note</label>
            <textarea value={lining} onChange={(e) => setLining(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="what this case is for" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">signed</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="optional" />
            <div className="mt-4 flex gap-2">
              {LININGS.map((c) => (
                <button key={c} aria-label={c} onClick={() => setAccent(c)} className="h-7 w-7 rounded-full transition" style={{ background: c, boxShadow: accent === c ? '0 0 0 2px white, 0 0 0 4px #1d1d1f' : 'none' }} />
              ))}
            </div>
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-4 text-[15px] hover:bg-[#fafafa]">
              <span>{file ? file.name : 'choose a local file'}</span>
              <span className="text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-2 text-[13px] text-[#a15c07]">{slow}</p>}
            {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} onClick={fileIt} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0071e3] disabled:opacity-60">
              {busy ? 'filing…' : 'file the case'}
            </button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
