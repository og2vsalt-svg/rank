import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Line = { id: string; share_id: string; body: string; author?: string | null; created_at?: string };

export default function MarginPage() {
  const [shareId, setShareId] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  const load = (id: string) => {
    if (!id.trim()) return;
    fetch(`/api/desk?desk=margins&shareId=${encodeURIComponent(id.trim())}`)
      .then((r) => r.json())
      .then((d) => setLines(Array.isArray(d?.margins) ? d.margins : []))
      .catch(() => setLines([]));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('share') || '';
    if (from) {
      setShareId(from);
      load(from);
    }
  }, []);

  const send = async () => {
    if (!shareId.trim() || !body.trim()) return;
    setBusy(true);
    setError('');
    const row = await fetch('/api/desk?desk=margins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId: shareId.trim(), body: body.trim(), author: author.trim() || 'margin' }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!row?.ok) {
      setError(row?.error || 'the line did not stick');
      return;
    }
    setBody('');
    setCard(`${location.origin}/s/${shareId.trim()}`);
    load(shareId.trim());
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">notes</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">margin</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            a line beside a file that already landed. nothing new is uploaded. the note lives in the margin table, not in a drawer.
          </p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <input value={shareId} onChange={(e) => setShareId(e.target.value)} onBlur={() => load(shareId)} className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="share id, from /s/" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="mt-3 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="the line in the margin" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {error && <p className="mt-3 text-[13px] text-[#ff3b30]">{error}</p>}
          <button type="button" disabled={!shareId.trim() || !body.trim() || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'writing…' : 'leave the line'}
          </button>
          {card && <a className="mt-4 block text-[14px] text-[#0A84FF]" href={card}>{card}</a>}
        </motion.section>
        {lines.length > 0 && (
          <section className="mt-8 space-y-3">
            {lines.map((line) => (
              <article key={line.id} className="rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5">
                <p className="text-[15px] leading-relaxed">{line.body}</p>
                <p className="mt-1 text-[13px] text-[#6e6e73]">{line.author || 'unsigned'}{line.created_at ? ` · ${new Date(line.created_at).toLocaleString()}` : ''}</p>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
