import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls } from '../lib/cloudShare';

export default function SoftLumenSpringPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicShares(24).then(setShares).finally(() => setLoading(false));
  }, []);

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large drop. The browser may feel slow while it sends. No hard limit — only a gentle warning.' : null);
    setErr('');
  };

  const share = async () => {
    if (!files.length) return setErr('choose at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const newLinks: string[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'from the lumen spring',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softlumenspring' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload failed');
        if (res.warn) setWarn(res.warn);
      }
      setLinks(newLinks);
      const fresh = await listPublicShares(24);
      setShares(fresh);
      setFiles([]);
      setNote('');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[140%] h-64 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${accent}30, transparent 60%)` }}
          animate={{ y: [0, -12, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-1 rounded-full"
            style={{ left: `${15 + i * 14}%`, height: 120 + i * 20, background: `${accent}40` }}
            animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="relative pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl border border-white/10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Soft Lumen Spring</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3 text-white">A flowing spring for what you carry.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop one or many local files with a shared note and accent. Soft streams of light rise and settle with spring motion on deep navy glass. Recent public drops surface as quiet cards along the banks. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note for the spring…"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label
              className="flex-1 text-[13px] text-neutral-300 cursor-pointer hover:text-white transition border border-dashed border-white/15 rounded-[16px] py-3 px-4 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            >
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Choose or drop local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Flowing into the spring…' : 'Share to the spring'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-1">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all hover:underline" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-12">
          <h2 className="text-lg font-medium text-white mb-4 tracking-tight">Recent arrivals</h2>
          {loading ? (
            <div className="text-center text-neutral-500 text-sm">gathering…</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {shares.slice(0, 8).map((s, i) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).app}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                  className="glass rounded-3xl p-5 block hover:bg-white/[0.07] transition-all duration-500"
                >
                  <p className="text-xs text-neutral-500 mb-1 truncate">{s.name || 'untitled'}</p>
                  <p className="text-sm text-neutral-300 line-clamp-2 mb-3">{s.caption || 'shared quietly'}</p>
                  <p className="text-[11px] text-neutral-600">{(s.size / 1024 / 1024).toFixed(1)} MB · {s.downloads || 0} arrivals</p>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
