import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

const ACCENTS = ['#0A84FF', '#64D2FF', '#30D158', '#FFD60A', '#FF9F0A', '#BF5AF2', '#FF375F'];

export default function SoftLumenForgePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; embed: string; name: string } | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  const loadRecent = useCallback(async () => {
    const rows = await listPublicShares(6);
    setRecent(rows);
  }, []);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list || []);
    setFiles(arr.slice(0, 3));
    setWarn(null);
    setResult(null);
    const big = arr.find((f) => f.size > 40 * 1024 * 1024);
    if (big) setWarn('large drop. encoding or upload may feel slow. no hard limit.');
  }, []);

  const forge = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setWarn(null);
    setResult(null);
    try {
      const file = files[0];
      const res = await publishLocalFile(file, {
        caption: caption.trim() || undefined,
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'softlumenforge' },
      });
      if (!res.ok) {
        setWarn(res.error || 'could not forge the share');
        return;
      }
      setResult({ id: res.id || '', embed: res.embed || '', name: file.name });
      setFiles([]);
      setCaption('');
      void loadRecent();
    } catch (e: any) {
      setWarn(e?.message || 'forge failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[36px] p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30 blur-3xl" style={{ background: accent }} />
          <p className="text-[#0a84ff] text-sm tracking-wide mb-2 relative">soft lumen forge</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">forge what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-8 relative leading-relaxed">
            Drop a local file. Give it a quiet note and an accent. Soft spectral light settles with spring motion on deep navy glass.
            Lands in storage and public shares. Every link unfurls a polished Discord card. Large drops warned, never refused.
          </p>

          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#0a84ff]/40'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-[#0a84ff]/40'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#0a84ff]/40');
              onDrop(e.dataTransfer.files);
            }}
            className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center transition-all duration-300 hover:bg-white/[0.05]"
          >
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => e.target.files && onDrop(e.target.files)}
              multiple={false}
            />
            <p className="text-neutral-300 text-sm">drop a local file here, or click</p>
            {files.length > 0 && (
              <p className="mt-2 text-white text-sm truncate">{files[0].name}</p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="quiet note (optional)"
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-[#0a84ff]/50 transition"
            />
            <div className="flex gap-2 flex-wrap">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform active:scale-95"
                  style={{ background: c, borderColor: accent === c ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-amber-300/90">
              {warn}
            </motion.p>
          )}

          <button
            onClick={forge}
            disabled={!files.length || busy}
            className="mt-6 w-full bg-white text-black font-medium py-3.5 rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            {busy ? 'forging…' : 'forge share'}
          </button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10"
              >
                <p className="text-sm text-white mb-1 truncate">{result.name}</p>
                <p className="text-xs text-neutral-400 break-all">{result.embed}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(result.embed)}
                  className="mt-2 text-xs text-[#0a84ff] hover:underline"
                >
                  copy link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <button onClick={loadRecent} className="mt-8 text-xs text-neutral-500 hover:text-neutral-300 transition">
          refresh recent public drops
        </button>
        <div className="mt-4 space-y-3">
          {recent.map((r) => (
            <a
              key={r.id}
              href={`/s/${r.id}`}
              className="block rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 hover:bg-white/[0.05] transition"
            >
              <p className="text-white text-sm truncate">{r.name}</p>
              <p className="text-xs text-neutral-500">{r.caption || 'shared'} · {(r.size / 1024).toFixed(1)} kb</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
