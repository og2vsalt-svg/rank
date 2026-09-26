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

export default function KestrelPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [info, setInfo] = useState<{ name: string; type: string; size: number; modified: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const inspect = (file: File | undefined) => {
    if (!file) return;
    setInfo({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      modified: file.lastModified ? new Date(file.lastModified).toISOString() : 'unknown',
    });
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. encoding may feel slow. no hard cap.' : '');
    setErr('');
    setLastId(null);
    setLink('');
  };

  const publish = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    inspect(file);
    setBusy(true);
    try {
      const result = await addFiles([file], 'drops');
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
      setErr(e?.message || 'kestrel missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">kestrel</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">hover, then send.</h1>
          <p className="text-neutral-400 text-sm mb-6">read name, type, and weight of a local file. publish it to the share db when you are ready. discord uses /s.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); publish(e.dataTransfer.files); }}>
            <input type="file" className="hidden" onChange={(e) => publish(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'lifting…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. just a lag warning if it is huge.</p>
          </label>
          {info && (
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">name</p><p className="text-white break-all">{info.name}</p></div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">type</p><p className="text-white break-all">{info.type}</p></div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">size</p><p className="text-white">{pretty(info.size)}</p></div>
              <div className="rounded-2xl bg-white/[0.04] p-4"><p className="text-neutral-500 text-xs">modified</p><p className="text-white text-xs">{info.modified}</p></div>
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
