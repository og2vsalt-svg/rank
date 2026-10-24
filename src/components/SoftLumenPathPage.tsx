import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenPathPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#C4B5FD');
  const [hours, setHours] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(48);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    const expiresAt = hours && !isNaN(Number(hours)) && Number(hours) > 0
      ? new Date(Date.now() + Number(hours) * 3600 * 1000).toISOString()
      : null;
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        expiresAt,
        meta: { accent: color, source: 'softlumenpath', kind: 'path', hours: hours || null },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setCaption('');
    setHours('');
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softlumenpath</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">a quiet drifting path of shared light</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Shares settle along a soft vertical path, gently drifting as you scroll. Drop local files to place them on the path. Optional hours until the light fades. Spring motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused.
          </p>
        </motion.div>

        <div className="relative mt-12">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
          {loading ? (
            <p className="pl-16 text-white/40">tracing the path…</p>
          ) : shares.length === 0 ? (
            <p className="pl-16 text-white/40">the path is still quiet.</p>
          ) : (
            shares.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
                className="relative mb-6 pl-16"
              >
                <div className="absolute left-[22px] top-6 h-2 w-2 rounded-full" style={{ background: s.color || color }} />
                <motion.a
                  href={shareUrls(s.id).embed}
                  whileHover={{ x: 4 }}
                  className="block rounded-3xl glass p-5 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5 grid place-items-center">
                      {s.type?.startsWith('image/') ? (
                        <img src={s.fileUrl || s.url} alt={s.name || ''} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-white/40">{s.type?.split('/')[1]?.slice(0, 4) || 'file'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-medium">{s.name || 'untitled'}</p>
                      {s.caption && <p className="mt-1 line-clamp-2 text-[13px] text-white/55">{s.caption}</p>}
                      <p className="mt-2 text-[11px] text-white/35">
                        {new Date(s.createdAt || '').toLocaleString()} · {s.size ? `${Math.round(s.size / 1024)} KB` : ''}
                      </p>
                    </div>
                  </div>
                </motion.a>
              </motion.div>
            ))
          )}
        </div>

        <aside className="mt-16 rounded-3xl glass p-6">
          <p className="text-[13px] uppercase tracking-[0.14em] text-white/40">place on the path</p>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-3 block w-full text-[13px] text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1.5 file:text-[13px] file:text-white"
          />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note for the path"
            className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none ring-1 ring-white/10 focus:ring-white/20"
          />
          <div className="mt-3 flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="hours until fade (optional)"
              className="flex-1 rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none ring-1 ring-white/10"
            />
          </div>
          {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. encoding or sending may feel slow. nothing is refused.</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={send}
            disabled={!files.length || busy}
            className="mt-4 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'settling…' : 'place on the path'}
          </motion.button>
          {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
        </aside>
      </main>
    </div>
  );
}
