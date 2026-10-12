import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function NexusPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    const list = await listPublicShares(24);
    setRows(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'large drop — the browser may feel slow while it encodes and sends. no hard limit.' : '');
    setErr('');
    setBusy(true);
    setLink('');
    setCopied(false);
    try {
      const result = await addFiles(list, 'drops');
      if (!result.ok) {
        setErr(result.error || 'could not save locally');
        return;
      }
      const ids = result.ids || [];
      for (const id of ids) {
        const pub = await togglePublic(id);
        if (!pub.ok) {
          setErr(pub.error || 'one or more publishes failed');
          continue;
        }
        const urls = shareUrls(id);
        setLink(urls.embed);
        try {
          await navigator.clipboard.writeText(urls.embed);
          setCopied(true);
        } catch {}
      }
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">nexus</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">centered file hosting.</h1>
          <p className="text-neutral-400 text-base mb-8 max-w-xl leading-relaxed">
            Drop files, publish to the database, copy a Discord-ready link. Recent public shares live here — prior desks stay untouched.
          </p>

          <motion.label
            whileHover={{ y: -2 }}
            className="block cursor-pointer rounded-[28px] glass p-10 mb-8 border border-dashed border-white/15 hover:border-[#0A84FF]/50 transition apple-card"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} disabled={busy} />
            <p className="text-white font-medium text-lg">{busy ? 'publishing…' : 'drop files here'}</p>
            <p className="text-sm text-neutral-500 mt-2">lands in local vault + public shares table. Discord unfurls the /s/ link professionally.</p>
          </motion.label>

          {warn && <p className="text-sm text-amber-300/90 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          {link && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-neutral-300 mb-6 break-all"
            >
              {copied ? 'copied — ' : ''}discord embed ready: <span className="text-[#0A84FF]">{link}</span>
            </motion.p>
          )}

          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-medium">recent public</h2>
            <button onClick={() => navigate('lumen')} className="text-sm text-[#0A84FF]">full gallery</button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {rows.map((r, i) => (
                <motion.button
                  key={r.id}
                  onClick={() => navigate('share', r.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 100 }}
                  className="text-left rounded-[22px] glass p-5 hover:bg-white/[0.08] transition apple-card"
                >
                  <p className="text-sm font-medium text-white truncate">{r.name || 'untitled'}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{pretty(r.size)} · {(r.type || 'file').split(';')[0]}</p>
                  {r.caption && <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{r.caption}</p>}
                  <p className="text-[10px] text-neutral-600 mt-3 truncate">/s/{r.id}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {!rows.length && <p className="text-sm text-neutral-500 py-8 text-center">quiet for now. drop something above.</p>}

          <p className="mt-16 text-center text-xs text-neutral-600">all earlier features preserved. this is simply another surface.</p>
        </motion.div>
      </div>
    </div>
  );
}
