import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, publishShare } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

type Row = { id: string; title: string; letter: string; author?: string | null; share_id?: string | null; created_at?: string };

export default function SheerstrakePage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [letter, setLetter] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filed, setFiled] = useState<{ card: string; share?: string } | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [opened, setOpened] = useState<Row | null>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 40 * 1024 * 1024) return 'heavy attachment. the tab may pause. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large attachment. still goes up. preview may feel slow.';
    if (letter.length > 2500) return 'long letter. it still files. discord may clip the card.';
    return '';
  }, [file, letter]);

  useEffect(() => {
    const q = shareId ? `?id=${encodeURIComponent(shareId)}` : '';
    fetch('/api/sheerstrake' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.sheerstrakes) ? d.sheerstrakes : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const send = async () => {
    if (!title.trim() || !letter.trim()) return;
    setBusy(true);
    setError('');
    setFiled(null);
    let shareId: string | undefined;
    let shareUrl: string | undefined;
    if (file) {
      const shared = await publishLocalFile(file, { caption: title.trim(), author: author.trim() || undefined, cardTitle: file.name });
      if (!shared.ok || !shared.id) {
        setBusy(false);
        setError(shared.error || 'the attachment did not land');
        return;
      }
      shareId = shared.id;
      shareUrl = `${location.origin}/s/${shared.id}`;
    } else {
      const md = `# ${title.trim()}\n\n${letter.trim()}\n`;
      const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const shared = await publishShare({
        id,
        name: `${title.trim().slice(0, 60)}.md`,
        type: 'text/markdown',
        size: md.length,
        dataUrl,
        caption: letter.trim().slice(0, 180),
        author: author.trim() || undefined,
      });
      if (shared.ok && shared.id) {
        shareId = shared.id;
        shareUrl = `${location.origin}/s/${shared.id}`;
      }
    }
    const row = await fetch('/api/sheerstrake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), letter: letter.trim(), author: author.trim(), shareId }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!row?.ok) {
      setError(row?.error || 'the letter table did not take that');
      return;
    }
    setFiled({ card: `${location.origin}/sheerstrake/${row.sheerstrake?.id || ''}`, share: shareUrl });
    setTitle('');
    setLetter('');
    setFile(null);
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">letters</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">sheerstrake</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            a cover letter beside an optional local file. the letter lives in its own table. the file, if you attach one, lands in the share table. discord unfurls both links.
          </p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5 }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur-xl">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-[#0A84FF]/30" />
          <textarea value={letter} onChange={(e) => setLetter(e.target.value)} placeholder="the letter" rows={7} className="mt-3 w-full resize-y rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-[#0A84FF]/30" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[13px] font-medium transition hover:bg-[#ebebed]">{file ? file.name : 'attach a local file'}</button>
            {file && <span className="text-[13px] text-[#6e6e73]">{pretty(file.size)}</span>}
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {warn && <p className="mt-3 text-[13px] text-[#b25000]">{warn}</p>}
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[#0A84FF]/30" />
          <button type="button" disabled={!title.trim() || !letter.trim() || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white transition-transform duration-200 enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40">
            {busy ? 'filing…' : 'file the letter'}
          </button>
          {error && <p className="mt-3 text-[13px] text-[#d70015]">{error}</p>}
          {filed && (
            <div className="mt-4 space-y-1 text-[14px]">
              <a className="block text-[#0A84FF]" href={filed.card}>{filed.card}</a>
              {filed.share && <a className="block text-[#0A84FF]" href={filed.share}>{filed.share}</a>}
            </div>
          )}
        </motion.section>
        <section className="mt-8 space-y-3">
          {opened && (
            <article className="mb-3 rounded-[22px] bg-white px-5 py-4 ring-1 ring-black/5">
              <h2 className="text-[17px] font-medium">{opened.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#3a3a3c]">{opened.letter}</p>
              {opened.share_id && <a className="mt-3 inline-block text-[14px] text-[#0A84FF]" href={`/s/${opened.share_id}`}>open the attachment</a>}
            </article>
          )}
          {recent.map((row) => (
            <a key={row.id} href={`/sheerstrake/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="text-[15px] font-medium">{row.title}</div>
              <div className="mt-1 line-clamp-2 text-[13px] text-[#6e6e73]">{row.letter}</div>
            </a>
          ))}
        </section>
      </main>
    </div>
  );
}
