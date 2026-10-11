import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function DockPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    listPublicShares(16).then(setShares).catch(() => {});
  }, []);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    const big = file.size > 40 * 1024 * 1024;
    setWarn(big ? 'large file. the browser may lag while sending. no hard size limit — just a warning.' : '');
    setErr('');
    setBusy(true);
    try {
      const res = await publishLocalFile(file, { caption: caption || 'docked share' });
      if (!res.ok || !res.id) {
        setErr(res.error || 'could not dock the file');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
      setShares((prev) => [{ ...res.meta!, id: res.id, name: file.name, size: file.size, caption } as CloudMeta, ...prev].slice(0, 16));
      setCaption('');
    } catch (e: any) {
      setErr(e?.message || 'dock failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="glass rounded-[32px] p-8 mb-10">
          <p className="text-[#0A84FF] text-sm font-medium mb-2">dock</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">file dock</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-6 max-w-xl">Central place to drop local files into the shared database. Every link carries a polished Discord embed. Large files trigger only a gentle slowdown warning.</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="caption for the Discord card (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-[#0A84FF]/50 transition"
            />
          </div>
          <label
            className="block cursor-pointer rounded-[28px] border-2 border-dashed border-white/15 hover:border-[#0A84FF]/60 p-14 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-xl font-medium text-white">{busy ? 'docking…' : 'drop or click to dock a file'}</p>
            <p className="text-xs text-neutral-500 mt-3">no limits. embeds on all shares. Apple-smooth motion.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/90 mt-5">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-5">{err}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-semibold mb-5">recent public docks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('share', s.id)}
                className="text-left glass rounded-3xl p-5 hover:bg-white/[0.06] transition-colors"
              >
                <p className="font-medium truncate text-white">{s.name || 'shared file'}</p>
                <p className="text-xs text-neutral-400 mt-1.5">{((s.size || 0) / 1024 / 1024).toFixed(1)} MB{s.caption ? ` · ${s.caption}` : ''}</p>
                <p className="text-[11px] text-[#0A84FF] mt-3 font-mono">/s/{s.id}</p>
              </motion.button>
            ))}
            {!shares.length && <p className="text-sm text-neutral-500 col-span-full">nothing docked yet. drop a file above.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
