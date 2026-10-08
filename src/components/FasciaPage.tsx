import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Row = { id: string; face: string; share_id?: string | null; file_name?: string | null; author?: string | null; created_at?: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function FasciaPage() {
  const { shareId, navigate } = useRouter();
  const [face, setFace] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the tab may feel slow. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/fascia?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setError('could not open that fascia'));
  }, [shareId]);

  async function fileIt() {
    if (!face.trim()) { setError('write the face line first'); return; }
    if (!file) { setError('pick a local file. it lands in the share table'); return; }
    setBusy(true); setError('');
    const sent = await publishLocalFile(file, { caption: face.trim(), author: author.trim() || undefined, cardTitle: face.trim().slice(0, 80), color: '#F5F5F7' });
    if (!sent.ok || !sent.id) { setBusy(false); setError(sent.error || 'the file did not land'); return; }
    const id = uid();
    const body = { id, face: face.trim(), share_id: sent.id, file_name: file.name, author: author.trim() || null };
    const ins = await fetch(`${SB_URL}/rest/v1/fascia`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    setBusy(false);
    if (!ins.ok) { setError('file is in the share table, but the fascia row did not save'); return; }
    const saved = await ins.json();
    const next = Array.isArray(saved) ? saved[0] : body;
    setRow(next);
    navigate('fascia', id);
  }

  const link = row ? `${location.origin}/fascia/${row.id}` : '';
  const fileLink = row?.share_id ? `${location.origin}/s/${row.share_id}` : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] uppercase tracking-[0.18em] text-white/40">face board</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">Fascia</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">The line people read before they open the file. The bytes go into the share table. This page only keeps the face. Not a vault drawer. Large drops are warned, never refused.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-2xl font-medium tracking-tight">{row.face}</p>
            <p className="mt-2 text-sm text-white/45">{row.file_name || 'file'}{row.author ? ` · ${row.author}` : ''}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200">{copied ? 'copied' : 'copy fascia link'}</button>
              {fileLink && <a href={fileLink} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">open the file</a>}
            </div>
            <p className="mt-4 text-xs text-white/35">Paste this link in Discord. The card uses the face line, and the image if the file is one.</p>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); fileIt(); }} className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <input value={face} onChange={(e) => setFace(e.target.value.slice(0, 280))} placeholder="what this file presents as" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30" />
            <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 60))} placeholder="your name, optional" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30" />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-white/55 transition hover:border-white/30">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? `${file.name} · ${pretty(file.size)}` : 'choose a local file'}
            </label>
            {slow && <p className="text-xs text-amber-200/90">{slow}</p>}
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'filing…' : 'file the fascia'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
