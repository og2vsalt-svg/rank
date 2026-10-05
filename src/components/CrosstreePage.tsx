import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Frame = { id: string; name: string; size: number; mime: string; url: string };
type Packet = { id: string; title: string; blurb: string | null; author: string | null; files: Frame[]; created_at?: string };

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function loadPacket(id: string): Promise<Packet | null> {
  const res = await fetch(`${SB_URL}/rest/v1/crosstrees?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function CrosstreePage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [blurb, setBlurb] = useState('');
  const [author, setAuthor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [packet, setPacket] = useState<Packet | null>(null);

  useEffect(() => { if (shareId) loadPacket(shareId).then(setPacket).catch(() => setPacket(null)); }, [shareId]);
  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);
  const slow = total > 24 * 1024 * 1024 ? 'this packet is large. the send may feel slow. nothing is refused for size.' : '';

  const move = (i: number, dir: -1 | 1) => {
    const next = [...files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  };

  const publish = async () => {
    if (!title.trim() || !files.length) return;
    setErr(''); setLink('');
    const id = uid();
    const frames: Frame[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBusy(`filing ${i + 1} of ${files.length}`);
      const res = await publishLocalFile(file, { author: author.trim() || 'crosstree', caption: blurb.trim() || title.trim(), cardTitle: file.name, color: '#0A84FF' });
      if (!res.ok || !res.id || !res.url) { setBusy(''); setErr(res.error || `could not file ${file.name}`); return; }
      frames.push({ id: res.id, name: file.name, size: file.size, mime: file.type || 'application/octet-stream', url: res.url });
    }
    setBusy('writing the packet');
    const ins = await fetch(`${SB_URL}/rest/v1/crosstrees`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ id, title: title.trim().slice(0, 140), blurb: blurb.trim() || null, author: author.trim() || null, files: frames }),
    });
    setBusy('');
    if (!ins.ok) { setErr((await ins.text()).slice(0, 180) || 'packet table did not take the row'); return; }
    setPacket((await ins.json())[0]);
    const url = `${location.origin}/crosstree/${id}`;
    setLink(url);
    history.pushState(null, '', `/crosstree/${id}`);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] tracking-[0.22em] uppercase text-neutral-500 mb-3">reading packet</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight text-white mb-3">crosstree</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }} className="text-neutral-400 leading-relaxed mb-8 max-w-xl">stack local files in the order someone should open them. each file lands in the share table. the packet is the reading order, not another drawer. paste the link in Discord for a card.</motion.p>
        {packet && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mb-6">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{packet.author || 'unsigned'}</p>
            <h2 className="text-2xl font-semibold text-white tracking-tight">{packet.title}</h2>
            {packet.blurb && <p className="text-neutral-400 mt-2 leading-relaxed">{packet.blurb}</p>}
            <ol className="mt-5 space-y-2">
              {(packet.files || []).map((frame, i) => (
                <motion.li key={frame.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 24 }} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3">
                  <a href={`/s/${frame.id}`} className="min-w-0"><span className="text-neutral-500 text-xs mr-2">{String(i + 1).padStart(2, '0')}</span><span className="text-sm text-white">{frame.name}</span></a>
                  <span className="text-xs text-neutral-500 shrink-0">{pretty(frame.size)}</span>
                </motion.li>
              ))}
            </ol>
            {link && <button onClick={() => navigator.clipboard.writeText(link)} className="mt-4 text-xs text-neutral-300 hover:text-white">copy {link.replace(/^https?:\/\//, '')}</button>}
          </motion.section>
        )}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-[28px] p-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="packet title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="why these files sit together" rows={3} className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition resize-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition" />
          <label className="mt-4 block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-7 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            <span className="text-white text-sm font-medium">add local files</span>
            <span className="block text-neutral-500 text-xs mt-1">{files.length ? `${files.length} waiting · ${pretty(total)}` : 'any size. a warning only if the send may drag.'}</span>
          </label>
          {!!files.length && (
            <ul className="mt-3 space-y-1.5">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/25">
                  <span className="text-xs text-neutral-500 w-5">{i + 1}</span>
                  <span className="text-sm text-white truncate flex-1">{file.name}</span>
                  <button type="button" onClick={() => move(i, -1)} className="text-xs text-neutral-400 hover:text-white px-1">up</button>
                  <button type="button" onClick={() => move(i, 1)} className="text-xs text-neutral-400 hover:text-white px-1">down</button>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-xs text-neutral-500 hover:text-red-300 px-1">remove</button>
                </li>
              ))}
            </ul>
          )}
          {slow && <p className="text-amber-200/80 text-xs mt-3">{slow}</p>}
          {err && <p className="text-red-300 text-xs mt-3">{err}</p>}
          <button disabled={!title.trim() || !files.length || !!busy} onClick={publish} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition active:scale-[0.98]">{busy || 'publish the packet'}</button>
        </motion.div>
      </main>
    </div>
  );
}
