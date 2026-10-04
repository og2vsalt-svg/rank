import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Row = { id: string; file_name: string; lean?: string | null; author?: string | null; size?: number; created_at?: string; share_id?: string | null };

export default function TumblehomePage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [lean, setLean] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [filed, setFiled] = useState<{ card: string; share: string } | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [opened, setOpened] = useState<Row | null>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 40 * 1024 * 1024) return 'heavy file. the tab may pause while it sends. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. preview clients may feel slow. still goes up.';
    return '';
  }, [file]);

  useEffect(() => {
    const q = shareId ? `?id=${encodeURIComponent(shareId)}` : '';
    fetch('/api/tumblehome' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.tumblehomes) ? d.tumblehomes : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setFiled(null);
    const shared = await publishLocalFile(file, {
      caption: lean.trim() || undefined,
      author: author.trim() || undefined,
      cardTitle: file.name,
    });
    if (!shared.ok || !shared.id) {
      setBusy(false);
      setError(shared.error || 'the share table did not take that file');
      return;
    }
    const row = await fetch('/api/tumblehome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: shared.id,
        fileName: file.name,
        lean: lean.trim(),
        author: author.trim(),
        size: file.size,
        mime: file.type,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    const share = `${location.origin}/s/${shared.id}`;
    if (!row?.ok) {
      setError(row?.error || 'file landed, lean note did not');
      setFiled({ card: share, share });
      return;
    }
    setFiled({ card: `${location.origin}/tumblehome/${row.tumblehome?.id || ''}`, share });
    setFile(null);
    setLean('');
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">hosting</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">tumblehome</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            a local file into the share table, plus the lean of why it curves in. not a vault drawer. discord unfurls the card. large files are warned, never refused.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur-xl"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-12 transition-all duration-300 ${drag ? 'scale-[1.01] border-[#0A84FF] bg-[#0A84FF]/5' : 'border-black/10 bg-[#f5f5f7]'}`}
          >
            <span className="text-[15px] font-medium">{file ? file.name : 'drop a local file'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'no size lock'}</span>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {warn && <p className="mt-3 text-[13px] text-[#b25000]">{warn}</p>}
          <label className="mt-5 block text-[13px] font-medium text-[#6e6e73]">lean</label>
          <input value={lean} onChange={(e) => setLean(e.target.value)} placeholder="why this one curves inward" className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition focus:ring-[#0A84FF]/40" />
          <label className="mt-4 block text-[13px] font-medium text-[#6e6e73]">name</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition focus:ring-[#0A84FF]/40" />
          <button type="button" disabled={!file || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white transition-transform duration-200 enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40">
            {busy ? 'sending…' : 'file it'}
          </button>
          {error && <p className="mt-3 text-[13px] text-[#d70015]">{error}</p>}
          {filed && (
            <div className="mt-4 space-y-1 text-[14px]">
              <a className="block text-[#0A84FF]" href={filed.card}>{filed.card}</a>
              <a className="block text-[#0A84FF]" href={filed.share}>{filed.share}</a>
            </div>
          )}
        </motion.section>

        <section className="mt-8 space-y-3">
          {opened && (
            <div className="mb-3 rounded-[22px] bg-white px-5 py-4 ring-1 ring-black/5">
              <div className="text-[15px] font-medium">{opened.file_name}</div>
              <p className="mt-1 text-[14px] text-[#6e6e73]">{opened.lean || 'no lean noted'}</p>
              {opened.share_id && <a className="mt-2 inline-block text-[14px] text-[#0A84FF]" href={`/s/${opened.share_id}`}>open the file</a>}
            </div>
          )}
          {recent.map((row) => (
            <a key={row.id} href={`/tumblehome/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="text-[15px] font-medium">{row.file_name}</div>
              <div className="mt-1 text-[13px] text-[#6e6e73]">{row.lean || 'no lean'} · {pretty(Number(row.size) || 0)}</div>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
