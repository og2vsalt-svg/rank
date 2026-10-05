import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Bell = { id: string; title: string; when_note?: string; body?: string; author?: string; created_at?: string };

export default function VesperPage() {
  const { shareId } = useRouter();
  const [bells, setBells] = useState<Bell[]>([]);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('a watch board. not a file cabinet.');
  const [link, setLink] = useState('');

  async function load() {
    const r = await fetch('/api/vesper');
    const data = await r.json();
    setBells(data.bells || []);
  }

  useEffect(() => {
    load().catch(() => setStatus('the board did not answer'));
    if (!shareId) return;
    fetch(`/api/vesper?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.bell) return;
        setLink(`${window.location.origin}/vesper/${data.bell.id}`);
        setStatus(data.bell.when_note || 'opened from the card');
      })
      .catch(() => {});
  }, [shareId]);

  async function ring() {
    if (!title.trim()) return;
    setStatus('ringing…');
    const r = await fetch('/api/vesper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, when, body, author }),
    });
    const data = await r.json();
    if (!r.ok) {
      setStatus(data.error || 'the board did not take that line');
      return;
    }
    setLink(`${window.location.origin}${data.path}`);
    setTitle('');
    setWhen('');
    setBody('');
    setStatus('on the board. paste the link in Discord.');
    load().catch(() => {});
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">vesper</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] leading-none font-semibold tracking-tight">Ring a watch.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/60">A time and a line, kept beside the files rather than inside them. The vault, folio, and loom stay where they are.</p>
        <div className="mt-8 grid gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what the bell is for" className="glass rounded-2xl px-4 py-3 text-[15px] bg-transparent outline-none" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="when — 6am watch, Friday, after the drop" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who rang it" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the line on the board" rows={3} className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none resize-none" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={ring} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium">Ring it</button>
          <span className="text-[13px] text-white/50">{status}</span>
        </div>
        {link && <a href={link} className="glass mt-5 block rounded-2xl px-4 py-3 text-[14px] text-[#64b5ff]">{link}</a>}
        <div className="mt-8 space-y-2">
          {bells.map((bell, i) => (
            <motion.button
              key={bell.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => { setLink(`${window.location.origin}/vesper/${bell.id}`); history.pushState(null, '', `/vesper/${bell.id}`); }}
              className="glass w-full text-left rounded-2xl px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium">{bell.title}</span>
                <span className="text-[12px] text-white/40">{bell.when_note || 'no time'}</span>
              </div>
              {bell.body && <p className="mt-1 text-[13px] text-white/60">{bell.body}</p>}
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
