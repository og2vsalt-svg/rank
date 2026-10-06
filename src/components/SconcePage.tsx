import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Line = { id: string; title: string; body: string; author: string | null; created_at: string };

export default function SconcePage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  async function load(id?: string | null) {
    const q = id ? `?id=${encodeURIComponent(id)}` : '';
    const r = await fetch(`/api/sconce${q}`);
    if (!r.ok) return;
    const data = await r.json();
    setLines(Array.isArray(data.lines) ? data.lines : []);
  }

  useEffect(() => {
    load(shareId).catch(() => setErr('could not read the lamp'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/sconce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'could not keep that line');
      setTitle('');
      setBody('');
      if (data.line?.id) setCopied(`${location.origin}/sconce/${data.line.id}`);
      await load(shareId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <p className="text-[13px] tracking-[0.16em] uppercase text-[#8e8e93] apple-in">sconce</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight apple-in">A lamp for lines, not files.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl apple-in">
          Leave a short reading. It stays in its own table. Paste the link in Discord and the card follows.
        </p>
        <form onSubmit={onSubmit} className="mt-8 apple-card rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3 apple-in">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#ffd60a] transition-colors" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="the line you want kept" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#ffd60a] transition-colors resize-y" />
          {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
          {copied ? <p className="text-sm break-all text-[#ffd60a]">{copied}</p> : null}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition-transform">{busy ? 'Keeping…' : 'Keep line'}</button>
        </form>
        <ul className="mt-8 space-y-2">
          {lines.map((line) => (
            <li key={line.id} className="apple-card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 apple-in">
              <p className="text-[15px] font-medium">{line.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#d1d1d6] whitespace-pre-wrap">{line.body}</p>
              <p className="mt-3 text-[12px] text-[#8e8e93]">{location.origin}/sconce/{line.id}</p>
            </li>
          ))}
          {!lines.length ? <li className="text-sm text-[#8e8e93]">The lamp is empty.</li> : null}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
