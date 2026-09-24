import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function LoftPage() {
  const { addFiles, togglePublic, setNote } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setLocalNote] = useState('');
  const [rows, setRows] = useState<{ id: string; name: string; app: string; embed: string; size: number }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'one of these is huge. tab might lag while it encodes. still no cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'drops');
      if (!result.ok) {
        setErr(result.error || 'could not save');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const next: typeof rows = [];
      const filesArr = [...list];
      for (let i = 0; i < (result.ids || []).length; i++) {
        const id = result.ids![i];
        if (note.trim()) setNote(id, note.trim());
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || 'saved locally but cloud publish failed');
          continue;
        }
        const urls = shareUrls(id);
        next.push({
          id,
          name: filesArr[i]?.name || id,
          app: urls.app,
          embed: urls.embed,
          size: filesArr[i]?.size || 0,
        });
      }
      setRows(next);
      if (next[0]) {
        try { await navigator.clipboard.writeText(next[0].embed); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'loft drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">loft</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">upload a local file to the share db.</h1>
          <p className="text-neutral-400 text-sm mb-6">lands in your vault then publishes a public row. paste the /s/ link in discord for a real embed card.</p>
          <textarea value={note} onChange={(e) => setLocalNote(e.target.value)} placeholder="optional note on this batch" className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 min-h-[72px]" />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop files or click to pick'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file size cap. just a slowness warning if it is chunky.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <p className="text-sm text-white">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{pretty(r.size)}</p>
                  <p className="text-[11px] text-neutral-400 break-all mt-2">app {r.app}</p>
                  <p className="text-[11px] text-neutral-400 break-all">embed {r.embed}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => navigate('share', r.id)} className="px-4 py-2 rounded-full bg-white text-black text-xs font-medium">open</button>
                    <button onClick={() => navigator.clipboard.writeText(r.embed)} className="px-4 py-2 rounded-full bg-white/5 text-xs">copy discord link</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
