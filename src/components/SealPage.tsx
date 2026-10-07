import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Seal = {
  id: string;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  sha256: string;
  witness: string | null;
  note: string;
  warn?: string | null;
};

async function digestOf(file: File) {
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SealPage() {
  const { shareId, navigate } = useRouter();
  const [seals, setSeals] = useState<Seal[]>([]);
  const [focus, setFocus] = useState<Seal | null>(null);
  const [witness, setWitness] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sha, setSha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/seal');
    const data = await res.json();
    setSeals(Array.isArray(data.seals) ? data.seals : []);
  }

  useEffect(() => { load().catch(() => setError('the seal desk is quiet right now')); }, []);

  useEffect(() => {
    if (!shareId) { setFocus(null); return; }
    fetch(`/api/seal?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function pick(next: File | null) {
    setFile(next);
    setSha('');
    setWarn(next && next.size > SLOW ? 'this file is heavy. hashing and opening may feel slow. it is still accepted.' : '');
    if (!next) return;
    try { setSha(await digestOf(next)); } catch { setError('could not hash that file in the browser'); }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !sha) { setError('choose a file on this machine'); return; }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, type: file.type || 'application/octet-stream', dataUrl, sha256: sha, witness: witness.trim(), note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'could not file the seal');
      setLink(data.link);
      if (data.warn) setWarn(data.warn);
      setNote('');
      setFile(null);
      setSha('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not file the seal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 apple-in">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-white/40 mb-3">digest witness</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight">seal</motion.h1>
        <p className="mt-3 text-white/55 leading-relaxed">Hash a local file in the browser, then file the bytes and the digest together. The row lives in the share table. Large drops are warned, never refused. Discord unfurls /seal/id. Not a vault drawer.</p>
        {focus ? (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs uppercase tracking-widest text-white/40">sealed</p>
            <h2 className="text-2xl mt-2 font-medium">{focus.file_name}</h2>
            <p className="text-sm text-white/45 mt-2 break-all font-mono">{focus.sha256}</p>
            <p className="text-white/60 mt-3">{focus.note || 'no note'}</p>
            <p className="text-sm text-white/40 mt-3">{prettySize(Number(focus.size) || 0)}{focus.witness ? ` · ${focus.witness}` : ''}</p>
            {focus.warn ? <p className="text-amber-200/90 text-sm mt-3">{focus.warn}</p> : null}
            {focus.file_url && !String(focus.file_url).startsWith('data:') ? <a className="inline-flex mt-5 px-4 py-2 rounded-full bg-white text-black text-sm" href={focus.file_url}>open the file</a> : null}
          </motion.article>
        ) : null}
        <form onSubmit={send} className="glass rounded-3xl p-6 mt-8 space-y-4">
          <label className="block text-sm text-white/70">witness
            <input value={witness} onChange={(e) => setWitness(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="optional name" />
          </label>
          <label className="block text-sm text-white/70">note
            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="why this digest matters" />
          </label>
          <label className="block text-sm text-white/70">local file
            <input type="file" onChange={(e) => pick(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-white/70" />
          </label>
          {sha ? <p className="text-xs text-white/45 break-all font-mono">{sha}</p> : null}
          {warn ? <p className="text-amber-200/90 text-sm">{warn}</p> : null}
          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {link ? <p className="text-sm text-white/70 break-all">share this: {link}</p> : null}
          <button disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 transition-transform active:scale-[0.98]">{busy ? 'sealing…' : 'seal the file'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {seals.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
              <button onClick={() => navigate('seal', item.id)} className="w-full text-left glass apple-card rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform">
                <span className="block font-medium">{item.file_name}</span>
                <span className="block text-sm text-white/45 truncate">{item.sha256.slice(0, 16)}… · {prettySize(Number(item.size) || 0)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
