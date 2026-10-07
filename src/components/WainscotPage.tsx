import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Panel = {
  id: string;
  room: string | null;
  caption: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  accent?: string | null;
  created_at: string;
  pretty?: string;
  warn?: string | null;
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

export default function WainscotPage() {
  const { shareId } = useRouter();
  const [room, setRoom] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Panel | null>(null);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/wainscot?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing panel');
        setOpen(data);
        setWarn(data.warn || '');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that panel'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setErr('choose a local file'); return; }
    setBusy(true);
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'large drop. the browser may feel slow while it sends. it will not be refused.' : '');
    try {
      const dataUrl = await readFile(file);
      const r = await fetch('/api/wainscot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, caption, name: file.name, type: file.type, dataUrl, accent: '#0A84FF' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the panel did not land');
      setLink(data.link || '');
      setWarn(data.warn || '');
      history.pushState(null, '', `/wainscot/${data.id}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'panel failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">wainscot</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Set a file into the panel.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">Name the room, write a caption, and the local file lands in storage and the wainscot table. Paste /wainscot/id in Discord for the card. Large drops are warned, never refused.</p>
        {open ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-[#8e8e93]">{open.room || 'an unnamed room'}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.file_name}</h2>
            {open.caption ? <p className="mt-3 text-[#d1d1d6]">{open.caption}</p> : null}
            <p className="mt-3 text-sm text-[#8e8e93]">{open.pretty || `${open.size} bytes`}</p>
            {warn ? <p className="mt-2 text-sm text-[#ffd60a]">{warn}</p> : null}
            {open.file_url && !open.file_url.startsWith('data:') ? (
              <a href={open.file_url} className="mt-5 inline-flex rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium" download={open.file_name}>download</a>
            ) : null}
          </section>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={280} placeholder="a caption for the panel" className="w-full min-h-24 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-[#a1a1aa] cursor-pointer hover:border-[#0a84ff]/50 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'choose a local file'}
            </label>
            {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
            {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
            {link ? <p className="text-sm text-[#64d2ff] break-all">{link}</p> : null}
            <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Setting it…' : 'Set the panel'}</button>
          </form>
        )}
        <p className="mt-8 text-sm text-[#8e8e93]">The public index lives at <a className="text-[#64d2ff]" href="/skirting">/skirting</a>. Older desks stay where they were.</p>
      </main>
      <Footer />
    </div>
  );
}
