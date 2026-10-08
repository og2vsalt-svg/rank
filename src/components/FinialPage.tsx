import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; share_id?: string | null; close_line: string; author?: string | null };

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function FinialPage() {
  const { shareId, navigate } = useRouter();
  const [share, setShare] = useState('');
  const [line, setLine] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/finials?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setError('could not open that finial'));
  }, [shareId]);

  async function closeIt() {
    if (!line.trim()) { setError('write the closing line'); return; }
    setBusy(true); setError('');
    const id = uid();
    const body = { id, share_id: share.trim() || null, close_line: line.trim(), author: author.trim() || null };
    const ins = await fetch(`${SB_URL}/rest/v1/finials`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    setBusy(false);
    if (!ins.ok) { setError('the closing mark did not save'); return; }
    const saved = await ins.json();
    setRow(Array.isArray(saved) ? saved[0] : body);
    navigate('finial', id);
  }

  const link = row ? `${location.origin}/finial/${row.id}` : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] uppercase tracking-[0.18em] text-white/40">closing mark</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Finial</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A last line on a share that already exists. No new file, no size cap, no cabinet. Discord unfurls the close, not the drawer.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-2xl font-medium tracking-tight">{row.close_line}</p>
            <p className="mt-2 text-sm text-white/45">{row.author || 'unsigned'}{row.share_id ? ` · share ${row.share_id}` : ''}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200">{copied ? 'copied' : 'copy finial link'}</button>
              {row.share_id && <a href={`/s/${row.share_id}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">open the share</a>}
            </div>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); closeIt(); }} className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <input value={share} onChange={(e) => setShare(e.target.value.slice(0, 80))} placeholder="existing share id, optional" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30" />
            <textarea value={line} onChange={(e) => setLine(e.target.value.slice(0, 280))} placeholder="the line that closes it" rows={3} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30" />
            <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 60))} placeholder="your name, optional" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none focus:border-white/30" />
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button disabled={busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50">{busy ? 'setting…' : 'set the finial'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
