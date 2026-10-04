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

type Row = {
  id: string;
  title: string;
  border?: string | null;
  author?: string | null;
  file_name?: string | null;
  size?: number;
  share_id?: string | null;
  created_at?: string;
};

export default function WaterwayPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [border, setBorder] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [filed, setFiled] = useState<{ card: string; share?: string } | null>(null);
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
    fetch('/api/waterway' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.waterways) ? d.waterways : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const send = async () => {
    if (!title.trim() || !border.trim()) return;
    setBusy(true);
    setError('');
    setFiled(null);
    let shareIdLocal = '';
    if (file) {
      const shared = await publishLocalFile(file, { caption: border.trim(), author: author.trim() || undefined, cardTitle: title.trim() });
      if (!shared.ok || !shared.id) {
        setBusy(false);
        setError(shared.error || 'the share table did not take that file');
        return;
      }
      shareIdLocal = shared.id;
    }
    const row = await fetch('/api/waterway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: shareIdLocal || null,
        title: title.trim(),
        border: border.trim(),
        author: author.trim(),
        fileName: file?.name || null,
        size: file?.size || 0,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!row?.ok) {
      setError(row?.error || 'the gutter note did not file');
      return;
    }
    setFiled({
      card: `${location.origin}/waterway/${row.waterway?.id || ''}`,
      share: shareIdLocal ? `${location.origin}/s/${shareIdLocal}` : undefined,
    });
    setFile(null);
    setTitle('');
    setBorder('');
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">hosting</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">waterway</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            a gutter note beside a handoff, with an optional local file in the share table. not a vault drawer. discord unfurls the card. large files are warned, never refused.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">{opened.author || 'unsigned'} · {opened.created_at ? new Date(opened.created_at).toLocaleString() : ''}</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight">{opened.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-[16px] leading-relaxed">{opened.border}</p>
            {opened.share_id && <a className="mt-4 inline-block text-[14px] text-[#0A84FF]" href={`/s/${opened.share_id}`}>{opened.file_name || 'attachment'} · {pretty(opened.size || 0)}</a>}
          </motion.article>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur-xl"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-[#0A84FF]" placeholder="title of the gutter" />
          <textarea value={border} onChange={(e) => setBorder(e.target.value)} rows={4} className="mt-3 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-[#0A84FF]" placeholder="what this edge is carrying off" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-[#0A84FF]" placeholder="your name, optional" />
          <button type="button" onClick={() => inputRef.current?.click()} className={`mt-4 flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-8 transition-all duration-300 ${drag ? 'scale-[1.01] border-[#0A84FF] bg-[#0A84FF]/5' : 'border-black/10 bg-[#f5f5f7]'}`}>
            <span className="text-[15px] font-medium">{file ? file.name : 'optional local file'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'drop it here, or leave the gutter empty of bytes'}</span>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {warn && <p className="mt-3 text-[13px] text-[#c45c26]">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-[#ff3b30]">{error}</p>}
          <button type="button" disabled={!title.trim() || !border.trim() || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'filing…' : 'cut the gutter'}
          </button>
          {filed && (
            <div className="mt-4 space-y-1 text-[14px]">
              <a className="block text-[#0A84FF]" href={filed.card}>{filed.card}</a>
              {filed.share && <a className="block text-[#0A84FF]" href={filed.share}>{filed.share}</a>}
            </div>
          )}
        </motion.section>

        {!shareId && recent.length > 0 && (
          <section className="mt-8 space-y-3">
            {recent.map((row) => (
              <a key={row.id} href={`/waterway/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5">
                <p className="text-[15px] font-medium">{row.title}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-[#6e6e73]">{row.border}</p>
              </a>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
