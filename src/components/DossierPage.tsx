import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Dossier = {
  id: string;
  title: string;
  caption: string | null;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  author: string | null;
  created_at?: string;
  warn?: string | null;
};

export default function DossierPage() {
  const { shareId, navigate } = useRouter();
  const [rows, setRows] = useState<Dossier[]>([]);
  const [focus, setFocus] = useState<Dossier | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch('/api/dossier');
    const data = await res.json();
    setRows(Array.isArray(data.dossiers) ? data.dossiers : []);
  }

  useEffect(() => {
    load().catch(() => setError('the dossier desk is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch('/api/dossier?id=' + encodeURIComponent(shareId))
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > SLOW ? 'this file is large. opening it may feel slow. it will still be accepted.' : '');
    if (next && !title) setTitle(next.name.replace(/\.[^.]+$/, ''));
  }

  async function fileDossier(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('choose a file on this machine');
      return;
    }
    if (!title.trim()) {
      setError('give the dossier a title');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          caption: caption.trim(),
          author: author.trim(),
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'could not file it');
      const href = window.location.origin + '/dossier/' + data.id;
      setLink(href);
      setWarn(data.warn || '');
      setFile(null);
      setCaption('');
      await load();
      navigate('dossier', data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not file it');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    const href = link || (focus ? window.location.origin + '/dossier/' + focus.id : '');
    if (!href) return;
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  const shown = focus || null;
  const previewable = shown && shown.mime && (shown.mime.startsWith('image/') || shown.mime.startsWith('video/') || shown.mime.startsWith('audio/') || shown.mime.includes('pdf'));

  return (
    <div className="min-h-screen bg-[#070709] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">file desk</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Dossier</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">
            File a local document into the shared desk. The bytes go to storage, the card goes in the database, and the link carries a Discord embed. Nothing is refused for size — only a note if it may open slowly.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.form
            onSubmit={fileDossier}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <label className="block text-[13px] text-neutral-400">
              title
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-white/30" placeholder="spring inventory" />
            </label>
            <label className="mt-3 block text-[13px] text-neutral-400">
              note
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-white/30" placeholder="what this file is for" />
            </label>
            <label className="mt-3 block text-[13px] text-neutral-400">
              from
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-white/30" placeholder="optional" />
            </label>
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-4 transition hover:border-white/30">
              <span className="text-[14px] text-neutral-300">{file ? file.name : 'choose a file on this machine'}</span>
              <span className="text-[12px] text-neutral-500">{file ? prettySize(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            </label>
            {warn ? <p className="mt-3 text-[13px] text-amber-200/90">{warn}</p> : null}
            {error ? <p className="mt-3 text-[13px] text-red-300">{error}</p> : null}
            <button disabled={busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60">
              {busy ? 'filing…' : 'file and share'}
            </button>
          </motion.form>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5"
          >
            {shown ? (
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em] text-neutral-500">open dossier</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{shown.title}</h2>
                <p className="mt-2 text-[14px] text-neutral-400">{shown.caption || 'no note on this one'}</p>
                <p className="mt-3 text-[13px] text-neutral-500">{shown.name} · {prettySize(shown.size)}{shown.author ? ' · ' + shown.author : ''}</p>
                {previewable && shown.mime?.startsWith('image/') ? (
                  <img src={shown.file_url} alt="" className="mt-4 max-h-56 w-full rounded-2xl object-cover" />
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={shown.file_url} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black" download={shown.name}>download</a>
                  <button onClick={copy} className="rounded-full border border-white/15 px-4 py-2 text-[13px] text-white">{copied ? 'copied' : 'copy link'}</button>
                </div>
                <p className="mt-3 break-all text-[12px] text-neutral-500">{window.location.origin}/dossier/{shown.id}</p>
              </div>
            ) : (
              <p className="text-[14px] leading-relaxed text-neutral-400">A filed dossier gets a public link. Paste it in Discord and the card uses the title, note, and file size.</p>
            )}
          </motion.aside>
        </div>

        <section className="mt-10">
          <h2 className="text-[13px] uppercase tracking-[0.16em] text-neutral-500">recent</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <button key={row.id} onClick={() => navigate('dossier', row.id)} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]">
                <p className="truncate text-[15px] font-medium">{row.title}</p>
                <p className="mt-1 truncate text-[12px] text-neutral-500">{row.name} · {prettySize(row.size)}</p>
              </button>
            ))}
            {!rows.length ? <p className="text-[14px] text-neutral-500">nothing filed yet.</p> : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
