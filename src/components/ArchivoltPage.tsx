import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Mark = { id: string; title: string; note: string; at: string };

const KEY = 'rankvault-archivolt';

export default function ArchivoltPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setMarks(JSON.parse(raw));
    } catch {
      setMarks([]);
    }
  }, []);

  const save = (next: Mark[]) => {
    setMarks(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!title.trim()) return;
    save([{ id: crypto.randomUUID(), title: title.trim(), note: note.trim(), at: new Date().toISOString() }, ...marks]);
    setTitle('');
    setNote('');
  };

  const fileList = async () => {
    setBusy(true);
    setErr('');
    const body = marks.map((m) => `- ${m.title}${m.note ? ` — ${m.note}` : ''} (${m.at.slice(0, 10)})`).join('\n') || 'empty arch';
    const file = new File([`archivolt\n\n${body}\n`], 'archivolt.txt', { type: 'text/plain' });
    const res = await publishLocalFile(file, { cardTitle: 'archivolt', caption: `${marks.length} marks` });
    setBusy(false);
    if (!res.ok || !res.id) {
      setErr(res.error || 'could not file the list');
      return;
    }
    setLink(shareUrls(res.id).embed);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">reading</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">archivolt</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            Chapter marks stay in this browser. Filing writes one note into the share table so Discord can unfurl the list.
          </p>
        </motion.div>

        <section className="glass mt-8 rounded-3xl p-5 sm:p-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="chapter or page" className="w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what to remember" rows={3} className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={add} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium">add mark</button>
            <button onClick={fileList} disabled={busy} className="rounded-full bg-white/10 px-5 py-2.5 text-sm disabled:opacity-40">{busy ? 'filing…' : 'file the list'}</button>
          </div>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm text-neutral-300 break-all">{link}</p>}
        </section>

        <ul className="mt-4 space-y-2">
          {marks.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-sm text-neutral-100">{m.title}</p>
                {m.note && <p className="text-sm text-neutral-400 mt-1">{m.note}</p>}
              </div>
              <button onClick={() => save(marks.filter((x) => x.id !== m.id))} className="text-xs text-white/40 hover:text-white">remove</button>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
