import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Receipt = {
  id: string;
  name: string;
  sha256: string;
  size: number;
  mime: string | null;
  note: string | null;
  file_url: string | null;
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function TallyPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let gone = false;
    fetch(`${SB_URL}/rest/v1/tally_receipts?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((rows) => {
        if (!gone && Array.isArray(rows)) setRow(rows[0] || null);
      })
      .catch(() => {
        if (!gone) setErr('could not load the receipt');
      });
    return () => {
      gone = true;
    };
  }, [shareId]);

  const stamp = async () => {
    if (!file) {
      setErr('pick a local file');
      return;
    }
    setBusy(true);
    setErr('');
    if (file.size > 40 * 1024 * 1024) setWarn('hashing a large file can pause the tab. it is not refused.');
    try {
      const hash = await sha256(file);
      let fileUrl: string | null = null;
      if (keep) {
        const up = await publishLocalFile(file, { caption: note, cardTitle: file.name, meta: { desk: 'tally', sha256: hash } });
        if (!up.ok || !up.url) throw new Error(up.error || 'upload failed');
        fileUrl = up.url;
        if (up.warn) setWarn(up.warn);
      }
      const id = uid();
      const body = {
        id,
        name: file.name,
        sha256: hash,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        note: note.trim() || null,
        file_url: fileUrl,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/tally_receipts`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(body),
      });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180));
      navigate('tally', id);
    } catch (e: any) {
      setErr(e?.message || 'could not stamp the receipt');
    } finally {
      setBusy(false);
    }
  };

  const link = row ? `${location.origin}/tally/${row.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">tally</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">Stamp a file receipt.</h1>
          <p className="text-neutral-400 mb-8">Hash the local file in the browser, optionally keep the bytes in the database, and share a Discord card of the receipt.</p>
        </motion.div>
        {row ? (
          <section className="glass rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-1">{row.name}</h2>
            <p className="text-sm text-neutral-500 mb-4">{pretty(Number(row.size) || 0)} · {row.mime || 'file'}</p>
            <p className="text-xs text-neutral-400 break-all font-mono bg-black/30 rounded-2xl p-4 mb-4">{row.sha256}</p>
            {row.note && <p className="text-sm text-neutral-300 mb-4">{row.note}</p>}
            <div className="flex flex-wrap gap-2">
              <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">{copied ? 'copied' : 'copy discord link'}</button>
              {row.file_url && <a href={row.file_url} className="px-4 py-2 rounded-full bg-white/5 text-sm" download={row.name}>download file</a>}
              <button onClick={() => navigate('tally')} className="px-4 py-2 rounded-full bg-white/5 text-sm">new receipt</button>
            </div>
          </section>
        ) : (
          <section className="glass rounded-3xl p-6 sm:p-8">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-sm text-neutral-400 cursor-pointer hover:border-[#0a84ff]/40 transition">
              <span>{file ? file.name : 'choose a local file'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="note for the receipt" className="w-full mt-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
            <label className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
              also upload the file into the share database
            </label>
            {warn && <p className="text-xs text-[#ff9f0a] mt-3">{warn}</p>}
            {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
            <button disabled={busy} onClick={stamp} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'stamping…' : 'stamp receipt'}</button>
          </section>
        )}
      </main>
    </div>
  );
}
