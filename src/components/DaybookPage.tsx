import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Entry = { id: string; title: string; body: string; author?: string; mood?: string; created_at?: string };

export default function DaybookPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [mood, setMood] = useState('clear');
  const [status, setStatus] = useState('a page for the day. not a file drawer.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState<Entry | null>(null);

  async function load() {
    const r = await fetch('/api/daybook?list=1');
    const data = await r.json().catch(() => ({}));
    setEntries(data.entries || []);
    return data.entries || [];
  }

  useEffect(() => { load().catch(() => {}); }, [card]);
  useEffect(() => {
    if (!shareId) return;
    load().then((rows) => setOpen(rows.find((row: Entry) => row.id === shareId) || null)).catch(() => {});
  }, [shareId]);

  async function save() {
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/daybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, author, mood }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.id) throw new Error(data.error || 'the daybook did not take that page');
      setCard(`${window.location.origin}/daybook/${data.id}`);
      setStatus('filed. paste the link in Discord.');
      setTitle('');
      setBody('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file that page');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">pages</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">daybook</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">A short page for the day, kept in its own table. It is not a vault. /daybook/id unfurls in Discord.</p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="title" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-3 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="what happened, or what you want to remember" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="name, optional" />
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none">
              <option value="clear">clear</option>
              <option value="quiet">quiet</option>
              <option value="busy">busy</option>
              <option value="stuck">stuck</option>
            </select>
          </div>
          <button type="button" disabled={!title.trim() || !body.trim() || busy} onClick={save} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">{busy ? 'writing…' : 'file the page'}</button>
          <p className="mt-3 text-[13px] text-[#6e6e73]">{status}</p>
          {card && <a className="mt-2 block break-all text-[14px] text-[#0A84FF]" href={card}>{card}</a>}
        </motion.section>
        {open && (
          <article className="mt-8 rounded-[22px] bg-white px-5 py-4 ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">{open.mood || 'page'}</p>
            <h2 className="mt-1 text-[22px] font-medium tracking-tight">{open.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{open.body}</p>
          </article>
        )}
        <section className="mt-8 space-y-3">
          {entries.map((entry) => (
            <a key={entry.id} href={`/daybook/${entry.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5">
              <p className="text-[15px] font-medium">{entry.title}</p>
              <p className="mt-1 line-clamp-2 text-[13px] text-[#6e6e73]">{entry.body}</p>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
