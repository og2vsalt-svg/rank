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

type Board = {
  id: string;
  title: string;
  seam?: string;
  author?: string | null;
  share_ids?: string[];
  file_names?: string[];
  created_at?: string;
};

export default function CarvelPage() {
  const { shareId } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [seam, setSeam] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [filed, setFiled] = useState<{ card: string; shares: string[] } | null>(null);
  const [recent, setRecent] = useState<Board[]>([]);
  const [opened, setOpened] = useState<Board | null>(null);

  const bytes = files.reduce((n, f) => n + f.size, 0);
  const warn = useMemo(() => {
    if (!files.length) return '';
    if (bytes > 40 * 1024 * 1024) return 'heavy set. the tab may pause while each file sends. nothing is refused.';
    if (bytes > 12 * 1024 * 1024) return 'large set. preview clients may feel slow. still goes up.';
    return '';
  }, [files, bytes]);

  useEffect(() => {
    const q = shareId ? `&id=${encodeURIComponent(shareId)}` : '';
    fetch('/api/desk?desk=carvel' + q).then((r) => r.json()).then((d) => {
      const rows = Array.isArray(d?.carvels) ? d.carvels : [];
      if (shareId) setOpened(rows[0] || null);
      else setRecent(rows);
    }).catch(() => {});
  }, [filed, shareId]);

  const add = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const send = async () => {
    if (files.length < 2 || !title.trim() || !seam.trim()) return;
    setBusy(true);
    setError('');
    setFiled(null);
    const shareIds: string[] = [];
    const names: string[] = [];
    for (const file of files) {
      const shared = await publishLocalFile(file, { caption: seam.trim(), author: author.trim() || undefined, cardTitle: file.name });
      if (!shared.ok || !shared.id) {
        setBusy(false);
        setError(shared.error || `${file.name} did not land in the share table`);
        return;
      }
      shareIds.push(shared.id);
      names.push(file.name);
    }
    const row = await fetch('/api/desk?desk=carvel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), seam: seam.trim(), author: author.trim(), shareIds, fileNames: names }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!row?.ok) {
      setError(row?.error || 'the files landed, the seam note did not');
      setFiled({ card: '', shares: shareIds.map((id) => `${location.origin}/s/${id}`) });
      return;
    }
    setFiled({
      card: `${location.origin}/carvel/${row.carvel?.id || ''}`,
      shares: shareIds.map((id) => `${location.origin}/s/${id}`),
    });
    setFiles([]);
    setTitle('');
    setSeam('');
  };

  return (
    <div className="mesh min-h-screen text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] font-medium tracking-wide text-[#6e6e73]">hosting</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-tight">carvel</h1>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-[#6e6e73]">
            two or more local files, laid flush, with one seam note. each file lands in the share table. not a vault drawer. discord unfurls the board. large sets are warned, never refused.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <p className="text-[13px] text-[#6e6e73]">{opened.author || 'unsigned'} · {opened.created_at ? new Date(opened.created_at).toLocaleString() : ''}</p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight">{opened.title}</h2>
            <p className="mt-3 text-[16px] leading-relaxed">{opened.seam}</p>
            <ul className="mt-4 space-y-2">
              {(opened.share_ids || []).map((id, i) => (
                <li key={id}><a className="text-[14px] text-[#0A84FF]" href={`/s/${id}`}>{(opened.file_names || [])[i] || id}</a></li>
              ))}
            </ul>
          </motion.article>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-[28px] bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] ring-1 ring-black/5 backdrop-blur-xl"
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        >
          <button type="button" onClick={() => inputRef.current?.click()} className={`flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-6 py-10 transition-all duration-300 ${drag ? 'scale-[1.01] border-[#0A84FF] bg-[#0A84FF]/5' : 'border-black/10 bg-[#f5f5f7]'}`}>
            <span className="text-[15px] font-medium">{files.length ? `${files.length} files · ${pretty(bytes)}` : 'choose local files'}</span>
            <span className="mt-1 text-[13px] text-[#6e6e73]">at least two, so the seam has something to sit between</span>
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-[14px] text-[#1d1d1f]">
              {files.map((f, i) => <li key={`${f.name}-${i}`}>{f.name} · {pretty(f.size)}</li>)}
            </ul>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-5 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="board title" />
          <textarea value={seam} onChange={(e) => setSeam(e.target.value)} rows={3} className="mt-3 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="what the seam is holding together" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none ring-1 ring-transparent transition duration-300 focus:ring-[#0A84FF]" placeholder="your name, optional" />
          {warn && <p className="mt-3 text-[13px] text-[#c45c26]">{warn}</p>}
          {error && <p className="mt-3 text-[13px] text-[#ff3b30]">{error}</p>}
          <button type="button" disabled={files.length < 2 || !title.trim() || !seam.trim() || busy} onClick={send} className="mt-5 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white transition duration-300 enabled:hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'laying the planks…' : 'lay the board'}
          </button>
          {filed && (
            <div className="mt-4 space-y-1 text-[14px]">
              {filed.card && <a className="block text-[#0A84FF]" href={filed.card}>{filed.card}</a>}
              {filed.shares.map((href) => <a key={href} className="block text-[#0A84FF]" href={href}>{href}</a>)}
            </div>
          )}
        </motion.section>

        {!shareId && recent.length > 0 && (
          <section className="mt-8 space-y-3">
            {recent.map((row) => (
              <a key={row.id} href={`/carvel/${row.id}`} className="block rounded-[22px] bg-white/70 px-5 py-4 ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5">
                <p className="text-[15px] font-medium">{row.title}</p>
                <p className="mt-1 text-[13px] text-[#6e6e73]">{row.seam} · {(row.file_names || []).length} files</p>
              </a>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
