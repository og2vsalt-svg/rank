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

type Proof = {
  id: string;
  file_name: string;
  size: number;
  sha256: string;
  note: string | null;
  author: string | null;
  share_id: string | null;
};

function rid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function saveProof(row: Proof) {
  const res = await fetch(`${SB_URL}/rest/v1/proofs`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'proof save failed');
}

async function loadProof(id: string): Promise<Proof | null> {
  const res = await fetch(`${SB_URL}/rest/v1/proofs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function ProofPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [alsoFile, setAlsoFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [hash, setHash] = useState('');
  const [opened, setOpened] = useState<Proof | null>(null);
  const [link, setLink] = useState('');

  const slow = useMemo(() => !!file && file.size > 12 * 1024 * 1024, [file]);

  useEffect(() => {
    if (!shareId) return;
    loadProof(shareId).then(setOpened);
  }, [shareId]);

  async function send() {
    setErr('');
    setWarn('');
    setHash('');
    if (!file) return setErr('choose a local file first');
    setBusy(true);
    try {
      if (file.size > 12 * 1024 * 1024) setWarn('hashing a large file in the tab can feel slow. nothing is refused.');
      const digest = await sha256(file);
      setHash(digest);
      let shareIdOut: string | null = null;
      if (alsoFile) {
        const slip = new File(
          [`${file.name}\n${file.size} bytes\nsha-256 ${digest}\n${note}\n`],
          `${file.name}.proof.txt`,
          { type: 'text/plain' },
        );
        const pub = await publishLocalFile(slip, { caption: note, author, cardTitle: file.name });
        if (!pub.ok || !pub.id) throw new Error(pub.error || 'could not file the slip');
        if (pub.warn) setWarn(pub.warn);
        shareIdOut = pub.id;
      }
      const id = rid();
      await saveProof({
        id,
        file_name: file.name,
        size: file.size,
        sha256: digest,
        note: note.trim() || null,
        author: author.trim() || null,
        share_id: shareIdOut,
      });
      const app = `${location.origin}/proof/${id}`;
      setLink(app);
      try { await navigator.clipboard.writeText(app); } catch { /* optional */ }
    } catch (e: any) {
      setErr(e?.message || 'could not write the proof');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#30d158] mb-2">proof</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a checksum, not a cabinet</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            The hash is computed on this machine. File the slip if you want a link Discord can unfurl. The original stays put unless you also file a text proof. No size gate — only a warning when the tab may pause.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-6">
            <p className="text-xs text-neutral-500 mb-1">{opened.author || 'unsigned'} · {opened.size} bytes</p>
            <h2 className="text-white font-medium mb-2">{opened.file_name}</h2>
            <p className="text-xs font-mono text-neutral-300 break-all">{opened.sha256}</p>
            {opened.note && <p className="text-sm text-neutral-400 mt-3">{opened.note}</p>}
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30 transition-colors">
            <input type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setHash(''); }} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'choose a local file to hash'}</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="what this proof is for" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-20 mb-3" />
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4" />
          <label className="flex items-center gap-2 text-sm text-neutral-300 mb-4">
            <input type="checkbox" checked={alsoFile} onChange={(e) => setAlsoFile(e.target.checked)} />
            also file a text slip in the share table
          </label>
          {slow && <p className="text-xs text-amber-300 mb-3">large file. hashing in the tab may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-300 mb-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {hash && <p className="text-xs font-mono text-neutral-300 break-all mb-3">{hash}</p>}
          {link && <p className="text-xs text-[#64d2ff] mb-3 break-all">{link}</p>}
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
            {busy ? 'hashing…' : 'write the proof'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
