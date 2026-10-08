import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

type Clip = {
  id: string;
  title?: string;
  body?: string;
  file_name?: string | null;
  mime?: string | null;
  size?: number;
  file_url?: string | null;
  share_id?: string | null;
  author?: string | null;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ClipPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Clip | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? `about ${pretty(file.size)} — this may feel slow. nothing is refused.` : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    fetch(`/api/clip?id=${encodeURIComponent(shareId)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (!stop) setError('that clip is not on the rail');
          return;
        }
        const data = await res.json();
        if (!stop) setRow(data);
      })
      .catch(() => {
        if (!stop) setError('could not open the clip');
      });
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function fileIt(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !body.trim() && !file) {
      setError('write a note or choose a local file');
      return;
    }
    setBusy(true);
    setError('');
    setWarn(slow);
    try {
      const id = uid();
      let share_id: string | null = null;
      let file_url: string | null = null;
      let file_name: string | null = null;
      let mime: string | null = null;
      let size = 0;
      if (file) {
        const published = await publishLocalFile(file, {
          caption: body.trim() || title.trim(),
          author: author.trim() || undefined,
          cardTitle: title.trim() || file.name,
        });
        if (!published.ok) {
          setError(published.error || 'the file did not land');
          setBusy(false);
          return;
        }
        share_id = published.id || null;
        file_url = published.url || null;
        file_name = file.name;
        mime = file.type || 'application/octet-stream';
        size = file.size;
        if (published.warn) setWarn(published.warn);
      }
      const res = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, body, author, share_id, file_url, file_name, mime, size }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'could not write the clip');
        setBusy(false);
        return;
      }
      if (data.warn) setWarn(data.warn);
      setRow(data.clip);
      navigate('clip', id);
    } catch (err: any) {
      setError(err?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!shareId) return;
    await navigator.clipboard.writeText(`${location.origin}/clip/${shareId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-16 apple-in">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[#64d2ff]/80">clip</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Pin a note, or a file, to the rail.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
          This is not another drawer. A clip is a short note with an optional local file. The file is written into the share table; the note is written into clips. Paste the link in Discord for a card. The vault, haversack, and older desks stay where they were.
        </p>
        {shareId && row ? (
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 glass rounded-3xl p-6 apple-card"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">on the rail</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{row.title || row.file_name || 'clip'}</h2>
            {row.body ? <p className="mt-3 text-neutral-300 leading-relaxed whitespace-pre-wrap">{row.body}</p> : null}
            <p className="mt-3 text-sm text-neutral-500">
              {row.file_name ? `${row.file_name} · ${pretty(Number(row.size) || 0)} · ` : 'note only · '}
              {row.author || 'unsigned'}
              {row.share_id ? ' · file kept in the share table' : ''}
            </p>
            {warn ? <p className="mt-3 text-sm text-amber-300/90">{warn}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url ? (
                <a href={row.file_url} download={row.file_name || 'clip'} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
                  download
                </a>
              ) : null}
              {row.share_id ? (
                <button onClick={() => navigate('share', row.share_id || undefined)} className="px-4 py-2 rounded-full glass text-sm">
                  open the file link
                </button>
              ) : null}
              <button onClick={copy} className="px-4 py-2 rounded-full glass text-sm">
                {copied ? 'copied' : 'copy discord link'}
              </button>
              <button onClick={() => navigate('vault')} className="px-4 py-2 rounded-full glass text-sm text-neutral-300">
                back to the vault
              </button>
            </div>
          </motion.article>
        ) : (
          <form onSubmit={fileIt} className="mt-8 glass rounded-3xl p-6 space-y-4 apple-card">
            <label className="block text-sm text-neutral-400">
              title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="what this is"
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              note
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="a line for whoever opens the link"
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25 resize-y"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              from
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="optional"
                className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25"
              />
            </label>
            <label className="block text-sm text-neutral-400">
              local file, if you want one
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:text-black"
              />
            </label>
            {slow ? <p className="text-sm text-amber-300/90">{slow}</p> : <p className="text-sm text-neutral-500">no size cap. a note appears only if the drop may be slow.</p>}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button disabled={busy} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium disabled:opacity-60">
              {busy ? 'pinning…' : 'pin the clip'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
