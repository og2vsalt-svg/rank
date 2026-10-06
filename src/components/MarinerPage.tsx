import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Mark = { id: string; name: string; mime?: string; size: number; heading?: string; remark?: string; author?: string; file_url?: string; created_at?: string };
type Note = { id: string; body: string; author?: string; created_at?: string };

export default function MarinerPage() {
  const { shareId } = useRouter();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<string | null>(shareId);
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('readings sit beside a filed mark. this is not a drawer.');

  useEffect(() => {
    fetch('/api/lodestone?list=1&page=mariner')
      .then((r) => r.json())
      .then((data) => setMarks(data.marks || []))
      .catch(() => setStatus('the board did not answer.'));
  }, []);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/lodestone?notes=1&id=${encodeURIComponent(active)}&page=mariner`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes || []))
      .catch(() => setNotes([]));
  }, [active]);

  async function addNote() {
    if (!active || !body.trim()) return;
    setStatus('writing the reading…');
    const r = await fetch('/api/lodestone?page=mariner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_id: active, body: body.trim(), author: author.trim() }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(data.error || 'the reading did not stick');
      return;
    }
    setNotes(data.notes || []);
    setBody('');
    setStatus('reading kept. paste /mariner in Discord for the board card.');
  }

  const open = marks.find((row) => row.id === active) || null;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">reading board</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">mariner</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">Marks already filed on lodestone, with a short reading beside each one. Nothing here is a vault. Paste /mariner or /lodestone/id in Discord for the card.</p>
        </motion.div>
        <div className="mt-8 space-y-3">
          {marks.length === 0 && <p className="text-[14px] text-[#6e6e73]">no marks yet. file one on lodestone.</p>}
          {marks.map((row, i) => (
            <motion.button key={row.id} type="button" onClick={() => setActive(row.id)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className={`block w-full rounded-[24px] bg-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.04)] ring-1 transition duration-300 hover:-translate-y-0.5 ${active === row.id ? 'ring-[#0A84FF]' : 'ring-black/5'}`}>
              <p className="text-[13px] text-[#6e6e73]">{row.heading || 'no heading'} · {pretty(row.size)}</p>
              <p className="mt-1 text-[17px] font-semibold tracking-tight">{row.name}</p>
              <p className="mt-1 text-[14px] text-[#6e6e73]">{row.remark || 'no remark'}{row.author ? ` · ${row.author}` : ''}</p>
            </motion.button>
          ))}
        </div>
        {open && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[28px] bg-white p-6 ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">reading for {open.name}</p>
            {open.file_url && <a className="mt-2 inline-block text-[14px] text-[#0A84FF]" href={open.file_url}>download</a>}
            <div className="mt-4 space-y-2">
              {notes.map((note) => (
                <p key={note.id} className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[14px]">{note.body}{note.author ? <span className="text-[#6e6e73]"> · {note.author}</span> : null}</p>
              ))}
              {notes.length === 0 && <p className="text-[13px] text-[#6e6e73]">no readings yet.</p>}
            </div>
            <input value={body} onChange={(e) => setBody(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="a short reading" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
            <button type="button" onClick={addNote} className="mt-3 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white transition duration-300 hover:bg-black active:scale-[0.98]">keep reading</button>
          </motion.section>
        )}
        <p className="mt-4 text-[13px] text-[#6e6e73]">{status}</p>
      </main>
    </div>
  );
}
