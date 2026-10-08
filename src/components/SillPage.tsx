import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const WEATHER = ['clear', 'overcast', 'rain on the glass', 'late light', 'night'];

type Sill = { id: string; lintel_id?: string | null; line: string; weather?: string | null; author?: string | null; created_at?: string };

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function SillPage() {
  const { shareId, navigate } = useRouter();
  const [line, setLine] = useState('');
  const [weather, setWeather] = useState(WEATHER[0]);
  const [author, setAuthor] = useState('');
  const [lintel, setLintel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Sill | null>(null);
  const [recent, setRecent] = useState<Sill[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/sills?select=*&order=created_at.desc&limit=12`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => setRecent([]));
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/sills?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setError('could not open that sill'));
  }, [shareId]);

  async function leave() {
    if (!line.trim()) { setError('write what you saw on the glass'); return; }
    setBusy(true); setError('');
    const id = uid();
    const body = { id, lintel_id: lintel.trim() || null, line: line.trim(), weather, author: author.trim() || null };
    const ins = await fetch(`${SB_URL}/rest/v1/sills`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    setBusy(false);
    if (!ins.ok) { setError('the note did not stay on the sill'); return; }
    navigate('sill', id);
  }

  const link = row ? `${location.origin}/sill/${row.id}` : '';
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">window</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.04 }} className="mt-2 text-[40px] font-semibold tracking-[-0.04em]">Sill</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">A note left on the window. No file, no drawer. Pair it with a lintel if you already hung one. Discord unfurls the line.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
            <p className="text-[13px] uppercase tracking-[0.14em] text-[#6e6e73]">{row.weather || 'weather unset'}</p>
            <p className="mt-3 text-[26px] font-medium leading-snug tracking-tight">{row.line}</p>
            <p className="mt-3 text-[14px] text-[#6e6e73]">{row.author || 'unsigned'}{row.lintel_id ? ` · lintel ${row.lintel_id}` : ''}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white">{copied ? 'copied' : 'copy sill link'}</button>
              {row.lintel_id && <a href={`/lintel/${row.lintel_id}`} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">open the doorway</a>}
              <button onClick={() => navigate('sill')} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">leave another</button>
            </div>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={(e) => { e.preventDefault(); leave(); }} className="mt-8 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
            <textarea value={line} onChange={(e) => setLine(e.target.value.slice(0, 240))} rows={3} placeholder="what is on the glass" className="w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" />
            <div className="flex flex-wrap gap-2">
              {WEATHER.map((w) => (
                <button type="button" key={w} onClick={() => setWeather(w)} className={`rounded-full px-3 py-1.5 text-[13px] transition ${weather === w ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'}`}>{w}</button>
              ))}
            </div>
            <input value={lintel} onChange={(e) => setLintel(e.target.value.slice(0, 40))} placeholder="lintel id, optional" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 60))} placeholder="your name, optional" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" />
            {error && <p className="text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-60">{busy ? 'setting…' : 'leave it on the sill'}</button>
          </motion.form>
        )}
        {!!recent.length && (
          <section className="mt-8">
            <p className="mb-3 text-[13px] uppercase tracking-[0.14em] text-[#6e6e73]">recent glass</p>
            <div className="grid gap-2">
              {recent.map((s) => (
                <a key={s.id} href={`/sill/${s.id}`} className="rounded-2xl bg-white px-4 py-3 text-[15px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5">
                  {s.line}
                  <span className="mt-1 block text-[12px] text-[#6e6e73]">{s.weather || 'unset'}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
