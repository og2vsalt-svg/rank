import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Lintel = {
  id: string;
  greeting: string;
  hours?: string | null;
  knock_hint?: string | null;
  author?: string | null;
  share_id?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  accent?: string | null;
};
type Knock = { id: string; line: string; author?: string | null; created_at?: string };

function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function LintelPage() {
  const { shareId, navigate } = useRouter();
  const [greeting, setGreeting] = useState('');
  const [hours, setHours] = useState('open');
  const [hint, setHint] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Lintel | null>(null);
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [line, setLine] = useState('');
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `${pretty(file.size)} may feel slow to send. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/lintels?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setError('could not open that doorway'));
    fetch(`${SB_URL}/rest/v1/lintel_knocks?lintel_id=eq.${encodeURIComponent(shareId)}&select=*&order=created_at.desc&limit=24`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setKnocks(Array.isArray(rows) ? rows : []))
      .catch(() => setKnocks([]));
  }, [shareId]);

  async function hang() {
    if (!greeting.trim() || !file) { setError('a greeting and a local file, both.'); return; }
    setBusy(true); setError('');
    const published = await publishLocalFile(file, { caption: greeting.trim(), author: author.trim(), cardTitle: greeting.trim(), color: '#F5F5F7' });
    if (!published.ok || !published.id) { setBusy(false); setError(published.error || 'the file did not land'); return; }
    const id = uid();
    const body = {
      id,
      greeting: greeting.trim(),
      hours: hours.trim() || null,
      knock_hint: hint.trim() || null,
      author: author.trim() || null,
      share_id: published.id,
      file_name: file.name,
      file_url: published.url,
      mime: file.type || null,
      size: file.size,
      accent: '#0A84FF',
    };
    const ins = await fetch(`${SB_URL}/rest/v1/lintels`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    setBusy(false);
    if (!ins.ok) { setError('the doorway saved the file, but not the lintel row'); return; }
    navigate('lintel', id);
  }

  async function knock() {
    if (!row || !line.trim()) return;
    setBusy(true); setError('');
    const body = { id: uid(), lintel_id: row.id, line: line.trim(), author: author.trim() || null };
    const ins = await fetch(`${SB_URL}/rest/v1/lintel_knocks`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    setBusy(false);
    if (!ins.ok) { setError('the knock did not land'); return; }
    setKnocks((k) => [body, ...k]);
    setLine('');
  }

  const link = row ? `${location.origin}/lintel/${row.id}` : '';
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#6e6e73]">doorway</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.04 }} className="mt-2 text-[40px] font-semibold tracking-[-0.04em]">Lintel</motion.h1>
        <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">Hang one local file over the door, then let people knock. The bytes go into the share table. The greeting lives here. Not a cabinet.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <div className="h-1.5" style={{ background: row.accent || '#0A84FF' }} />
            <div className="p-6 sm:p-8">
              <p className="text-[28px] font-semibold tracking-tight">{row.greeting}</p>
              <p className="mt-2 text-[15px] text-[#6e6e73]">{row.hours || 'hours unset'} · {row.author || 'unsigned'}</p>
              {row.knock_hint && <p className="mt-4 text-[15px] leading-relaxed">{row.knock_hint}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white transition hover:bg-black">{copied ? 'copied' : 'copy doorway link'}</button>
                {row.file_url && <a href={row.file_url} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] text-[#1d1d1f] transition hover:bg-[#e8e8ed]">{row.file_name || 'open file'}{row.size ? ` · ${pretty(Number(row.size))}` : ''}</a>}
                {row.share_id && <a href={`/s/${row.share_id}`} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition hover:bg-[#e8e8ed]">share card</a>}
                <a href="/sill" className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition hover:bg-[#e8e8ed]">leave a sill note</a>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); knock(); }} className="mt-8 flex gap-2">
                <input value={line} onChange={(e) => setLine(e.target.value.slice(0, 200))} placeholder="knock, short" className="flex-1 rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" />
                <button disabled={busy} className="rounded-full bg-[#0A84FF] px-4 py-2 text-[14px] font-medium text-white disabled:opacity-50">knock</button>
              </form>
              {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
              <ul className="mt-5 space-y-2">
                {knocks.map((k) => (
                  <li key={k.id} className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px]">
                    {k.line}
                    <span className="ml-2 text-[13px] text-[#6e6e73]">{k.author || 'someone'}</span>
                  </li>
                ))}
                {!knocks.length && <li className="text-[14px] text-[#6e6e73]">no knocks yet.</li>}
              </ul>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
            <label className="block text-[13px] text-[#6e6e73]">greeting over the door</label>
            <input value={greeting} onChange={(e) => setGreeting(e.target.value.slice(0, 160))} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="come in if you know the name" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">hours</label>
            <input value={hours} onChange={(e) => setHours(e.target.value.slice(0, 80))} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">what a knock should say</label>
            <input value={hint} onChange={(e) => setHint(e.target.value.slice(0, 160))} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="optional" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">signed</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 60))} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" />
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-4 text-[15px] transition hover:bg-[#fafafa]">
              <span className="truncate pr-3">{file ? file.name : 'choose a local file'}</span>
              <span className="shrink-0 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-2 text-[13px] text-[#a15c07]">{slow}</p>}
            {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} onClick={hang} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0071e3] disabled:opacity-60">{busy ? 'hanging…' : 'hang the lintel'}</button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
