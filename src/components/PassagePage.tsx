import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Passage = {
  id: string;
  to_name: string;
  from_name: string | null;
  note: string | null;
  share_id: string | null;
  file_name: string | null;
  size: number;
  created_at: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function headers() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

export default function PassagePage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [toName, setToName] = useState('');
  const [fromName, setFromName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('a named handoff. the file lands in the share table. the slip lives beside it.');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [open, setOpen] = useState<Passage | null>(null);
  const [recent, setRecent] = useState<Passage[]>([]);

  async function loadRecent() {
    const r = await fetch(`${SB_URL}/rest/v1/passages?select=*&order=created_at.desc&limit=12`, { headers: headers() });
    const data = await r.json();
    if (r.ok && Array.isArray(data)) setRecent(data);
  }

  useEffect(() => {
    loadRecent().catch(() => setStatus('could not read recent passages'));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/passages?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows) && rows[0]) setOpen(rows[0]);
      })
      .catch(() => setStatus('that passage did not load'));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (next && next.size > 12 * 1024 * 1024) setWarn('large file. the tab may feel slow while it sends. nothing is refused.');
    else setWarn('');
  }

  async function send() {
    if (!file || !toName.trim() || busy) return;
    setBusy(true);
    setStatus('filing the local file, then writing the slip...');
    const pub = await publishLocalFile(file, {
      caption: note,
      author: fromName || 'passage',
      cardTitle: `${file.name} for ${toName.trim()}`,
    });
    if (!pub.ok || !pub.id) {
      setBusy(false);
      setStatus(pub.error || 'the file did not land');
      return;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const row = {
      id,
      to_name: toName.trim().slice(0, 80),
      from_name: fromName.trim().slice(0, 80) || null,
      note: note.trim().slice(0, 280) || null,
      share_id: pub.id,
      file_name: file.name.slice(0, 240),
      size: file.size,
    };
    const r = await fetch(`${SB_URL}/rest/v1/passages`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(row),
    });
    setBusy(false);
    if (!r.ok) {
      setStatus('file is shared, but the slip did not write. the card still works.');
      setCard(pub.embed || shareUrls(pub.id).embed);
      return;
    }
    const origin = window.location.origin;
    setCard(`${origin}/passage/${id}`);
    setStatus(pub.warn || 'handed off. paste the passage link in Discord.');
    setFile(null);
    setNote('');
    await loadRecent();
  }

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.16em] uppercase text-[#64d2ff]">
          passage
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-2 text-[44px] sm:text-6xl font-semibold tracking-[-0.045em] leading-none">
          Hand it to a name.
        </motion.h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/60">
          Not a drawer. A local file goes into the share table, and a short slip says who it is for. Discord unfurls the passage link.
        </p>

        {open && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[12px] text-white/40">for {open.to_name}</p>
            <p className="mt-1 text-[20px] font-medium tracking-tight">{open.file_name || 'a file'}</p>
            <p className="mt-2 text-[14px] text-white/65">{open.note || 'no note on the slip.'}</p>
            <p className="mt-2 text-[12px] text-white/35">{open.from_name || 'someone'} · {pretty(Number(open.size) || 0)}</p>
            {open.share_id && (
              <a className="mt-4 inline-flex rounded-full bg-white text-black px-4 py-2 text-[13px] font-medium" href={shareUrls(open.share_id).embed}>
                open the file
              </a>
            )}
          </motion.section>
        )}

        <motion.label
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.55, ease }}
          className="mt-8 block rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center cursor-pointer transition-colors duration-300 hover:border-[#0a84ff]/50 hover:bg-white/[0.05]"
        >
          <input type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <span className="text-[16px] text-white/85">{file ? file.name : 'choose a local file'}</span>
          {file && <span className="mt-2 block text-[13px] text-white/40">{pretty(file.size)}</span>}
        </motion.label>
        {warn && <p className="mt-3 text-[13px] text-amber-200/90">{warn}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="for whom" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] outline-none transition focus:border-[#0a84ff]/60" />
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="from" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] outline-none transition focus:border-[#0a84ff]/60" />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line they should read first" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] outline-none transition focus:border-[#0a84ff]/60" />
        <button disabled={!file || !toName.trim() || busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition duration-200 hover:bg-neutral-200 disabled:opacity-40">
          {busy ? 'sending' : 'send the passage'}
        </button>
        <p className="mt-4 text-[13px] text-white/45">{status}</p>
        {card && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-[12px] text-white/40">Discord card</p>
            <a className="mt-1 block break-all text-[#64d2ff]" href={card}>{card}</a>
          </div>
        )}
        <section className="mt-12">
          <h2 className="text-[13px] text-white/40">recent slips</h2>
          <ul className="mt-3 space-y-2">
            {recent.map((row) => (
              <li key={row.id}>
                <a href={`/passage/${row.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition duration-200 hover:bg-white/[0.06]">
                  <span className="truncate">{row.file_name || 'file'} <span className="text-white/40">for {row.to_name}</span></span>
                  <span className="shrink-0 text-[12px] text-white/35">{pretty(Number(row.size) || 0)}</span>
                </a>
              </li>
            ))}
            {!recent.length && <li className="text-[13px] text-white/35">no passages yet.</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
