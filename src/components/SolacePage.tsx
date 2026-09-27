import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

async function sha256(buf: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SolacePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [digest, setDigest] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  const onFiles = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy file. hashing might take a sec. no cap.' : '');
    setErr('');
    setDigest('');
    setLastId(null);
    setMeta({ name: file.name, size: file.size, type: file.type || 'unknown' });
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const hex = await sha256(buf);
      setDigest(hex);
      const result = await addFiles([file], 'inbox');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not keep file');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved but publish failed');
        setLastId(result.ids[0]);
        return;
      }
      setLastId(result.ids[0]);
      try { await navigator.clipboard.writeText(shareUrls(result.ids[0]).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'solace missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">solace</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">fingerprint then share.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 locally, drop into the vault, publish to the share db. discord unfurl still lives on /s.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'reading…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning if it is huge.</p>
          </label>
          {meta && (
            <div className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>{meta.name}</p>
              <p>{meta.type} · {(meta.size / 1024).toFixed(1)} kb</p>
            </div>
          )}
          {digest && (
            <p className="mt-3 text-[11px] font-mono text-neutral-300 break-all bg-white/5 rounded-2xl p-3">{digest}</p>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && !err && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
              <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
