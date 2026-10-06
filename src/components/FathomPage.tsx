import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

type Drop = {
  id: string;
  place: string;
  note: string | null;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  share_id: string | null;
  author: string | null;
  excerpt: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function FathomPage() {
  const { shareId, navigate } = useRouter();
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  async function load(id?: string | null) {
    const q = id ? `?id=${encodeURIComponent(id)}` : '';
    const r = await fetch(`/api/fathom${q}`);
    if (!r.ok) return;
    const data = await r.json();
    setDrops(Array.isArray(data.drops) ? data.drops : []);
  }

  useEffect(() => {
    load(shareId).catch(() => setErr('could not read the fathom table'));
  }, [shareId]);

  function onFile(next: File | null) {
    setFile(next);
    setWarn(next && next.size > 12 * 1024 * 1024 ? 'large drop. the tab may feel slow while it sends. nothing is refused.' : '');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr('choose a file from this machine');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      let excerpt = '';
      if (file.type.startsWith('text/') || /\.(txt|md|json|csv)$/i.test(file.name)) {
        excerpt = (await file.slice(0, 800).text()).slice(0, 800);
      }
      const published = await publishLocalFile(file, { caption: note, cardTitle: place || file.name });
      if (!published.ok || !published.url) throw new Error(published.error || 'upload did not land');
      const r = await fetch('/api/fathom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: published.id,
          place: place || 'unmarked',
          note,
          name: file.name,
          mime: file.type,
          size: file.size,
          file_url: published.url,
          share_id: published.id,
          excerpt,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the table did not keep the mark');
      const id = data.drop?.id || published.id;
      setLink(`${location.origin}/fathom/${id}`);
      setPlace('');
      setNote('');
      setFile(null);
      await load(shareId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'drop failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <p className="text-[13px] tracking-[0.16em] uppercase text-[#8e8e93] apple-in">fathom</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight apple-in">A depth mark, not a drawer.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl apple-in">
          Pick a file on this machine, name the place it belongs, and it lands in the fathom table. Share links still unfurl in Discord.
        </p>
        <form onSubmit={onSubmit} className="mt-8 apple-card rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3 apple-in">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center cursor-pointer hover:border-[#0a84ff]/60 transition-colors duration-300">
            <input type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            <span className="text-[15px] text-[#d1d1d6]">{file ? file.name : 'Choose a local file'}</span>
            {file ? <span className="block mt-1 text-[13px] text-[#8e8e93]">{pretty(file.size)}</span> : null}
          </label>
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="place, like the north shelf" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition-colors" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what the mark is for" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition-colors" />
          {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
          {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
          {link ? <p className="text-sm break-all text-[#64d2ff]">{link}</p> : null}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition-transform">{busy ? 'Sending…' : 'Drop mark'}</button>
        </form>
        <ul className="mt-8 space-y-2">
          {drops.map((drop) => (
            <li key={drop.id} className="apple-card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 apple-in">
              <button onClick={() => navigate('fathom', drop.id)} className="text-left">
                <p className="text-[15px] font-medium">{drop.place}</p>
                <p className="text-sm text-[#a1a1aa]">{drop.name} · {pretty(Number(drop.size) || 0)}</p>
              </button>
              {drop.note ? <p className="mt-1 text-sm text-[#d1d1d6]">{drop.note}</p> : null}
              {drop.excerpt ? <p className="mt-2 text-[13px] text-[#8e8e93] line-clamp-3">{drop.excerpt}</p> : null}
              <a className="mt-2 inline-block text-sm text-[#64d2ff]" href={drop.file_url} target="_blank" rel="noreferrer">open file</a>
            </li>
          ))}
          {!drops.length ? <li className="text-sm text-[#8e8e93]">No marks yet.</li> : null}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
