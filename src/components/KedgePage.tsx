import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Pin = { id: string; title: string; body: string | null; share_id: string | null; created_at: string };

export default function KedgePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [busy, setBusy] = useState(false);
  const [embed, setEmbed] = useState('');
  const [error, setError] = useState('');
  const [warn, setWarn] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`${SB_URL}/rest/v1/desk_pins?desk=eq.kedge&select=id,title,body,share_id,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (res.ok) setPins(await res.json());
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    setWarn(null);
    let shareId: string | null = null;
    let card = '';
    if (file) {
      const res = await publishLocalFile(file, { caption: title.trim(), color: '#FF9F0A' });
      if (!res.ok || !res.id) {
        setBusy(false);
        setError(res.error || 'the file did not take');
        return;
      }
      shareId = res.id;
      card = res.embed || '';
      setWarn(res.warn || (file.size > 12_000_000 ? 'large file. the send may feel slow. nothing is refused for size.' : null));
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const ins = await fetch(`${SB_URL}/rest/v1/desk_pins`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id, desk: 'kedge', title: title.trim().slice(0, 180), body: body.trim() || null, share_id: shareId, color: '#FF9F0A' }),
    });
    setBusy(false);
    if (!ins.ok) {
      setError((await ins.text()).slice(0, 180) || 'pin table refused the row');
      return;
    }
    setEmbed(card || `${location.origin}/kedge`);
    setTitle('');
    setBody('');
    setFile(null);
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">kedge</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a pin, optional file</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Drop a short pin into the desk table. Attach a local file if you want it in the share table too. Discord cards live on /kedge and on the /s link when a file goes with it.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="glass mt-8 rounded-3xl p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pin title" className="w-full rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="why it is here" rows={4} className="mt-3 w-full resize-y rounded-2xl bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-white/30" />
          <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl bg-black/30 px-4 py-3 text-[13px] text-white/70">
            <span>{file ? file.name : 'optional local file'}</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button onClick={send} disabled={!title.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50">{busy ? 'pinning…' : 'set the kedge'}</button>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
          {embed && <p className="mt-3 truncate text-[13px] text-white/70">{embed}</p>}
        </motion.div>
        <div className="mt-6 space-y-2">
          {pins.map((p, i) => (
            <motion.article key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[15px] text-white/90">{p.title}</p>
              {p.body && <p className="mt-1 text-[13px] text-white/50">{p.body}</p>}
              {p.share_id && <a className="mt-2 inline-block text-[12px] text-[#64D2FF]" href={`/s/${p.share_id}`}>/s/{p.share_id}</a>}
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
