import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Piece = { id: string; name: string; size: number; mime: string; url: string };
type Pallet = {
  id: string;
  receiver: string;
  note: string | null;
  author: string | null;
  pieces: Piece[];
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function PalletPage() {
  const { shareId } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [receiver, setReceiver] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [pallet, setPallet] = useState<Pallet | null>(null);

  const slow = useMemo(() => {
    const heavy = files.filter((f) => f.size > 40 * 1024 * 1024);
    if (!heavy.length) return '';
    return `${heavy.length} file${heavy.length > 1 ? 's are' : ' is'} large. the tab may feel slow while they send. nothing is refused for size.`;
  }, [files]);

  useEffect(() => {
    if (!shareId) return;
    let cancel = false;
    (async () => {
      const table = await sbRest(`pallets?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`).catch(() => null);
      if (table && table.ok) {
        const rows = await table.json();
        if (!cancel && Array.isArray(rows) && rows[0]) {
          setPallet(rows[0]);
          return;
        }
      }
      const share = await fetchShare(shareId);
      if (!share?.url || cancel) return;
      try {
        const body = await fetch(share.url).then((r) => r.json());
        if (!cancel && body && Array.isArray(body.pieces)) setPallet({ ...body, id: shareId });
      } catch {
        if (!cancel) setPallet(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [shareId]);

  const send = async () => {
    if (!files.length) return;
    setErr('');
    setWarn(slow);
    const pieces: Piece[] = [];
    for (const file of files) {
      setBusy(`sending ${file.name}`);
      const published = await publishLocalFile(file, {
        caption: note,
        author,
        cardTitle: file.name,
      });
      if (!published.ok || !published.id || !published.url) {
        setBusy('');
        setErr(published.error || `could not send ${file.name}`);
        return;
      }
      pieces.push({
        id: published.id,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        url: published.url,
      });
      if (published.warn) setWarn(published.warn);
    }
    const manifest = {
      receiver: receiver || 'whoever has the link',
      note: note || null,
      author: author || null,
      pieces,
    };
    const blob = new File([JSON.stringify(manifest)], 'pallet.json', { type: 'application/json' });
    setBusy('writing the slip');
    const slip = await publishLocalFile(blob, {
      caption: note || `${pieces.length} files`,
      author,
      cardTitle: receiver ? `pallet for ${receiver}` : `pallet · ${pieces.length} files`,
    });
    setBusy('');
    if (!slip.ok || !slip.id) {
      setErr(slip.error || 'files landed, but the slip did not');
      return;
    }
    const row: Pallet = { id: slip.id, ...manifest };
    const saved = await sbRest('pallets', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    }).catch(() => null);
    if (saved && !saved.ok) {
      setWarn((prev) => prev || 'slip is on the share table. the pallets table did not take the row, the link still opens.');
    }
    setPallet(row);
    const next = `${location.origin}/pallet/${slip.id}`;
    setLink(next);
    history.pushState(null, '', `/pallet/${slip.id}`);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          several files, one link
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Pallet
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Not another drawer. Each local file goes to the share table, then a slip ties them together. Paste /pallet/id in Discord for a card. Older desks stay put.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#0a84ff]/60">
            <span className="text-sm text-white/80">{files.length ? `${files.length} chosen` : 'choose files from this device'}</span>
            <span className="mt-1 text-xs text-white/40">no size cap</span>
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </label>
          {!!files.length && (
            <ul className="mt-4 space-y-1.5">
              {files.map((file) => (
                <li key={file.name + file.size} className="flex items-center justify-between rounded-2xl bg-black/25 px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <span className="text-white/40">{pretty(file.size)}</span>
                </li>
              ))}
            </ul>
          )}
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="who it is for" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the discord card" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          <button disabled={!files.length || !!busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40">
            {busy || 'send the pallet'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#7ab6ff]">
              {link} — copied on click
            </button>
          )}
        </motion.div>

        {pallet && (
          <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">open pallet</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">for {pallet.receiver}</h2>
            <p className="mt-2 text-sm text-white/60">{pallet.note || 'no note'}{pallet.author ? ` · ${pallet.author}` : ''}</p>
            <ul className="mt-4 space-y-2">
              {(pallet.pieces || []).map((piece) => (
                <li key={piece.id}>
                  <a href={piece.url} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                    <span className="truncate">{piece.name}</span>
                    <span className="text-white/40">{pretty(Number(piece.size) || 0)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.article>
        )}
      </main>
    </div>
  );
}
