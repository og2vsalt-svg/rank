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

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SolsticePage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [info, setInfo] = useState<{ name: string; type: string; size: number; hash: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const run = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    setLink('');
    setLastId(null);
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy file. hashing plus encode might feel sleepy. no hard cap.' : '');
    try {
      const hash = await sha256(file);
      setInfo({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, hash });
      const result = await addFiles([file], 'solstice');
      if (!result.ok || !result.ids?.[0]) {
        setErr(result.error || 'could not keep the file');
        return;
      }
      const pub = await togglePublic(result.ids[0]);
      if (!pub.ok) {
        setErr(pub.error || 'saved but publish failed');
        setLastId(result.ids[0]);
        return;
      }
      setLastId(result.ids[0]);
      const urls = shareUrls(result.ids[0]);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'solstice missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">solstice</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">hash, then hand off.</h1>
          <p className="text-neutral-400 text-sm mb-6">fingerprint a local file with sha-256, keep it, then publish to the share db. discord card is /s. not another vault grid.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'marking the longest day…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. only a lag warning if it is huge.</p>
          </label>
          {info && (
            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">name</p><p className="text-white break-all">{info.name}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">type</p><p className="text-white break-all">{info.type}</p></div>
                <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">size</p><p className="text-white">{pretty(info.size)}</p></div>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">sha-256</p><p className="text-white break-all font-mono text-xs">{info.hash}</p></div>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {lastId && !err && (
            <div className="mt-6 space-y-3">
              {link && <p className="text-xs text-neutral-400 break-all">discord card copied: {link}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate('share', lastId)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open share</button>
                <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">vault</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
