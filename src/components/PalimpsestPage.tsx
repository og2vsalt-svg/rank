import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

type Sheet = {
  id: string;
  title?: string;
  scraped?: string;
  later?: string;
  earlier_id?: string | null;
  share_id?: string | null;
  file_name?: string | null;
  mime?: string | null;
  size?: number;
  file_url?: string | null;
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

export default function PalimpsestPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [scraped, setScraped] = useState('');
  const [later, setLater] = useState('');
  const [earlier, setEarlier] = useState('');
  const [author, setAuthor] = useState('');
  const [layers, setLayers] = useState(['', '']);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Sheet | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? `about ${pretty(file.size)} — this may feel slow. nothing is refused.` : ''),
    [file],
  );

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    fetch(`/api/palimpsest?id=${encodeURIComponent(shareId)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (!stop) setError('that writing is not on the sheet');
          return;
        }
        const data = await res.json();
        if (!stop) setRow(data);
      })
      .catch(() => {
        if (!stop) setError('could not open the sheet');
      });
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function fileIt(e: React.FormEvent) {
    e.preventDefault();
    const layerBody = layers.map((l) => l.trim()).filter(Boolean).join('\n\n—\n\n');
    if (!file && !layerBody && !later.trim() && !scraped.trim()) {
      setError('write a layer, or choose a local file. nothing is size-capped.');
      return;
    }
    setBusy(true);
    setError('');
    setWarn(slow);
    try {
      const id = uid();
      if (!file) {
        const note = await fetch('/api/desk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            title: title.trim() || 'palimpsest',
            body: [scraped.trim(), later.trim(), layerBody].filter(Boolean).join('\n\n'),
            author: author.trim() || null,
            kind: 'note',
          }),
        });
        if (!note.ok) {
          setError('the layered note did not land');
          setBusy(false);
          return;
        }
        setRow({ id, title: title.trim() || 'palimpsest', scraped, later: later.trim() || layerBody, author });
        navigate('palimpsest', id);
        setBusy(false);
        return;
      }
      const published = await publishLocalFile(file, {
        caption: later.trim() || scraped.trim() || title.trim(),
        author: author.trim() || undefined,
        cardTitle: title.trim() || file.name,
      });
      if (!published.ok) {
        setError(published.error || 'the file did not land');
        setBusy(false);
        return;
      }
      if (published.warn) setWarn(published.warn);
      const res = await fetch('/api/palimpsest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title,
          scraped,
          later,
          earlier_id: earlier.trim() || null,
          author,
          share_id: published.id,
          file_url: published.url,
          file_name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'could not write the sheet');
        setBusy(false);
        return;
      }
      if (data.warn) setWarn(data.warn);
      setRow(data.sheet);
      navigate('palimpsest', id);
    } catch (err: any) {
      setError(err?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!shareId) return;
    await navigator.clipboard.writeText(`${location.origin}/palimpsest/${shareId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-16 apple-in">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[#64d2ff]/80">palimpsest</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Write over an earlier file. Keep both.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
          Not a drawer. Name what you scraped off, file the later local file into the share table, and keep the earlier share id beside it. Paste the link in Discord for a card. The vault and the older desks stay where they were.
        </p>
        {shareId && row ? (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 glass rounded-3xl p-6 apple-card"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">later writing</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{row.title || row.file_name || 'sheet'}</h2>
            {row.scraped ? <p className="mt-4 text-neutral-400 leading-relaxed whitespace-pre-wrap"><span className="text-neutral-500">scraped off. </span>{row.scraped}</p> : null}
            {row.later ? <p className="mt-3 text-neutral-200 leading-relaxed whitespace-pre-wrap">{row.later}</p> : null}
            <p className="mt-3 text-sm text-neutral-500">
              {row.file_name ? `${row.file_name} · ${pretty(Number(row.size) || 0)} · ` : ''}
              {row.author || 'unsigned'}
              {row.earlier_id ? ` · over ${row.earlier_id}` : ''}
            </p>
            {warn ? <p className="mt-3 text-sm text-amber-300/90">{warn}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url ? (
                <a href={row.file_url} download={row.file_name || 'sheet'} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
                  download the later file
                </a>
              ) : null}
              {row.share_id ? (
                <button onClick={() => navigate('share', row.share_id || undefined)} className="px-4 py-2 rounded-full glass text-sm">
                  open the file link
                </button>
              ) : null}
              {row.earlier_id ? (
                <button onClick={() => navigate('share', row.earlier_id || undefined)} className="px-4 py-2 rounded-full glass text-sm">
                  earlier share
                </button>
              ) : null}
              <button onClick={copy} className="px-4 py-2 rounded-full glass text-sm">
                {copied ? 'copied' : 'copy discord link'}
              </button>
              <button onClick={() => navigate('underwriting')} className="px-4 py-2 rounded-full glass text-sm text-neutral-300">
                the index
              </button>
            </div>
          </motion.article>
        ) : (
          <form onSubmit={fileIt} className="mt-8 glass rounded-3xl p-6 space-y-4 apple-card">
            <label className="block text-sm text-neutral-400">
              title
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this later writing is" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
            </label>
            <label className="block text-sm text-neutral-400">
              scraped off
              <textarea value={scraped} onChange={(e) => setScraped(e.target.value)} rows={3} placeholder="what the earlier file got wrong, or what you are covering" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25 resize-y" />
            </label>
            <label className="block text-sm text-neutral-400">
              later line
              <textarea value={later} onChange={(e) => setLater(e.target.value)} rows={3} placeholder="what this file is instead" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25 resize-y" />
            </label>
            <label className="block text-sm text-neutral-400">
              earlier share id, if you have one
              <input value={earlier} onChange={(e) => setEarlier(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
            </label>
            <label className="block text-sm text-neutral-400">
              from
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
            </label>
            <div className="space-y-2">
              <p className="text-sm text-neutral-400">layers, if this is a note and not a file</p>
              {layers.map((layer, i) => (
                <textarea key={i} value={layer} onChange={(e) => setLayers(layers.map((l, j) => (j === i ? e.target.value : l)))} rows={2} placeholder={`layer ${i + 1}`} className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25 resize-y" />
              ))}
              <button type="button" onClick={() => setLayers([...layers, ''])} className="text-sm text-[#64d2ff]">add a layer</button>
            </div>
            <label className="block text-sm text-neutral-400">
              local file, optional
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:text-black" />
            </label>
            {slow ? <p className="text-sm text-amber-300/90">{slow}</p> : <p className="text-sm text-neutral-500">no size cap. a note appears only if the drop may be slow.</p>}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button disabled={busy} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium disabled:opacity-60">
              {busy ? 'writing…' : 'file the later writing'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
