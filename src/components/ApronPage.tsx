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

type Drop = {
  id: string;
  for_name: string;
  note: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  author: string | null;
  created_at: string;
  warn?: string | null;
};

export default function ApronPage() {
  const { shareId, navigate } = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [focus, setFocus] = useState<Drop | null>(null);
  const [forName, setForName] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/apron');
    const data = await res.json();
    setDrops(Array.isArray(data.drops) ? data.drops : []);
  }

  useEffect(() => {
    load().catch(() => setError('apron is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/apron?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a file on this machine');
      return;
    }
    setBusy(true);
    setError('');
    setWarn('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/apron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, name: file.name, type: file.type, size: file.size, forName, note, author }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'apron did not take it');
      if (data.warn) setWarn(data.warn);
      const path = data.sharePath || `/apron/${data.id}`;
      setLink(window.location.origin + path);
      navigate('apron', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'apron did not take it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#64d2ff] mb-3">receiving</p>
          <h1 className="text-4xl font-semibold tracking-tight">apron</h1>
          <p className="text-neutral-400 mt-3 max-w-xl">Leave one local file for a person, with a folded note. The bytes go to storage and a row in the share table. Not a vault drawer. Large drops are warned, never refused.</p>
          {focus ? (
            <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mt-8">
              <p className="text-sm text-neutral-500">for {focus.for_name}</p>
              <h2 className="text-2xl font-medium mt-1">{focus.file_name}</h2>
              {focus.note && <p className="text-neutral-300 mt-3">{focus.note}</p>}
              <p className="text-sm text-neutral-500 mt-3">{prettySize(Number(focus.size) || 0)}{focus.author ? ` · from ${focus.author}` : ''}</p>
              {focus.warn && <p className="text-amber-300/90 text-sm mt-3">{focus.warn}</p>}
              {focus.file_url && <a href={focus.file_url} className="inline-flex mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium" download>take the file</a>}
            </motion.article>
          ) : (
            <form onSubmit={leave} className="glass rounded-[28px] p-6 mt-8 space-y-4">
              <label className="block text-sm text-neutral-300">
                for
                <input value={forName} onChange={(e) => setForName(e.target.value)} placeholder="their name" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                folded note
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="open when you sit down" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 hover:border-white/30 transition cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file ? `${file.name} · ${prettySize(file.size)}` : 'choose a file on this machine'}
              </label>
              {file && file.size > SLOW && <p className="text-amber-300/90 text-sm">large drop. it will not be refused. preview clients may feel slow.</p>}
              {warn && <p className="text-amber-300/90 text-sm">{warn}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#64d2ff] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">{busy ? 'leaving it…' : 'leave it on the apron'}</button>
            </form>
          )}
          {drops.length > 0 && (
            <ul className="mt-8 space-y-2">
              {drops.map((row) => (
                <li key={row.id}>
                  <button onClick={() => navigate('apron', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform">
                    <span className="text-white">{row.file_name}</span>
                    <span className="text-neutral-500 text-sm"> · for {row.for_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
