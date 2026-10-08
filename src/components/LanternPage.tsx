import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Share = {
  id: string;
  name: string;
  mime?: string;
  size?: number;
  file_url?: string;
  author?: string | null;
  caption?: string | null;
  created_at?: string;
};

type Note = {
  id: string;
  share_id?: string | null;
  name?: string;
  note?: string | null;
  author?: string | null;
  size?: number;
  created_at?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;
const SLOW_AT = 12 * 1024 * 1024;

function pretty(bytes?: number) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function LanternPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [open, setOpen] = useState<{ note: string; author: string; name: string; share: Share | null } | null>(null);

  useEffect(() => {
    fetch('/api/lantern')
      .then((r) => r.json())
      .then((data) => {
        setNotes(Array.isArray(data.notes) ? data.notes : []);
        setShares(Array.isArray(data.shares) ? data.shares : []);
      })
      .catch(() => {});
  }, [shareId]);

  useEffect(() => {
    if (!shareId) {
      setOpen(null);
      return;
    }
    fetch(`/api/lantern?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing lantern');
        setOpen({ note: data.note || '', author: data.author || '', name: data.name || 'file', share: data.share || null });
        setErr('');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that lantern'));
  }, [shareId]);

  const slow = useMemo(() => (file && file.size >= SLOW_AT ? `this drop is ${pretty(file.size)}. it will go through, it may just take a moment.` : ''), [file]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !note.trim()) {
      setErr('add a file, a line, or both');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn(slow);
    try {
      let shareIdOut = '';
      let name = file?.name || 'reading';
      let mime = file?.type || '';
      let size = file?.size || 0;
      if (file) {
        const body = new FormData();
        body.set('file', file);
        body.set('author', author);
        body.set('caption', note);
        body.set('cardTitle', 'lantern');
        const up = await fetch('/api/share', { method: 'POST', body });
        const saved = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(saved.error || 'the file did not land in the share table');
        shareIdOut = saved.id;
        name = saved.name || file.name;
        mime = saved.type || file.type;
        size = saved.size || file.size;
      }
      const noteRes = await fetch('/api/lantern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, author, shareId: shareIdOut, name, mime, size }),
      });
      const data = await noteRes.json().catch(() => ({}));
      if (!noteRes.ok) throw new Error(data.error || 'the reading note did not land');
      setLink(data.link || '');
      navigate('lantern', data.id);
      try {
        await navigator.clipboard.writeText(data.link || '');
      } catch {}
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'lantern failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#64d2ff] text-sm font-medium tracking-wide">reading room</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
          a lantern, not a drawer.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="mt-4 max-w-xl text-neutral-400 text-lg leading-relaxed">
          Drop a local file into the share table, leave a short margin, and hand someone the link. Discord unfurls it. Large files are warned, never refused. The vault stays where it was.
        </motion.p>

        <div className="mt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
          <motion.form onSubmit={onSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="glass rounded-[28px] p-6 apple-card">
            <label className="block text-[13px] text-neutral-400 mb-2">local file</label>
            <input
              type="file"
              onChange={(event) => {
                const next = event.target.files?.[0] || null;
                setFile(next);
                setWarn(next && next.size >= SLOW_AT ? `this drop is ${pretty(next.size)}. it will go through, it may just take a moment.` : '');
              }}
              className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
            />
            {warn && <p className="mt-3 text-[13px] text-[#ffd60a]">{warn}</p>}
            <label className="block mt-5 text-[13px] text-neutral-400 mb-2">margin</label>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} placeholder="what should the other person notice first" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <label className="block mt-4 text-[13px] text-neutral-400 mb-2">from</label>
            <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="optional" className="w-full rounded-full bg-black/30 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-white/25" />
            {err && <p className="mt-4 text-sm text-[#ff375f]">{err}</p>}
            {link && <p className="mt-4 text-sm text-[#30d158] break-all">copied {link}</p>}
            <button disabled={busy} className="mt-5 inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-60">
              {busy ? 'setting the lantern…' : 'set the lantern'}
            </button>
          </motion.form>

          <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease }} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[12px] uppercase tracking-[0.16em] text-neutral-500">open</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{open?.name || file?.name || 'nothing hung yet'}</h2>
            <p className="mt-3 text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">{open?.note || note || 'the margin shows here, and on the discord card.'}</p>
            {(open?.author || author) && <p className="mt-3 text-[13px] text-neutral-500">from {open?.author || author}</p>}
            {open?.share?.file_url && (
              <a href={open.share.file_url} className="mt-5 inline-flex px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm" target="_blank" rel="noreferrer">
                open {open.share.name} · {pretty(open.share.size)}
              </a>
            )}
          </motion.aside>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-medium">recent margins</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.map((item, i) => (
              <motion.button key={item.id} onClick={() => navigate('lantern', item.id)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease }} className="text-left apple-card rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-white line-clamp-3">{item.note || item.name}</p>
                <p className="mt-3 text-[12px] text-neutral-500">{item.author || 'unsigned'} · {pretty(item.size)}</p>
              </motion.button>
            ))}
            {!notes.length && <p className="text-sm text-neutral-500">no margins yet. the first one will sit here.</p>}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium">already on the table</h2>
          <div className="mt-4 divide-y divide-white/5 rounded-3xl border border-white/10 overflow-hidden">
            {shares.map((item) => (
              <a key={item.id} href={item.file_url} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.04]" target="_blank" rel="noreferrer">
                <span className="text-sm text-neutral-200 truncate">{item.name}</span>
                <span className="text-[12px] text-neutral-500 shrink-0">{pretty(item.size)}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
