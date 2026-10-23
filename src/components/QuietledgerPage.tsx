import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function QuietledgerPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return shares;
    return shares.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.caption || '').toLowerCase().includes(q) ||
      (s.author || '').toLowerCase().includes(q)
    );
  }, [shares, query]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(48);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note ? `${note} · ${file.name}` : file.name,
        color,
        cardTitle: note || file.name,
        meta: { accent: color, source: 'quietledger' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">quietledger</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a quiet ledger of shared light</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
            Search the public record of what has been shared across every desk, or drop local files into the ledger. Soft glass rows that settle gently. Each file lands in storage and the public_shares table with a polished Discord embed. Large files warned, never refused. Prior features preserved.
          </p>
        </motion.div>

        <div className="mt-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search names, notes, authors…"
            className="w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] outline-none focus:bg-white/[0.06]"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">opening the ledger…</p>
            ) : !filtered.length ? (
              <p className="text-sm text-white/40">nothing matches. the first drop will appear here.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).embed}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015, type: 'spring', stiffness: 140, damping: 20 }}
                    className="glass flex items-center justify-between gap-4 rounded-2xl p-4 hover:bg-white/[0.06] transition block"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{s.name || s.id}</p>
                      {s.caption && <p className="mt-0.5 truncate text-[12px] text-white/50">{s.caption}</p>}
                      <p className="mt-1 text-[11px] text-white/30">{s.author || 'anonymous'} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'recent'}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-white/40">{((s.size || 0) / 1024).toFixed(0)} kb</span>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">add to the ledger</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-6 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} files ready` : 'drop or choose local files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type · soft warning only</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="shared note" className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[12px] text-white/45">accent</span>
            </div>
            {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'filing…' : 'share into the ledger'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
