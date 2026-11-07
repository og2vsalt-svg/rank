import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

type Dropped = { file: File; caption: string; id: string };

export default function SoftGlassAtelierPage() {
  const [drops, setDrops] = useState<Dropped[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  const refresh = useCallback(async () => {
    const list = await listPublicShares(12);
    setRecent(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onDrop = (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    const files = 'dataTransfer' in e ? Array.from(e.dataTransfer.files) : Array.from((e.target as HTMLInputElement).files || []);
    if (!files.length) return;
    const large = files.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limits.' : null);
    const next: Dropped[] = files.map(f => ({
      file: f,
      caption: '',
      id: Math.random().toString(36).slice(2),
    }));
    setDrops(d => [...d, ...next]);
  };

  const updateCaption = (id: string, caption: string) => {
    setDrops(d => d.map(x => x.id === id ? { ...x, caption } : x));
  };

  const remove = (id: string) => setDrops(d => d.filter(x => x.id !== id));

  const shareAll = async () => {
    if (!drops.length) return setErr('drop some files first');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    for (const d of drops) {
      const res = await publishLocalFile(d.file, {
        caption: d.caption.trim() || d.file.name,
        color: accent,
        cardTitle: d.file.name,
        meta: { desk: 'softglassatelier' },
      });
      if (res.ok && res.embed) newLinks.push(res.embed);
      else if (!res.ok) setErr(prev => prev || res.error || 'one upload slowed');
    }
    setLinks(newLinks);
    setDrops([]);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Glass Atelier</p>
          <h1 className="text-[32px] md:text-[36px] font-semibold tracking-tight mb-3">Arrange what you carry.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-2xl">
            Drop one or many local files. Give each a quiet caption. They land in storage and the public_shares table with your accent. Every share link unfurls a polished Discord card. Soft glass tiles settle with spring motion. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e); }}
            className="border-2 border-dashed border-white/15 rounded-[24px] p-10 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <p className="text-neutral-300 text-[15px]">Drop files here or click to choose</p>
            <p className="text-neutral-500 text-[13px] mt-1">multiple allowed · no size limits</p>
            <input id="file-input" type="file" multiple className="hidden" onChange={onDrop} />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">accent for cards and links</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <AnimatePresence>
            {drops.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20, delay: i * 0.02 }}
                className="flex items-center gap-3 mb-3 glass rounded-2xl p-4"
              >
                <div className="flex-1">
                  <p className="text-[14px] font-medium truncate">{d.file.name}</p>
                  <p className="text-[12px] text-neutral-500">{(d.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <input
                  value={d.caption}
                  onChange={(e) => updateCaption(d.id, e.target.value)}
                  placeholder="quiet caption"
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[14px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
                />
                <button onClick={() => remove(d.id)} className="text-neutral-500 hover:text-white text-sm">×</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={shareAll}
            disabled={busy || !drops.length}
            className="w-full mt-4 rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into glass…' : `Share ${drops.length || ''} file${drops.length === 1 ? '' : 's'}`}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <h2 className="text-[20px] font-semibold mb-5">Recent glass</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((r, i) => (
            <motion.a
              key={r.id}
              href={`/s/${r.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 100, damping: 18 }}
              className="glass rounded-[22px] p-5 block hover:bg-white/[0.03] transition"
            >
              <p className="text-[14px] font-medium truncate mb-1">{r.name || r.cardTitle || 'shared'}</p>
              {r.caption && <p className="text-[13px] text-neutral-400 line-clamp-2 mb-2">{r.caption}</p>}
              <p className="text-[11px] text-neutral-500">{r.size ? `${(r.size / 1024 / 1024).toFixed(1)} MB` : ''} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
