import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SoftHarborPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [shares, setShares] = useState<{ id: string; url: string; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const heavy = useMemo(() => files.some(f => f.size > 40 * 1024 * 1024), [files]);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const onSelect = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    setWarn(heavy ? 'large files present. harbor may feel slow while the tide settles. no hard limits.' : '');
    setShares([]);
  };

  const drop = async () => {
    if (!files.length) return;
    setBusy(true);
    setWarn('');
    try {
      const results = [];
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: note || 'harbor drop',
          color: accent,
          cardTitle: note ? note.slice(0, 80) : f.name,
          meta: { source: 'softharbor', accent },
        });
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          results.push({ id: res.id, url: urls.app, name: f.name });
        }
      }
      setShares(results);
      if (results[0]) {
        try { await navigator.clipboard.writeText(results[0].url); } catch {}
      }
      listPublicShares(6).then(setRecent).catch(() => {});
    } catch (e: any) {
      setWarn(e?.message || 'harbor drop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto relative">
        {/* gentle harbor waves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="absolute left-0 right-0 h-24 rounded-full blur-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
                top: `${30 + i * 12}%`,
                opacity: 0.18,
              }}
              animate={{
                x: ['-10%', '10%', '-10%'],
                scaleY: [1, 1.08, 1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 16 }}
          className="glass rounded-[40px] p-8 sm:p-12 relative"
        >
          <p className="text-[#5AC8FA] text-sm font-medium mb-2 tracking-wide">soft harbor</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">a quiet harbor for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Drop one or many local files with a shared note and accent. Soft waves of light lap and settle with spring motion on deep navy glass. Recent public drops surface as quiet cards along the quay. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label
            className="block cursor-pointer rounded-[32px] border border-dashed border-white/12 hover:border-white/25 p-12 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onSelect(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
            <p className="text-white font-medium">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'click or drop files'}</p>
            <p className="text-xs text-neutral-500 mt-2">{files.length ? files.map(f => f.name).join(', ').slice(0, 60) + (files.length > 1 ? '…' : '') : 'no size limits · only slowness warnings'}</p>
          </label>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note (embed title)"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/25 mb-4"
          />

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!files.length || busy}
            onClick={drop}
            className="w-full py-3.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition"
          >
            {busy ? 'settling into harbor…' : 'drop into soft harbor'}
          </motion.button>

          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}

          <AnimatePresence>
            {shares.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-3"
              >
                {shares.map(s => (
                  <div key={s.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-200">{s.name}</p>
                      <p className="text-xs text-neutral-500 break-all">{s.url}</p>
                    </div>
                    <button onClick={() => navigate('share', s.id)} className="px-3 py-1.5 rounded-full bg-white/10 text-xs">open</button>
                  </div>
                ))}
                <p className="text-[11px] text-neutral-500">Discord will show a pro card on these links.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {recent.length > 0 && (
          <div className="mt-12">
            <p className="text-xs text-neutral-500 mb-4 tracking-wide">recent harbor lights</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.06 }}
                  onClick={() => navigate('share', r.id)}
                  className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="w-6 h-6 rounded-full mb-2" style={{ background: r.color || accent }} />
                  <p className="text-xs text-neutral-300 truncate">{r.caption || r.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
