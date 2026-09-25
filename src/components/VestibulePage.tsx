import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function VestibulePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ name: string; size: number; id: string; embed: string }[]>([]);

  const take = async (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = Array.from(list);
    const fat = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(fat ? 'one or more files are huge. publish can feel slow. still no hard cap.' : '');
    setErr('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'vestibule');
      if (!result.ok) {
        setErr(result.error || 'need a session to park files');
        return;
      }
      const next: typeof rows = [];
      for (const id of result.ids || []) {
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || 'vault ok, cloud publish missed on one file');
          continue;
        }
        const urls = shareUrls(id);
        const match = files[next.length];
        next.push({
          name: match?.name || id,
          size: match?.size || 0,
          id,
          embed: urls.embed,
        });
      }
      setRows(next);
      if (next[0]) {
        try { await navigator.clipboard.writeText(next[0].embed); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'vestibule drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">vestibule</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">leave files at the door.</h1>
          <p className="text-neutral-400 text-sm mb-6">batch drop from your machine into the public share table. discord unfurls hit /s/id. not a vault grid.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => take(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing…' : 'drop one or many files'}</p>
            <p className="text-xs text-neutral-500 mt-2">unlimited size. lag warning only if a file is chunky.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500">{pretty(r.size)}</p>
                  <p className="text-[11px] text-neutral-500 break-all mt-1">{r.embed}</p>
                  <button onClick={() => navigate('share', r.id)} className="mt-2 text-xs text-[#0a84ff]">open share</button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
