import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Brief = { id: string; title: string; body: string; author: string | null; share_id: string | null; created_at?: string };
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export default function SpirketPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Brief | null>(null);
  const [recent, setRecent] = useState<Brief[]>([]);
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

  const loadRecent = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/spirket_briefs?select=id,title,body,author,share_id,created_at&order=created_at.desc&limit=8`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };
  const loadOne = async (id: string) => {
    const res = await fetch(`${SB_URL}/rest/v1/spirket_briefs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers });
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };
  useEffect(() => { loadRecent(); if (shareId) loadOne(shareId); }, [shareId]);

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true); setError(''); setWarn('');
    try {
      let shareIdOut: string | null = null;
      if (file) {
        const form = new FormData();
        form.append('file', file, file.name);
        form.append('caption', body.trim().slice(0, 280));
        form.append('author', author.trim() || 'spirket');
        form.append('cardTitle', title.trim().slice(0, 120));
        const res = await fetch('/api/share', { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `share ${res.status}`);
        if (data.warn) setWarn(data.warn);
        shareIdOut = data.id;
      }
      const id = shareIdOut || uid();
      const next = { id, title: title.trim().slice(0, 140), body: body.trim().slice(0, 4000), author: author.trim().slice(0, 80) || null, share_id: shareIdOut };
      const saved = await fetch(`${SB_URL}/rest/v1/spirket_briefs`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(next) });
      if (!saved.ok) throw new Error('the brief did not land');
      setRow({ ...next, created_at: new Date().toISOString() });
      setTitle(''); setBody(''); setAuthor(''); setFile(null);
      loadRecent();
      history.pushState(null, '', `/spirket/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the splice did not take');
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/spirket/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#ffd60a] text-sm font-medium mb-2 tracking-wide">spirket</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">splice a brief to a file.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">a reading splice, not the vault. the brief is the point. a local file is optional and still lands in the share table. paste /spirket in Discord.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="brief title" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ffd60a]/50" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who is writing" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ffd60a]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the brief itself" maxLength={4000} rows={6} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#ffd60a]/50 resize-none" />
          <label className="mt-3 block text-xs text-neutral-500">optional local file<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {file && <p className="mt-2 text-xs text-neutral-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!title.trim() || !body.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'splicing…' : 'splice it'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.title}</p>
            {row.author && <p className="text-sm text-[#ffd60a] mt-1">{row.author}</p>}
            <p className="text-sm text-neutral-300 mt-2 whitespace-pre-wrap">{row.body}</p>
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {row.share_id && <a href={`/s/${row.share_id}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open file card</a>}
            </div>
          </motion.div>
        )}
        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent briefs</p>
            <div className="grid gap-2">{recent.map((item) => (
              <a key={item.id} href={`/spirket/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                <p className="text-white text-sm">{item.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.author || item.body}</p>
              </a>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
