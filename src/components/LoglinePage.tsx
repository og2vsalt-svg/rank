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

type Filed = { id: string; name: string; mime?: string; size: number; caption?: string; author?: string; file_url?: string; created_at?: string; meta?: { bearing?: string } };

export default function LoglinePage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [bearing, setBearing] = useState('');
  const [warn, setWarn] = useState('');
  const [status, setStatus] = useState('the file stays on this machine until you file it.');
  const [card, setCard] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Filed | null>(null);

  useEffect(() => {
    if (!shareId) return;
    fetch('/api/logline?list=1').then((r) => r.json()).then((data) => {
      const hit = (data.files || []).find((row: Filed) => row.id === shareId);
      if (hit) setOpen(hit);
    }).catch(() => {});
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setCard('');
    if (next && next.size > 8 * 1024 * 1024) setWarn('this one is heavy. the line will still take it, but the transfer can feel slow.');
    else setWarn('');
  }

  async function fileIt() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('writing the row…');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', caption.trim());
      body.append('author', author.trim());
      body.append('bearing', bearing.trim());
      const r = await fetch('/api/logline', { method: 'POST', body });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.id) throw new Error(data.error || 'the share table did not take the file');
      const path = `${window.location.origin}/logline/${data.id}`;
      setCard(path);
      setStatus(data.warn || 'filed. paste the link in Discord.');
      if (data.warn) setWarn(data.warn);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file that drop');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">bearing</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">logline</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">A local file is written into the share table with a bearing note. There is no size gate. A heavy file only gets a note that it may feel slow. Paste /logline/id in Discord for the card.</p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <label className="flex cursor-pointer flex-col items-center rounded-[22px] border border-dashed border-black/10 bg-[#f5f5f7] px-6 py-10 text-center transition duration-300 hover:-translate-y-0.5">
            <span className="text-[15px] font-medium">{file ? file.name : 'choose a file from this machine'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'nothing is uploaded until you file it'}</span>
            <input type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0] || null)} />
          </label>
          <input value={bearing} onChange={(e) => setBearing(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="bearing, optional — 042 or north" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="a short note for the card" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {warn && <p className="mt-3 text-[13px] text-[#b25000]">{warn}</p>}
          <button type="button" disabled={!file || busy} onClick={fileIt} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">{busy ? 'filing…' : 'file on logline'}</button>
          <p className="mt-3 text-[13px] text-[#6e6e73]">{status}</p>
          {card && <a className="mt-2 block break-all text-[14px] text-[#0A84FF]" href={card}>{card}</a>}
        </motion.section>
        {open && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[22px] bg-white px-5 py-4 ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">opened bearing</p>
            <h2 className="mt-1 text-[20px] font-medium">{open.name}</h2>
            <p className="mt-1 text-[14px] text-[#6e6e73]">{open.meta?.bearing ? `bearing ${open.meta.bearing} · ` : ''}{open.caption || 'no note'} · {pretty(open.size)}</p>
            {open.file_url && <a className="mt-3 inline-block text-[14px] text-[#0A84FF]" href={open.file_url}>download</a>}
          </motion.section>
        )}
        <p className="mt-8 text-[13px] text-[#6e6e73]">The index of these rows lives on <a className="text-[#0A84FF]" href="/chipboard">chipboard</a>. Older desks stay where they are.</p>
      </main>
    </div>
  );
}
