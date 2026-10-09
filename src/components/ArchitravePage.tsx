import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;
const SLOW_AT = 12 * 1024 * 1024;

function pretty(bytes?: number) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function ArchitravePage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [beam, setBeam] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/architrave?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing beam');
        setBeam(data.beam || '');
        setForWhom(data.for_whom || '');
        setAuthor(data.author || '');
        setLink(data.link || '');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that beam'));
  }, [shareId]);

  const slow = useMemo(
    () => (file && file.size >= SLOW_AT ? `this drop is ${pretty(file.size)}. it will go through, it may just take a moment.` : ''),
    [file],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !beam.trim()) {
      setErr('add a file, a line, or both');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn(slow);
    try {
      let shareIdOut = '';
      let name = file?.name || 'beam';
      let mime = file?.type || '';
      let size = file?.size || 0;
      if (file) {
        const body = new FormData();
        body.set('file', file);
        body.set('author', author);
        body.set('caption', beam);
        body.set('cardTitle', 'architrave');
        const up = await fetch('/api/share', { method: 'POST', body });
        const saved = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(saved.error || 'the file did not land in the share table');
        shareIdOut = saved.id;
        if (saved.warn) setWarn(saved.warn);
      }
      const noteRes = await fetch('/api/architrave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beam, forWhom, author, shareId: shareIdOut, name, mime, size }),
      });
      const data = await noteRes.json().catch(() => ({}));
      if (!noteRes.ok) throw new Error(data.error || 'the beam did not land');
      setLink(data.link || '');
      if (data.warn) setWarn(data.warn);
      navigate('architrave', data.id);
      try {
        await navigator.clipboard.writeText(data.link || '');
      } catch {}
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'architrave failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#64d2ff] text-sm font-medium tracking-wide">
          beam
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight"
        >
          a beam over the door.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="mt-4 text-neutral-400 text-lg leading-relaxed">
          Drop a local file into the share table and name who it carries. The reply lives on the taenia band, not in another drawer. Large files are warned, never refused.
        </motion.p>
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="glass rounded-[28px] p-6 mt-10 apple-card"
        >
          <label className="block text-[13px] text-neutral-400 mb-2">local file</label>
          <input
            type="file"
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              setFile(next);
              setWarn(next && next.size >= SLOW_AT ? `this drop is ${pretty(next.size)}. it will go through, it may just take a moment.` : '');
            }}
            className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
          />
          {warn && <p className="mt-3 text-[13px] text-[#ffd60a]">{warn}</p>}
          <label className="block mt-5 text-[13px] text-neutral-400 mb-2">line on the beam</label>
          <textarea value={beam} onChange={(event) => setBeam(event.target.value)} rows={4} placeholder="what this file is carrying" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <input value={forWhom} onChange={(event) => setForWhom(event.target.value)} placeholder="for" className="rounded-full bg-black/30 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25" />
            <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="from" className="rounded-full bg-black/30 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25" />
          </div>
          {err && <p className="mt-4 text-sm text-[#ff375f]">{err}</p>}
          {link && <p className="mt-4 text-sm text-[#30d158] break-all">copied {link}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button disabled={busy} className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-60">
              {busy ? 'setting the beam…' : 'set the beam'}
            </button>
            <a href="/taenia" className="inline-flex px-5 py-2.5 rounded-full bg-white/10 text-sm">
              open the band
            </a>
          </div>
        </motion.form>
      </main>
      <Footer />
    </div>
  );
}
