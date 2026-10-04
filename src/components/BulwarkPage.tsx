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
  file_name: string;
  holds?: string | null;
  author?: string | null;
  size?: number;
  share_id?: string | null;
  created_at?: string;
};

export default function BulwarkPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [holds, setHolds] = useState('');
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
    fetch('/api/bulwark' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.bulwarks) ? d.bulwarks : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const send = async () => {
    if (!file || !holds.trim()) return;
    setBusy(true);
    setError('');
    setFiled(null);
    const shared = await publishLocalFile(file, { caption: holds.trim(), author: author.trim() || undefined, cardTitle: file.name });
    if (!shared.ok || !shared.id) {
      setBusy(false);
      setError(shared.error || 'the share table did not take that file');
      return;
    }
    const row = await fetch('/api/bulwark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareId: shared.id,
        fileName: file.name,
        holds: holds.trim(),
        author: author.trim(),
        size: file.size,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    const shareUrl = `${location.origin}/s/${shared.id}`;
    if (!row?.ok) {
      setError(row?.error || 'the file landed, the shield note did not');
      setFiled({ card: shareUrl, share: shareUrl });
      return;
    }
    setFiled({ card: `${location.origin}/bulwark/${row.bulwark?.id || ''}`, share: shareUrl });
    setFile(null);
    setHolds('');
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">hosting</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">bulwark</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            a local file into the share table, with a line on what it holds against. not a vault drawer. discord unfurls the shield. large files are warned, never refused.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">{opened.author || 'unsigned'} · {opened.created_at ? new Date(opened.created_at).toLocaleString() : ''}</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight">{opened.file_name}</h2>
            <p className="mt-3 text-[16px] leading-relaxed">holds against {opened.holds}</p>
            {opened.share_id && <a className="mt-4 inline-block text-[14px] text-[#0A84FF]" href={`/s/${opened.share_id}`}>open the file · {pretty(opened.size || 0)}</a>}
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
          <button type="button" onClick={() => inputRef.current?.click()} className={`flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-10 transition-all duration-300 ${drag ? 'scale-[1.01] border-[#0A84FF] bg-[#0A84FF]/5' : 'border-black/10 bg-[#f5f5f7]'}`}>
            <span className="text-[15px] font-medium">{file ? file.name : 'choose a local file'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'the shield needs something to stand in front of'}</span>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <label className="mt-5 block text-[13px] text-[#6e6e73]">what it holds against</label>
          <textarea value={holds} onChange={(e) => setHolds(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="a draft that should not get overwritten" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {warn && <p className="mt-3 text-[13px] text-[#c45c26]">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-[#ff3b30]">{error}</p>}
          <button type="button" disabled={!file || !holds.trim() || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'raising the shield…' : 'file the shield'}
          </button>
          {filed && (
            <div className="mt-4 space-y-1 text-[14px]">
              <a className="block text-[#0A84FF]" href={filed.card}>{filed.card}</a>
              <a className="block text-[#0A84FF]" href={filed.share}>{filed.share}</a>
            </div>
          )}
        </motion.section>

        {!shareId && recent.length > 0 && (
          <section className="mt-8 space-y-3">
            {recent.map((row) => (
              <a key={row.id} href={`/bulwark/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5">
                <p className="text-[15px] font-medium">{row.file_name}</p>
                <p className="mt-1 text-[13px] text-[#6e6e73]">holds against {row.holds} · {pretty(row.size || 0)}</p>
              </a>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
