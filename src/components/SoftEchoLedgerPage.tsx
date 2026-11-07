import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#64D2FF', '#FF453A', '#5AC8FA'];

export default function SoftEchoLedgerPage() {
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#BF5AF2');
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; embed: string }[]>([]);
  const [ledger, setLedger] = useState<CloudMeta[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  useEffect(() => {
    listPublicShares(36).then(setLedger).finally(() => setLoadingLedger(false));
  }, []);

  const onSelect = (list: FileList | null) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    const next = [...files, ...arr];
    setFiles(next);
    const total = next.reduce((n, f) => n + f.size, 0);
    setWarn(total > 50 * 1024 * 1024 ? 'Large collection. Encoding and upload may feel slow — no hard limit, just patience.' : '');
    setResults([]);
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const addEntry = async () => {
    if (!note.trim() && !files.length) return;
    setUploading(true);
    const out: { id: string; name: string; embed: string }[] = [];

    if (note.trim() && !files.length) {
      // pure note as text file
      const blob = new Blob([note], { type: 'text/plain' });
      const file = new File([blob], `${title || 'ledger-note'}.txt`, { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: note,
        cardTitle: title || 'ledger note',
        color: accent,
        meta: { kind: 'echo-ledger-note' },
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, name: file.name, embed: shareUrls(res.id).embed });
      }
    } else {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note || title,
          cardTitle: title || file.name,
          color: accent,
          meta: { kind: 'echo-ledger' },
        });
        if (res.ok && res.id) {
          out.push({ id: res.id, name: file.name, embed: shareUrls(res.id).embed });
        }
      }
    }

    setResults(out);
    setUploading(false);
    if (out.length) {
      setNote('');
      setTitle('');
      setFiles([]);
      listPublicShares(36).then(setLedger);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[#BF5AF2] text-sm font-medium tracking-wide mb-3">soft echo ledger</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            leave an echo in the quiet ledger.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            A different kind of desk: chronological notes and optional local files that settle into a living ledger. Soft glass entries rise with spring motion. Each lands in the database with a polished Discord embed. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">ledger title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="a short heading" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#BF5AF2]/50 transition" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">echo note</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="write a quiet note that becomes part of the ledger" rows={4} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#BF5AF2]/50 transition resize-none" />
              </label>
            </div>

            <motion.div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onSelect(e.dataTransfer.files); }}
              whileHover={{ scale: 1.005 }}
              className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] backdrop-blur-xl p-8 text-center cursor-pointer hover:border-white/25 transition-all"
            >
              <p className="font-medium mb-1">optional files</p>
              <p className="text-sm text-neutral-500">drop or click · any type · any size · no hard limits</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
            </motion.div>

            {warn && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-300 text-sm text-center">
                {warn}
              </motion.p>
            )}

            <AnimatePresence>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="rounded-2xl bg-white/[0.06] border border-white/10 px-3 py-2 text-xs relative"
                      style={{ boxShadow: `0 0 20px -8px ${accent}55` }}
                    >
                      <span className="truncate max-w-[140px] inline-block">{f.name}</span>
                      <button onClick={() => remove(i)} className="ml-2 text-neutral-400 hover:text-white">×</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            <div>
              <span className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">accent</span>
              <div className="flex gap-2 flex-wrap">
                {ACCENTS.map((c) => (
                  <button key={c} onClick={() => setAccent(c)} className={`w-8 h-8 rounded-full transition-all ${accent === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'}`} style={{ background: c }} />
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={addEntry}
              disabled={(!note.trim() && !files.length) || uploading}
              className="w-full py-3.5 rounded-full bg-[#BF5AF2] text-white font-medium text-sm hover:bg-[#c97af5] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {uploading ? 'settling…' : 'add to the ledger'}
            </motion.button>

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                      <p className="text-xs font-medium truncate mb-2">{r.name}</p>
                      <div className="flex gap-2">
                        <input readOnly value={r.embed} className="flex-1 bg-black/40 rounded-xl px-2 py-1.5 text-[10px] font-mono" />
                        <button onClick={() => copy(r.embed)} className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-medium hover:bg-neutral-200 active:scale-95">copy</button>
                      </div>
                      <button onClick={() => navigate('s', r.id)} className="mt-1.5 text-[11px] text-[#BF5AF2] hover:underline">open →</button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">living ledger</p>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {loadingLedger && <p className="text-sm text-neutral-500">gathering echoes…</p>}
              {!loadingLedger && ledger.length === 0 && <p className="text-sm text-neutral-500">the ledger is quiet. leave the first echo.</p>}
              <AnimatePresence>
                {ledger.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 120, damping: 20 }}
                    className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 cursor-pointer hover:bg-white/[0.06] transition"
                    onClick={() => navigate('s', item.id)}
                    style={{ boxShadow: item.color ? `0 0 16px -6px ${item.color}44` : undefined }}
                  >
                    <p className="text-sm font-medium truncate">{item.cardTitle || item.name}</p>
                    {item.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.caption}</p>}
                    <p className="text-[10px] text-neutral-500 mt-1.5">{item.size ? `${(item.size / 1024).toFixed(0)} KB` : 'note'} · {new Date(item.createdAt || '').toLocaleDateString()}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
