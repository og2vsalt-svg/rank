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

async function digestOf(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

type Row = {
  id: string;
  file_name: string;
  digest: string;
  note?: string | null;
  author?: string | null;
  size?: number;
  share_id?: string | null;
  created_at?: string;
};

export default function BeardingPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [filed, setFiled] = useState<{ card: string; share: string } | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [opened, setOpened] = useState<Row | null>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 40 * 1024 * 1024) return 'heavy file. hashing and sending may pause the tab. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. preview clients may feel slow. still goes up.';
    return '';
  }, [file]);

  useEffect(() => {
    const q = shareId ? `?id=${encodeURIComponent(shareId)}` : '';
    fetch('/api/bearding' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.beardings) ? d.beardings : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const pick = async (next: File | null) => {
    setFile(next);
    setDigest('');
    if (!next) return;
    try { setDigest(await digestOf(next)); } catch { setDigest(''); }
  };

  const send = async () => {
    if (!file || !digest) return;
    setBusy(true);
    setError('');
    setFiled(null);
    const shared = await publishLocalFile(file, { caption: note.trim() || digest.slice(0, 16), author: author.trim() || undefined, cardTitle: file.name });
    if (!shared.ok || !shared.id) {
      setBusy(false);
      setError(shared.error || 'the share table did not take that file');
      return;
    }
    const row = await fetch('/api/bearding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId: shared.id, fileName: file.name, digest, note: note.trim(), author: author.trim(), size: file.size }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    const shareUrl = `${location.origin}/s/${shared.id}`;
    if (!row?.ok) {
      setError(row?.error || 'the file landed, the digest note did not');
      setFiled({ card: shareUrl, share: shareUrl });
      return;
    }
    setFiled({ card: `${location.origin}/bearding/${row.bearding?.id || ''}`, share: shareUrl });
    setFile(null);
    setDigest('');
    setNote('');
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">receipt</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">bearding</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            the angled cut where a file meets the record. a local drop goes into the share table, and the sha-256 stays beside it. not a vault drawer. discord unfurls the receipt. large files are warned, never refused.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">{opened.author || 'unsigned'} · {opened.created_at ? new Date(opened.created_at).toLocaleString() : ''}</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight">{opened.file_name}</h2>
            <p className="mt-3 break-all font-mono text-[13px] text-[#6e6e73]">{opened.digest}</p>
            {opened.note && <p className="mt-3 text-[16px] leading-relaxed">{opened.note}</p>}
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
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0] || null); }}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className={`flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-10 transition-all duration-300 ${drag ? 'scale-[1.01] border-[#0A84FF] bg-[#0A84FF]/5' : 'border-black/10 bg-[#f5f5f7]'}`}>
            <span className="text-[15px] font-medium">{file ? file.name : 'choose a local file'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'the cut needs a file to measure'}</span>
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
          {digest && <p className="mt-4 break-all font-mono text-[12px] text-[#6e6e73]">{digest}</p>}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-4 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="why this cut matters, optional" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {warn && <p className="mt-3 text-[13px] text-[#c45c26]">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-[#ff3b30]">{error}</p>}
          <button type="button" disabled={!file || !digest || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'cutting the record…' : 'file the cut'}
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
              <a key={row.id} href={`/bearding/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5">
                <p className="text-[15px] font-medium">{row.file_name}</p>
                <p className="mt-1 truncate font-mono text-[12px] text-[#6e6e73]">{row.digest}</p>
              </a>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
