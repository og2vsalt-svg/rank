import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

type Slip = {
  id: string;
  title?: string;
  from_name?: string | null;
  to_name?: string | null;
  note?: string | null;
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

export default function QuittancePage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Slip | null>(null);
  const [recent, setRecent] = useState<Slip[]>([]);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? `about ${pretty(file.size)} — this may feel slow. nothing is refused.` : ''),
    [file],
  );

  useEffect(() => {
    if (shareId) return;
    let stop = false;
    fetch('/api/quittance')
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (!stop && Array.isArray(data)) setRecent(data);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [shareId]);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    fetch(`/api/quittance?id=${encodeURIComponent(shareId)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (!stop) setError('that receipt is not on the desk');
          return;
        }
        const data = await res.json();
        if (!stop) setRow(data);
      })
      .catch(() => {
        if (!stop) setError('could not open the receipt');
      });
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function fileIt(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !note.trim()) {
      setError('write what changed hands, or choose a local file. nothing is size-capped.');
      return;
    }
    setBusy(true);
    setError('');
    setWarn(slow);
    try {
      const id = uid();
      let published: { id?: string; url?: string; warn?: string; ok: boolean; error?: string } = { ok: true };
      if (file) {
        published = await publishLocalFile(file, {
          caption: note.trim() || title.trim(),
          author: fromName.trim() || undefined,
          cardTitle: title.trim() || file.name,
        });
        if (!published.ok) {
          setError(published.error || 'the file did not land');
          setBusy(false);
          return;
        }
        if (published.warn) setWarn(published.warn);
      }
      const res = await fetch('/api/quittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: title.trim() || file?.name || 'receipt',
          from_name: fromName.trim() || null,
          to_name: toName.trim() || null,
          note: note.trim() || null,
          author: fromName.trim() || null,
          share_id: published.id || null,
          file_url: published.url || null,
          file_name: file?.name || null,
          mime: file?.type || null,
          size: file?.size || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'could not write the receipt');
        setBusy(false);
        return;
      }
      if (data.warn) setWarn(data.warn);
      setRow(data.slip);
      navigate('quittance', id);
    } catch (err: any) {
      setError(err?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!shareId) return;
    await navigator.clipboard.writeText(`${location.origin}/quittance/${shareId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-16 apple-in">
        <p className="text-[12px] tracking-[0.18em] uppercase text-[#30d158]/80">quittance</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">A receipt for a file that changed hands.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
          Not a drawer. Name who handed it over and who took it, then file the local file into the share table. The receipt stays beside the older desks. Paste the link in Discord for a card.
        </p>
        {shareId && row ? (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 glass rounded-3xl p-6 apple-card"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">receipt</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{row.title || row.file_name || 'receipt'}</h2>
            <p className="mt-3 text-sm text-neutral-400">
              {row.from_name || 'unsigned'} <span className="text-neutral-600">to</span> {row.to_name || 'whoever opens this'}
            </p>
            {row.note ? <p className="mt-4 text-neutral-200 leading-relaxed whitespace-pre-wrap">{row.note}</p> : null}
            <p className="mt-3 text-sm text-neutral-500">
              {row.file_name ? `${row.file_name} · ${pretty(Number(row.size) || 0)}` : 'note only'}
            </p>
            {warn ? <p className="mt-3 text-sm text-amber-300/90">{warn}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {row.file_url ? (
                <a href={row.file_url} download={row.file_name || 'receipt'} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
                  download the file
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
              <button onClick={() => navigate('quittance')} className="px-4 py-2 rounded-full glass text-sm text-neutral-300">
                new receipt
              </button>
            </div>
          </motion.article>
        ) : (
          <form onSubmit={fileIt} className="mt-8 glass rounded-3xl p-6 space-y-4 apple-card">
            <label className="block text-sm text-neutral-400">
              title
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this receipt is for" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm text-neutral-400">
                from
                <input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="who handed it over" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
              </label>
              <label className="block text-sm text-neutral-400">
                to
                <input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="who took it" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25" />
              </label>
            </div>
            <label className="block text-sm text-neutral-400">
              what changed hands
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="condition, count, or a line for the person opening it" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/25 resize-y" />
            </label>
            <label className="block text-sm text-neutral-400">
              local file, optional
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:text-black" />
            </label>
            {slow ? <p className="text-sm text-amber-300/90">{slow}</p> : <p className="text-sm text-neutral-500">no size cap. a note appears only if the drop may be slow.</p>}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button disabled={busy} className="px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium disabled:opacity-60">
              {busy ? 'writing…' : 'file the receipt'}
            </button>
          </form>
        )}
        {!shareId && recent.length > 0 ? (
          <section className="mt-10">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">recent receipts</p>
            <ul className="mt-3 space-y-2">
              {recent.map((item) => (
                <li key={item.id}>
                  <button onClick={() => navigate('quittance', item.id)} className="w-full text-left glass rounded-2xl px-4 py-3 hover:bg-white/5 transition">
                    <span className="font-medium">{item.title || item.file_name || 'receipt'}</span>
                    <span className="block text-sm text-neutral-500">{item.from_name || 'unsigned'} to {item.to_name || 'open'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
