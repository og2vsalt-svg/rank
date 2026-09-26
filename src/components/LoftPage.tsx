import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} mb`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} gb`;
}

export default function LoftPage() {
  const { files, addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [link, setLink] = useState('');

  const recent = useMemo(() => (files || []).slice(0, 12), [files]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'chunky drop. encoding might feel sleepy. no hard cap tho.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'loft');
      if (!result.ok) {
        setErr(result.error || 'could not park the file');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const id = result.ids?.[0];
      if (id) setPicked(id);
    } catch (e: any) {
      setErr(e?.message || 'loft miss');
    } finally {
      setBusy(false);
    }
  };

  const publish = async (id: string) => {
    setBusy(true);
    setErr('');
    try {
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'cloud publish failed');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.app);
      setPicked(id);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">loft</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">park files upstairs first.</h1>
          <p className="text-neutral-400 text-sm mb-7">
            staging desk, not the vault. drop local stuff here, glance at it, then flip one public when you actually want a link.
          </p>

          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'parking…' : 'drop into the loft'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file cap. just a slowness heads-up if it is huge.</p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}

          <AnimatePresence>
            {link && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-neutral-400 break-all mt-4"
              >
                share link copied: {link}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-8 space-y-2">
            {recent.length === 0 && (
              <p className="text-sm text-neutral-500">loft is empty. drop something quiet.</p>
            )}
            {recent.map((f: any) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 bg-white/[0.03] border ${
                  picked === f.id ? 'border-[#0a84ff]/40' : 'border-white/5'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{f.name || 'untitled'}</p>
                  <p className="text-[11px] text-neutral-500">{pretty(Number(f.size) || 0)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => publish(f.id)}
                    className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors"
                  >
                    publish
                  </button>
                  <button
                    onClick={() => navigate('share', f.id)}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 text-xs text-neutral-300 hover:text-white transition-colors"
                  >
                    open
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
