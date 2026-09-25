import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function TerracePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<{ id: string; name: string; embed: string }[]>([]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const fat = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(fat ? 'one of these is huge. the tab may hitch while it encodes. still no cap.' : '');
    setErr('');
    setBusy(true);
    const next: { id: string; name: string; embed: string }[] = [];
    try {
      for (const f of files) {
        const dt = new DataTransfer();
        dt.items.add(f);
        const result = await addFiles(dt.files, 'terrace');
        if (!result.ok || !result.ids?.[0]) {
          setErr(result.error || `missed ${f.name}`);
          continue;
        }
        const id = result.ids[0];
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || `saved ${f.name} locally, cloud missed`);
        }
        next.push({ id, name: f.name, embed: shareUrls(id).embed });
      }
      setRows(next);
      if (next[0]) {
        try { await navigator.clipboard.writeText(next.map((r) => r.embed).join('\n')); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'terrace failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">terrace</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay a few files out in the sun.</h1>
          <p className="text-neutral-400 text-sm mb-6">batch publish. each file gets its own public db row and a discord-ready /s link.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'setting the terrace…' : 'drop several files'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. just slowness warnings.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {rows.length > 0 && (
            <div className="mt-6 space-y-2">
              {rows.map((r) => (
                <button key={r.id} onClick={() => navigate('share', r.id)} className="w-full text-left rounded-2xl bg-black/35 border border-white/8 px-4 py-3 hover:border-white/16 transition">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500 break-all">{r.embed}</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
