import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, type CloudMeta } from '../lib/cloudShare';

export default function QuietGalleryPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<{ name: string; embed: string }[]>([]);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listPublicShares(36);
    setShares(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = useCallback(async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setErr('');
    setLinks([]);
    let large = false;
    const made: { name: string; embed: string }[] = [];
    try {
      for (const file of Array.from(list)) {
        if (file.size > 40 * 1024 * 1024) large = true;
        const res = await publishLocalFile(file, {
          caption: 'from the quiet gallery',
          color: '#0A84FF',
          cardTitle: file.name,
          meta: { desk: 'quietgallery' },
        });
        if (res.ok && res.embed) {
          made.push({ name: file.name, embed: res.embed });
        } else {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
      }
      setLinks(made);
      setWarn(large ? 'One or more files are large. Uploads may feel slow. No hard limit.' : null);
      if (made.length) load();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  }, [load]);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-10 text-center"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">Quiet Gallery</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">Recent public shares</h1>
          <p className="text-neutral-400 text-base max-w-xl mx-auto">
            A still visual archive of what has settled in the public record. Drop local files to add them. Soft size warnings only. No hard limits. Every link carries a polished Discord embed. All prior desks remain fully intact.
          </p>
        </motion.div>

        <label className="block rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-center cursor-pointer hover:border-white/25 transition mb-10 max-w-2xl mx-auto">
          <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} disabled={busy} />
          <p className="text-[15px] text-neutral-300">{busy ? 'Settling…' : 'Drop files or click to add to the gallery'}</p>
          <p className="text-[12px] text-neutral-500 mt-1">Images preview live. Large files warned, never refused.</p>
        </label>

        {warn && <p className="text-center text-[12px] text-amber-300/90 mb-6">{warn}</p>}

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 text-center space-y-1">
              <p className="text-[13px] text-neutral-400">New share links:</p>
              {links.map((l) => (
                <a key={l.embed} href={l.embed} className="block text-[13px] text-[#0A84FF] break-all">{l.name}</a>
              ))}
            </motion.div>
          )}
          {err && <motion.p className="text-center text-red-400 text-sm mb-6">{err}</motion.p>}
        </AnimatePresence>

        {loading ? (
          <div className="grid place-items-center py-20 text-neutral-500 text-sm">opening the gallery…</div>
        ) : shares.length === 0 ? (
          <p className="text-center text-neutral-500 text-sm">No public shares yet. Drop one above.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {shares.map((s, i) => (
              <motion.a
                key={s.id}
                href={`/s/${s.id}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: Math.min(i * 0.03, 0.4) }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass rounded-2xl overflow-hidden block group"
              >
                {s.type?.startsWith('image/') && s.fileUrl ? (
                  <img src={s.fileUrl} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-white/5 grid place-items-center text-neutral-500 text-xs">file</div>
                )}
                <div className="p-3">
                  <p className="text-[13px] truncate font-medium">{s.name || 'untitled'}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{s.caption || prettySize(s.size)}</p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
