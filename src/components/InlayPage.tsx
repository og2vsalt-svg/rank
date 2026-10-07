import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Row = {
  id: string;
  name: string;
  mime?: string;
  size?: number;
  author?: string;
  note?: string;
  sha256?: string;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function InlayPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let dead = false;
    (async () => {
      setBusy(true);
      setErr('');
      try {
        const r = await fetch(`/api/pressmark?id=${encodeURIComponent(shareId)}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing inlay');
        if (!dead) setRow(data.row);
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : 'could not read the inlay');
      } finally {
        if (!dead) setBusy(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [shareId]);

  const onFile = (next: File | null) => {
    setFile(next);
    setErr('');
    if (next && next.size > 1.5 * 1024 * 1024) {
      setWarn('heavier than a postcard. the write into postgres may feel slow. it will not be refused for size.');
    } else {
      setWarn('');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('author', author);
      body.set('note', note);
      const r = await fetch('/api/pressmark', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the database did not take the file');
      if (data.warn) setWarn(data.warn);
      navigate('inlay', data.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  const shareUrl = row ? `${window.location.origin}/inlay/${row.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-8 md:p-10"
        >
          <p className="text-[#0a84ff] text-sm mb-2">inlay</p>
          {shareId ? (
            busy && !row ? (
              <p className="text-neutral-400 text-sm">opening the inlay…</p>
            ) : !row ? (
              <>
                <h1 className="text-3xl font-semibold tracking-tight mb-3">no inlay under that id</h1>
                <p className="text-sm text-neutral-500 mb-6">{err || 'the row is gone, or it never landed.'}</p>
                <button onClick={() => navigate('inlay')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">file one</button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-semibold tracking-tight mb-2">{row.name}</h1>
                <p className="text-sm text-neutral-400 mb-5">
                  {pretty(Number(row.size) || 0)} · {row.mime || 'file'} · kept in postgres, not only a link
                </p>
                {row.note ? <p className="text-[15px] leading-relaxed text-neutral-200 mb-4">{row.note}</p> : null}
                <p className="text-xs text-neutral-500 break-all mb-6">sha256 {row.sha256}</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`/api/pressmark?id=${encodeURIComponent(row.id)}&raw=1`} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">download</a>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                    }}
                    className="px-5 py-2.5 rounded-full bg-white/10 text-sm"
                  >
                    {copied ? 'copied' : 'copy link'}
                  </button>
                  <button onClick={() => navigate('rack')} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">rack</button>
                </div>
                <p className="text-xs text-neutral-500 mt-5">paste the link in discord. the card uses the file name, note, and size.</p>
              </>
            )
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">set a local file into the database</h1>
              <p className="text-sm text-neutral-400 mb-6">
                the bytes themselves land in the pressmarks table. a public link follows. the cover desk and the older file desks stay. this is not a vault drawer.
              </p>
              <form onSubmit={submit} className="space-y-3">
                <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
                  <span className="text-sm text-neutral-300">{file ? file.name : 'choose a file from this machine'}</span>
                  {file ? <span className="block text-xs text-neutral-500 mt-1">{pretty(file.size)}</span> : null}
                </label>
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who filed it" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note for the card" className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
                {warn ? <p className="text-xs text-amber-200/80">{warn}</p> : null}
                {err ? <p className="text-xs text-red-300">{err}</p> : null}
                <button disabled={!file || busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
                  {busy ? 'writing…' : 'file it'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
