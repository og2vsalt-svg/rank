import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function fingerprint(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

type Slip = {
  id: string;
  share_id: string;
  file_name: string;
  file_size: number;
  checksum: string | null;
  recipient: string | null;
  handling: string;
  author: string | null;
  hue: string | null;
  created_at: string;
};

export default function StemsonPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [handling, setHandling] = useState('');
  const [recipient, setRecipient] = useState('');
  const [author, setAuthor] = useState('');
  const [hue, setHue] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Slip | null>(null);
  const [recent, setRecent] = useState<Slip[]>([]);
  const [drag, setDrag] = useState(false);

  const heavyNote = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'this file is large. hashing and sending can feel slow. it is not turned away.';
    if (file.size > 12 * 1024 * 1024) return 'bigger than a quick preview. the slip still prints. nothing is refused.';
    return '';
  }, [file]);

  const loadRecent = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/stemsons?select=id,share_id,file_name,file_size,checksum,recipient,handling,author,hue,created_at&order=created_at.desc&limit=8`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setRecent(rows);
  };

  const loadOne = async (id: string) => {
    const res = await fetch(
      `${SB_URL}/rest/v1/stemsons?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]) setRow(rows[0]);
  };

  useEffect(() => {
    loadRecent();
    if (shareId) loadOne(shareId);
  }, [shareId]);

  const take = (next: File | null) => {
    setFile(next);
    setWarn(next && next.size > 12 * 1024 * 1024 ? 'large file. the fingerprint step may pause the tab. the desk does not refuse it.' : '');
  };

  const send = async () => {
    if (!file || !handling.trim()) return;
    setBusy(true);
    setError('');
    let checksum = '';
    try {
      checksum = await fingerprint(file);
    } catch {
      checksum = '';
    }
    const published = await publishLocalFile(file, {
      caption: handling.trim(),
      author: author.trim() || undefined,
      color: hue,
      cardTitle: file.name.slice(0, 120),
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setError(published.error || 'the share table did not take the file');
      return;
    }
    if (published.warn) setWarn(published.warn);
    const id = uid();
    const next = {
      id,
      share_id: published.id,
      file_name: file.name,
      file_size: file.size,
      checksum: checksum || null,
      recipient: recipient.trim() || null,
      handling: handling.trim().slice(0, 280),
      author: author.trim() || null,
      hue,
    };
    const ins = await fetch(`${SB_URL}/rest/v1/stemsons`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(next),
    });
    setBusy(false);
    if (!ins.ok) {
      setError(`slip ${ins.status}: ${(await ins.text()).slice(0, 180)}. the file itself is still at /s/${published.id}`);
      return;
    }
    const saved = await ins.json();
    setRow(Array.isArray(saved) ? saved[0] : { ...next, created_at: new Date().toISOString() });
    setFile(null);
    setHandling('');
    loadRecent();
    history.pushState(null, '', `/stemson/${id}`);
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  const card = row ? `${location.origin}/stemson/${row.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">stemson</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">print a packing slip for a local file.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">not a vault drawer. the file lands in the share table. this desk keeps a handling note, a recipient, and a sha-256 so the other side can check the bytes. paste /stemson in Discord for the card. large files get a warning, never a refusal.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0] || null); }}
          className={`glass rounded-3xl p-6 sm:p-8 transition duration-300 ${drag ? 'ring-2 ring-[#0a84ff]/40 scale-[1.01]' : ''}`}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-left hover:bg-white/[0.05] transition duration-200">
            <p className="text-white font-medium">{file ? file.name : 'choose a local file, or drop it here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'one file. bytes go to the share table, the slip stays here'}</p>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
          <input value={handling} onChange={(e) => setHandling(e.target.value)} placeholder="how to handle it" maxLength={280} className="mt-5 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="text-xs text-neutral-500">
              for, optional
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="who should open it" className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#0a84ff]/50" />
            </label>
            <label className="text-xs text-neutral-500">
              your name, optional
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who packed it" className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#0a84ff]/50" />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={hue} onChange={(e) => setHue(e.target.value)} className="h-8 w-10 rounded-lg bg-transparent border-0" />
            <span className="text-xs text-neutral-500">{hue}</span>
          </label>
          {(warn || heavyNote) && <p className="mt-3 text-xs text-amber-300/90">{warn || heavyNote}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!file || !handling.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'printing the slip…' : 'file and print the slip'}
          </button>
        </motion.div>

        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.handling}</p>
            <p className="text-sm text-neutral-400 mt-1">{row.file_name} · {pretty(Number(row.file_size) || 0)}{row.recipient ? ` · for ${row.recipient}` : ''}</p>
            {row.checksum && <p className="text-[11px] text-neutral-500 mt-2 break-all font-mono">sha-256 {row.checksum}</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              <a href={shareUrls(row.share_id).embed} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white">open the file card</a>
            </div>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">recent slips</p>
            <div className="grid gap-2">
              {recent.map((item) => (
                <a key={item.id} href={`/stemson/${item.id}`} className="glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition duration-200">
                  <p className="text-white text-sm">{item.handling}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.file_name}{item.recipient ? ` · for ${item.recipient}` : ''}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
