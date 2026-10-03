import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Eye = {
  id: string;
  witness: string;
  saw: string;
  name: string;
  mime?: string;
  size: number;
  author?: string;
  file_url?: string;
  created_at?: string;
};

export default function DeadeyePage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [witness, setWitness] = useState('');
  const [saw, setSaw] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [status, setStatus] = useState('a witness line, a local file, a row in the deadeyes table.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<Eye[]>([]);
  const [open, setOpen] = useState<Eye | null>(null);

  useEffect(() => {
    fetch('/api/deadeye')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.deadeyes) ? data.deadeyes : []))
      .catch(() => setRecent([]));
  }, [card]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/deadeye?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setOpen(data.deadeye || null))
      .catch(() => setOpen(null));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (next && next.size > 8 * 1024 * 1024) setWarn('this one is heavy. the write can feel slow. it is still accepted.');
    else setWarn('');
  }

  async function fileIt() {
    if (!file || busy) return;
    if (!saw.trim()) {
      setStatus('write one line about what the file is.');
      return;
    }
    setBusy(true);
    setStatus('filing the witness…');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('witness', witness.trim() || file.name);
      body.append('saw', saw.trim());
      body.append('author', author.trim() || 'deadeye');
      const r = await fetch('/api/deadeye', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the deadeyes table did not take the file');
      const origin = window.location.origin;
      setCard(`${origin}/deadeye/${data.id}`);
      setStatus(data.warn || 'filed. paste the card in Discord.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file that witness');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">
          deadeye
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-[40px] leading-none font-semibold tracking-tight"
        >
          A witness, not a drawer.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Name who saw the file, write one line about it, then drop the local file. It lands in the deadeyes table. Discord unfurls the link. Nothing is refused for size.
        </p>

        {open && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 rounded-3xl p-5">
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/35">{open.witness}</p>
            <p className="mt-2 text-[18px] tracking-tight">{open.saw}</p>
            <p className="mt-2 text-[13px] text-white/45">{open.name} · {pretty(Number(open.size) || 0)}{open.author ? ` · ${open.author}` : ''}</p>
            {open.file_url && (
              <a href={open.file_url} className="mt-4 inline-flex rounded-full bg-white text-black px-4 py-2 text-[13px] font-medium">open the file</a>
            )}
          </motion.article>
        )}

        <motion.label
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 block rounded-3xl p-8 cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0] || null);
          }}
        >
          <input className="sr-only" type="file" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <div className="text-[17px] font-medium">{file ? file.name : 'Drop a file, or click to choose'}</div>
          <div className="mt-1 text-[13px] text-white/45">{file ? pretty(file.size) : 'original name kept. no size cap.'}</div>
          {warn && <p className="mt-3 text-[13px] text-amber-200/90">{warn}</p>}
        </motion.label>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={witness} onChange={(e) => setWitness(e.target.value)} placeholder="who saw it" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
        </div>
        <input value={saw} onChange={(e) => setSaw(e.target.value)} placeholder="what the file is, in one line" className="glass mt-3 w-full rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={fileIt} disabled={!file || busy} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'Filing…' : 'File the witness'}
          </button>
          <span className="text-[13px] text-white/50">{status}</span>
        </div>

        {card && (
          <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={card} className="glass mt-6 block rounded-2xl px-4 py-3 text-[14px] text-[#64b5ff]">
            {card}
          </motion.a>
        )}

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[13px] tracking-[0.14em] uppercase text-white/35">recent witnesses</h2>
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 8).map((row) => (
                <li key={row.id}>
                  <a href={`/deadeye/${row.id}`} className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[14px]">
                    <span className="min-w-0">
                      <span className="text-white/80">{row.witness}</span>
                      <span className="text-white/40"> · {row.saw}</span>
                    </span>
                    <span className="shrink-0 text-white/35">{pretty(Number(row.size) || 0)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
