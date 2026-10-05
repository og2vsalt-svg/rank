import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import Navbar from './Navbar';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QuirePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('a local file lands in the share table. no size cap.');
  const [warn, setWarn] = useState('');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);

  const tone = useMemo(() => (warn ? 'text-amber-200/90' : 'text-white/45'), [warn]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (!next) {
      setWarn('');
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setWarn('this one is heavy. the upload can feel slow, especially on a phone. it is still accepted.');
    } else setWarn('');
  }

  async function fileIt() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('writing the row…');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('author', author.trim() || 'folio');
      body.append('caption', caption.trim() || file.name);
      body.append('cardTitle', file.name);
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the share table did not take the file');
      const origin = window.location.origin;
      setCard(`${origin}/s/${data.id}`);
      setStatus(data.warn || 'filed. paste the card in Discord.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file that drop');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">
          folio
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] leading-none font-semibold tracking-tight">
          File it once.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/60">
          The vault stays on this device. Folio is the public desk: one local file, one row in the share table, one Discord card.
        </p>

        <motion.label
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass mt-8 block rounded-3xl p-8 cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0] || null);
          }}
        >
          <input className="sr-only" type="file" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <div className="text-[17px] font-medium">{file ? file.name : 'Drop a file, or click to choose'}</div>
          <div className="mt-1 text-[13px] text-white/45">{file ? pretty(file.size) : 'images, audio, archives, anything the browser can read'}</div>
          {warn && <p className={`mt-3 text-[13px] ${tone}`}>{warn}</p>}
        </motion.label>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the card" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="short caption" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={fileIt} disabled={!file || busy} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40">
            {busy ? 'Filing…' : 'File to the share table'}
          </button>
          <span className="text-[13px] text-white/50">{status}</span>
        </div>

        {card && (
          <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} href={card} className="glass mt-6 block rounded-2xl px-4 py-3 text-[14px] text-[#64b5ff]">
            {card}
          </motion.a>
        )}
      </main>
    </div>
  );
}
