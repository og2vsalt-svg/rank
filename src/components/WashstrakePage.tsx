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
  left_name: string;
  right_name: string;
  difference?: string | null;
  author?: string | null;
  left_size?: number;
  right_size?: number;
  left_share_id?: string | null;
  right_share_id?: string | null;
  created_at?: string;
};

export default function WashstrakePage() {
  const { shareId } = useRouter();
  const leftRef = useRef<HTMLInputElement>(null);
  const rightRef = useRef<HTMLInputElement>(null);
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [difference, setDifference] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filed, setFiled] = useState<{ card: string; left: string; right: string } | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [opened, setOpened] = useState<Row | null>(null);

  const warn = useMemo(() => {
    const size = (left?.size || 0) + (right?.size || 0);
    if (!size) return '';
    if (size > 40 * 1024 * 1024) return 'heavy pair. the tab may pause while both send. nothing is refused.';
    if (size > 12 * 1024 * 1024) return 'large pair. preview clients may feel slow. still goes up.';
    return '';
  }, [left, right]);

  useEffect(() => {
    const q = shareId ? `?id=${encodeURIComponent(shareId)}` : '';
    fetch('/api/washstrake' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.washstrakes) ? d.washstrakes : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const send = async () => {
    if (!left || !right) return;
    setBusy(true);
    setError('');
    setFiled(null);
    const a = await publishLocalFile(left, { caption: difference.trim() || undefined, author: author.trim() || undefined, cardTitle: left.name });
    if (!a.ok || !a.id) {
      setBusy(false);
      setError(a.error || 'the share table did not take the left file');
      return;
    }
    const b = await publishLocalFile(right, { caption: difference.trim() || undefined, author: author.trim() || undefined, cardTitle: right.name });
    if (!b.ok || !b.id) {
      setBusy(false);
      setError(b.error || 'left landed, right did not');
      return;
    }
    const row = await fetch('/api/washstrake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leftShareId: a.id,
        rightShareId: b.id,
        leftName: left.name,
        rightName: right.name,
        difference: difference.trim(),
        author: author.trim(),
        leftSize: left.size,
        rightSize: right.size,
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    const leftUrl = `${location.origin}/s/${a.id}`;
    const rightUrl = `${location.origin}/s/${b.id}`;
    if (!row?.ok) {
      setError(row?.error || 'files landed, the pair note did not');
      setFiled({ card: leftUrl, left: leftUrl, right: rightUrl });
      return;
    }
    setFiled({ card: `${location.origin}/washstrake/${row.washstrake?.id || ''}`, left: leftUrl, right: rightUrl });
    setLeft(null);
    setRight(null);
    setDifference('');
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">hosting</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">washstrake</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            two local files into the share table, with one sentence on how they differ. not a vault drawer. discord unfurls the pair. large files are warned, never refused.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">{opened.author || 'unsigned'} · {opened.created_at ? new Date(opened.created_at).toLocaleString() : ''}</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight">{opened.left_name} beside {opened.right_name}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#1d1d1f]">{opened.difference || 'no difference written.'}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-[14px]">
              {opened.left_share_id && <a className="text-[#0A84FF]" href={`/s/${opened.left_share_id}`}>left · {pretty(opened.left_size || 0)}</a>}
              {opened.right_share_id && <a className="text-[#0A84FF]" href={`/s/${opened.right_share_id}`}>right · {pretty(opened.right_size || 0)}</a>}
            </div>
          </motion.article>
        )}

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => leftRef.current?.click()} className="rounded-[22px] border border-dashed border-black/10 bg-[#f5f5f7] px-5 py-10 text-left transition duration-300 hover:border-[#0A84FF]">
              <span className="block text-[12px] uppercase tracking-wide text-[#6e6e73]">left</span>
              <span className="mt-1 block text-[15px] font-medium">{left ? left.name : 'choose a local file'}</span>
              {left && <span className="mt-1 block text-[13px] text-[#6e6e73]">{pretty(left.size)}</span>}
            </button>
            <button type="button" onClick={() => rightRef.current?.click()} className="rounded-[22px] border border-dashed border-black/10 bg-[#f5f5f7] px-5 py-10 text-left transition duration-300 hover:border-[#0A84FF]">
              <span className="block text-[12px] uppercase tracking-wide text-[#6e6e73]">right</span>
              <span className="mt-1 block text-[15px] font-medium">{right ? right.name : 'choose the other file'}</span>
              {right && <span className="mt-1 block text-[13px] text-[#6e6e73]">{pretty(right.size)}</span>}
            </button>
          </div>
          <input ref={leftRef} type="file" className="hidden" onChange={(e) => setLeft(e.target.files?.[0] || null)} />
          <input ref={rightRef} type="file" className="hidden" onChange={(e) => setRight(e.target.files?.[0] || null)} />
          <label className="mt-5 block text-[13px] text-[#6e6e73]">how they differ</label>
          <textarea value={difference} onChange={(e) => setDifference(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-[#0A84FF]" placeholder="same cut, different hour" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {warn && <p className="mt-3 text-[13px] text-[#c45c26]">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-[#ff3b30]">{error}</p>}
          <button type="button" disabled={!left || !right || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'sending both…' : 'file the pair'}
          </button>
          {filed && (
            <div className="mt-4 space-y-1 text-[14px]">
              <a className="block text-[#0A84FF]" href={filed.card}>{filed.card}</a>
              <a className="block text-[#0A84FF]" href={filed.left}>{filed.left}</a>
              <a className="block text-[#0A84FF]" href={filed.right}>{filed.right}</a>
            </div>
          )}
        </motion.section>

        {!shareId && recent.length > 0 && (
          <section className="mt-8 space-y-3">
            {recent.map((row) => (
              <a key={row.id} href={`/washstrake/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5">
                <p className="text-[15px] font-medium">{row.left_name} · {row.right_name}</p>
                <p className="mt-1 text-[13px] text-[#6e6e73]">{row.difference || 'no note'} · {pretty((row.left_size || 0) + (row.right_size || 0))}</p>
              </a>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
