import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from './Navbar';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RatlinePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [line, setLine] = useState('');
  const [status, setStatus] = useState('several local files, one line, one row each.');
  const [warn, setWarn] = useState('');
  const [cards, setCards] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function pick(list: FileList | null) {
    const next = list ? Array.from(list) : [];
    setFiles(next);
    setCards([]);
    setWarn(next.some((file) => file.size > 8 * 1024 * 1024) ? 'one of these is heavy. each write can feel slow. none are refused.' : '');
  }

  async function drain() {
    if (!files.length || busy) return;
    setBusy(true);
    const batch = Date.now().toString(36);
    const origin = window.location.origin;
    const made: string[] = [];
    try {
      for (const file of files) {
        setStatus(`climbing ${file.name}…`);
        const body = new FormData();
        body.append('file', file, file.name);
        body.append('line', line.trim() || 'ratline');
        body.append('note', `ratline batch ${batch}`);
        body.append('author', 'ratline');
        body.append('batch', batch);
        const r = await fetch('/api/hounds', { method: 'POST', body });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `could not file ${file.name}`);
        made.push(`${origin}/hounds/${data.id}`);
        setCards([...made]);
      }
      setStatus('filed. each file has its own Discord card.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'the climb stopped');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">
          ratline
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-[40px] leading-none font-semibold tracking-tight"
        >
          Climb with a pile.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/60">
          Different from the vault and from the local scupper list. These files leave the tab and land in the hounds table, one row and one Discord card each.
        </p>
        <motion.label initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 block rounded-3xl p-8 cursor-pointer">
          <input className="sr-only" type="file" multiple onChange={(e) => pick(e.target.files)} />
          <div className="text-[17px] font-medium">{files.length ? `${files.length} files ready` : 'Choose a few files'}</div>
          <div className="mt-1 text-[13px] text-white/45">{files.length ? files.map((file) => file.name).join(', ') : 'they go one after another. no size cap.'}</div>
          {warn && <p className="mt-3 text-[13px] text-amber-200/90">{warn}</p>}
        </motion.label>
        <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="shared line" className="glass mt-4 w-full rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={drain} disabled={!files.length || busy} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40">
            {busy ? 'Filing…' : 'File the pile'}
          </button>
          <span className="text-[13px] text-white/50">{status}</span>
        </div>
        {cards.length > 0 && (
          <ul className="mt-6 space-y-2">
            {cards.map((href) => (
              <li key={href}>
                <a href={href} className="glass block rounded-2xl px-4 py-3 text-[14px] text-[#64b5ff]">{href}</a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
