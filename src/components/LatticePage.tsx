import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function LatticePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [ids, setIds] = useState<string[]>([]);

  const take = (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (which === 'a') setA(f);
    else setB(f);
    const size = f.size + (which === 'a' ? b?.size || 0 : a?.size || 0);
    setWarn(size > 40 * 1024 * 1024 ? 'this lattice is heavy. publish may lag. no hard cap.' : '');
    setErr('');
  };

  const publish = async () => {
    if (!a || !b) return;
    setBusy(true);
    setErr('');
    setIds([]);
    try {
      const result = await addFiles([a, b] as unknown as FileList, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'need a session to weave this lattice');
        return;
      }
      const next = result.ids || [];
      const live: string[] = [];
      for (const id of next) {
        const pub = await togglePublic(id);
        if (pub.ok) live.push(id);
      }
      if (!live.length) {
        setErr('saved locally but cloud publish failed');
        return;
      }
      setIds(live);
      try { await navigator.clipboard.writeText(live.map((id) => shareUrls(id).embed).join('\n')); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'lattice failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lattice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two files, one weave.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault dump. pick two local files, publish both, copy both discord /s/ links. pair a still with a note, or a clip with a sidecar.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {(['a', 'b'] as const).map((slot) => {
              const file = slot === 'a' ? a : b;
              return (
                <label
                  key={slot}
                  className="cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition-all duration-300"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); take(slot, e.dataTransfer.files); }}
                >
                  <input type="file" className="hidden" onChange={(e) => take(slot, e.target.files)} />
                  <p className="text-xs text-neutral-500 mb-1">slot {slot}</p>
                  <p className="text-white text-sm font-medium break-all">{file ? file.name : 'drop a file'}</p>
                </label>
              );
            })}
          </div>
          <button onClick={publish} disabled={busy || !a || !b} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">
            {busy ? 'weaving…' : 'publish both shares'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {ids.length > 0 && (
            <div className="mt-6 space-y-2">
              {ids.map((id) => (
                <p key={id} className="text-xs text-neutral-400 break-all">{shareUrls(id).embed}</p>
              ))}
              <button onClick={() => navigate('share', ids[0])} className="px-4 py-2 rounded-full bg-white/10 text-sm">open first share</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
