import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function LoftPage() {
  const { addFiles, togglePublic, files } = useVault();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [preview, setPreview] = useState<{ name: string; type: string; url: string; size: number } | null>(null);

  const recent = useMemo(
    () => files.filter((f) => f.folder === 'loft').slice(0, 8),
    [files],
  );

  const handle = async (list: FileList | File[] | null) => {
    if (!list || !('length' in list) || !list.length) return;
    const arr = [...list];
    const first = arr[0];
    const heavy = arr.some((f) => f.size > 32 * 1024 * 1024);
    setWarn(heavy ? 'large file — encoding may feel slow in this tab. nothing is blocked.' : '');
    setErr('');
    setLink('');
    if (first.type.startsWith('image/') || first.type.startsWith('video/') || first.type.startsWith('audio/')) {
      setPreview({ name: first.name, type: first.type, url: URL.createObjectURL(first), size: first.size });
    } else {
      setPreview({ name: first.name, type: first.type || 'file', url: '', size: first.size });
    }
    setBusy(true);
    try {
      const result = await addFiles(arr, 'loft');
      if (!result.ok) {
        setErr(result.error || 'could not keep the file locally');
        return;
      }
      if (result.warn) setWarn(result.warn);
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'kept locally; cloud publish missed');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6"
        >
          <div className="glass rounded-[32px] p-8">
            <p className="text-[#0a84ff] text-sm mb-2">loft</p>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">preview first, then send it out.</h1>
            <p className="text-neutral-400 text-sm mb-7 leading-relaxed">
              a studio bench for a local file. we keep it in your vault folder called loft, publish a public share
              into the database, and mint a discord-ready card. no hard cap — just a slowness warning when the file is heavy.
            </p>
            <label
              className="block cursor-pointer rounded-[28px] border border-dashed border-white/15 hover:border-[#0a84ff]/60 p-12 text-center transition-all duration-300"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handle(e.dataTransfer.files);
              }}
            >
              <input type="file" className="hidden" multiple onChange={(e) => handle(e.target.files)} />
              <div className="text-white text-base">{busy ? 'encoding…' : 'drop a file onto the loft'}</div>
              <div className="text-neutral-500 text-sm mt-2">images, clips, notes, dumps — anything</div>
            </label>
            {warn && <p className="mt-4 text-amber-300/90 text-sm">{warn}</p>}
            {err && <p className="mt-4 text-rose-300 text-sm">{err}</p>}
            {link && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                <p className="text-neutral-500 text-xs mb-1">public link copied</p>
                <button
                  onClick={() => navigate('share', link.split('f=')[1] || '')}
                  className="text-[#0a84ff] text-sm break-all text-left"
                >
                  {link}
                </button>
              </motion.div>
            )}
          </div>

          <div className="glass rounded-[32px] p-8 min-h-[320px] flex flex-col">
            <p className="text-neutral-500 text-xs uppercase tracking-[0.18em] mb-4">live still</p>
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key={preview.name}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1"
                >
                  {preview.type.startsWith('image/') && preview.url && (
                    <img src={preview.url} alt="" className="w-full max-h-72 object-contain rounded-2xl" />
                  )}
                  {preview.type.startsWith('video/') && preview.url && (
                    <video src={preview.url} controls className="w-full rounded-2xl" />
                  )}
                  {preview.type.startsWith('audio/') && preview.url && (
                    <audio src={preview.url} controls className="w-full mt-8" />
                  )}
                  {!preview.url && (
                    <div className="h-40 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-400 text-sm">
                      {preview.type || 'file'}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="text-white text-sm truncate">{preview.name}</div>
                    <div className="text-neutral-500 text-xs mt-1">{pretty(preview.size)}</div>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-neutral-500 text-sm leading-relaxed"
                >
                  nothing on the bench yet. drop something and the still appears here before the public link is minted.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {recent.length > 0 && (
          <div className="mt-10">
            <p className="text-neutral-500 text-xs uppercase tracking-[0.18em] mb-4">recent in loft</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recent.map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate('share', f.id)}
                  className="glass rounded-2xl p-4 text-left hover:bg-white/5 transition"
                >
                  <div className="text-white text-sm truncate">{f.name}</div>
                  <div className="text-neutral-500 text-xs mt-1">{pretty(f.size)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
