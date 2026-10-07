import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Pin = {
  id: string;
  room: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  share_id: string | null;
  accent: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function roomSlug(value: string) {
  return (value || 'hall').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'hall';
}

export default function DadoPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [room, setRoom] = useState('hall');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [pin, setPin] = useState<Pin | null>(null);
  const [wall, setWall] = useState<Pin[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this file is large. the tab may feel slow while it sends. nothing is refused for size.' : ''),
    [file],
  );

  const loadWall = (name: string) => {
    const slug = roomSlug(name);
    sbRest(`dado_pins?room=eq.${encodeURIComponent(slug)}&select=*&order=created_at.desc&limit=24`)
      .then((r) => r.json())
      .then((data) => setWall(Array.isArray(data) ? data : []))
      .catch(() => setWall([]));
  };

  useEffect(() => {
    loadWall(room);
  }, [room]);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`dado_pins?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const row = Array.isArray(data) ? data[0] || null : null;
        setPin(row);
        if (row?.room) setRoom(row.room);
      })
      .catch(() => setPin(null));
  }, [shareId]);

  const pinIt = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn('');
    const slug = roomSlug(room);
    const published = await publishLocalFile(file, {
      caption: note || `pinned in ${slug}`,
      author,
      color: accent,
      cardTitle: title || file.name,
    });
    if (!published.ok || !published.id || !published.url) {
      setBusy(false);
      setErr(published.error || 'could not send that file');
      return;
    }
    const res = await sbRest('dado_pins', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id: published.id,
        room: slug,
        title: title || file.name,
        note: note || null,
        author: author || null,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        share_id: published.id,
        accent,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180));
      return;
    }
    const saved = await res.json();
    const next = Array.isArray(saved) ? saved[0] : null;
    setPin(next);
    setLink(`${location.origin}/dado/${published.id}`);
    setWarn(published.warn || slow || '');
    setFile(null);
    if (next) setWall((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 24));
    history.pushState(null, '', `/dado/${published.id}`);
  };

  const shown = pin;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">room wall</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">Dado</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A named wall, not the vault. A local file is stored, then a pin is written into that room. Anyone with the room name can see what was left there. Paste /dado/id in Discord for a card. Older desks stay on their routes.</p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#0a84ff]/60">
            <span className="text-sm text-white/80">{file ? file.name : 'choose a file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap — large files only get a slowness note'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pin title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60">
              accent
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-8 w-12 rounded-lg border-0 bg-transparent" />
            </label>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the discord card" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          <button disabled={!file || busy} onClick={pinIt} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40">{busy ? 'pinning…' : 'pin to the wall'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#7ab6ff]">{link} — copied on click</button>
          )}
        </motion.div>

        {shown && (
          <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]" style={{ boxShadow: `inset 3px 0 0 ${shown.accent || '#0A84FF'}` }}>
            {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">open pin · {shown.room}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shown.title}</h2>
              <p className="mt-2 text-sm text-white/60">{shown.note || 'no note'} · {pretty(Number(shown.size) || 0)}{shown.author ? ` · ${shown.author}` : ''}</p>
              <a href={shown.file_url} className="mt-3 inline-block text-sm text-[#7ab6ff]">download {shown.file_name}</a>
            </div>
          </motion.article>
        )}

        <div className="mt-10 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium text-white/70">wall · {roomSlug(room)}</h2>
          <button onClick={() => navigate('dado')} className="text-xs text-white/40 hover:text-white">clear open pin</button>
        </div>
        <ul className="mt-3 space-y-2">
          {wall.length === 0 && <li className="rounded-2xl border border-white/8 px-4 py-6 text-sm text-white/40">nothing pinned in this room yet.</li>}
          {wall.map((item) => (
            <li key={item.id}>
              <a href={`/dado/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span className="truncate pr-3">{item.title}</span>
                <span className="shrink-0 text-white/40">{pretty(Number(item.size) || 0)}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
