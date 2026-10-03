import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Hound = { id: string; line: string; name: string; size: number; note?: string; author?: string; created_at?: string };

export default function HoundsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [line, setLine] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [status, setStatus] = useState('a line, a local file, a row in the hounds table.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<Hound[]>([]);

  useEffect(() => {
    fetch('/api/hounds')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.hounds) ? data.hounds : []))
      .catch(() => setRecent([]));
  }, [card]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (next && next.size > 8 * 1024 * 1024) setWarn('this one is heavy. the write can feel slow. it is still accepted.');
    else setWarn('');
  }

  async function fileIt() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('pairing the line with the file…');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('line', line.trim() || file.name);
      body.append('note', note.trim());
      body.append('author', author.trim() || 'hounds');
      const r = await fetch('/api/hounds', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the hounds table did not take the file');
      const origin = window.location.origin;
      setCard(`${origin}/hounds/${data.id}`);
      setStatus(data.warn || 'paired. paste the card in Discord.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not pair that drop');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">
          hounds
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-[40px] leading-none font-semibold tracking-tight"
        >
          A line for the file.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/60">
          Not a drawer. Name the line that holds the drop, then file the local file into the hounds table. Discord unfurls the pair.
        </p>

        <motion.label
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass mt-8 block rounded-3xl p-8 cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0] || null);
          }}
        >
          <input className="sr-only" type="file" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <div className="text-[17px] font-medium">{file ? file.name : 'Drop a file, or click to choose'}</div>
          <div className="mt-1 text-[13px] text-white/45">{file ? pretty(file.size) : 'the original name is kept. no size cap.'}</div>
          {warn && <p className="mt-3 text-[13px] text-amber-200/90">{warn}</p>}
        </motion.label>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="line name" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why this line holds it" className="glass mt-3 w-full rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />

        <div className="mt-4 flex items-center gap-3">
          <button onClick={fileIt} disabled={!file || busy} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40">
            {busy ? 'Pairing…' : 'File the pair'}
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
            <h2 className="text-[13px] tracking-[0.14em] uppercase text-white/35">recent pairs</h2>
            <ul className="mt-3 space-y-2">
              {recent.slice(0, 8).map((row) => (
                <li key={row.id}>
                  <a href={`/hounds/${row.id}`} className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-[14px]">
                    <span>
                      <span className="text-white/80">{row.line}</span>
                      <span className="text-white/40"> · {row.name}</span>
                    </span>
                    <span className="text-white/35">{pretty(Number(row.size) || 0)}</span>
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
