import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Note = { id: string; text: string; created: number };

const KEY = 'rankvault-quietnotes';

export default function QuietNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  }, []);

  const saveLocal = (next: Note[]) => {
    setNotes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = () => {
    if (!draft.trim()) return;
    const next = [{ id: Math.random().toString(36).slice(2, 10), text: draft.trim(), created: Date.now() }, ...notes];
    saveLocal(next);
    setDraft('');
  };

  const remove = (id: string) => saveLocal(notes.filter((n) => n.id !== id));

  const publishAll = async () => {
    if (!notes.length) return;
    setBusy(true);
    setWarn(null);
    try {
      const text = notes.map((n) => `— ${new Date(n.created).toLocaleString()}\n${n.text}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      if (blob.size > 5_000_000) setWarn('Long collection. Upload may feel slower.');
      const file = new File([blob], 'quiet-notes.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: 'quiet notes collection',
        cardTitle: 'Quiet Notes',
        meta: { desk: 'quietnotes', count: notes.length },
      });
      if (res.ok && res.id) {
        const urls = shareUrls(res.id);
        setLink(urls?.embed || null);
      }
    } catch (e: any) {
      setWarn(e.message || 'publish failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-6 md:p-10 shadow-2xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Quiet Notes</h1>
          <p className="text-neutral-400 text-sm mb-6">A local collection of short notes. Publish the whole set as a shared text file with a polished Discord embed. Soft warnings only.</p>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="a quiet note…"
            rows={3}
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 resize-none"
          />
          <button onClick={add} className="mb-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 transition">
            add note
          </button>

          <AnimatePresence>
            {notes.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <p className="text-sm text-white whitespace-pre-wrap">{n.text}</p>
                <div className="mt-2 flex justify-between text-xs text-neutral-500">
                  <span>{new Date(n.created).toLocaleString()}</span>
                  <button onClick={() => remove(n.id)} className="hover:text-white">remove</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {notes.length > 0 && (
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={publishAll}
                disabled={busy}
                className="px-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-100 disabled:opacity-50 transition"
              >
                {busy ? 'publishing…' : `publish ${notes.length} notes`}
              </button>
              {link && (
                <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">
                  share link
                </a>
              )}
            </div>
          )}
          {warn && <p className="mt-3 text-xs text-amber-400">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
