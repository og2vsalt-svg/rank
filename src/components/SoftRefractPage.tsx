import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftRefractPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState<CloudMeta | null>(null);

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(40);
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
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'softrefract', kind: 'refract' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
    }
    setFiles([]);
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 17 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softrefract</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em] leading-tight">quiet refracted bands</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Shared light bent into soft horizontal bands. Drop local files to settle them into storage and the public_shares table. Gentle spring motion, glass surfaces, polished Discord embeds on every link. Large files warned, never refused. Prior features preserved.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_300px]">
          <section className="space-y-3">
            {loading ? (
              <p className="text-sm text-white/40">bending light…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">no bands yet. the first drop will appear as a soft strip.</p>
            ) : (
              shares.map((s, i) => (
                <motion.button
                  key={s.id}
                  onClick={() => setOpen(s)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02, type: 'spring', stiffness: 130, damping: 16 }}
                  className="flex w-full items-center gap-4 overflow-hidden rounded-2xl glass p-3 text-left"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  {s.type?.startsWith('image/') ? (
                    <img src={s.fileUrl || s.url} alt="" className="h-14 w-20 flex-none rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-14 w-20 flex-none place-items-center rounded-xl bg-white/[0.05] text-[10px] text-white/40">file</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{s.name || 'untitled'}</p>
                    {s.caption && <p className="mt-0.5 truncate text-[12px] text-white/50">{s.caption}</p>}
                    <p className="mt-1 text-[11px] text-white/35">{(s.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </motion.button>
              ))
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-5">
            <p className="text-[13px] font-medium">add a band</p>
            <label className="mt-3 block cursor-pointer rounded-2xl bg-white/[0.04] p-5 text-center">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[14px] text-white/80">{files.length ? `${files.length} ready` : 'drop or choose files'}</div>
              <div className="mt-1 text-[11px] text-white/40">any type accepted</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 space-y-1 text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="mt-3 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none" />
            <div className="mt-2 flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[12px] text-white/45">band accent</span>
            </div>
            {heavy && <p className="mt-2 text-[12px] text-amber-200/80">large batch. may feel slow. nothing is refused.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-3 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'bending…' : 'share the band'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 190, damping: 21 }}
              className="max-w-sm overflow-hidden rounded-3xl glass p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[16px] font-medium">{open.name || 'shared band'}</p>
              {open.caption && <p className="mt-1 text-[13px] text-white/60">{open.caption}</p>}
              <a href={shareUrls(open.id).embed} className="mt-4 inline-block text-[13px] text-[#64D2FF] underline-offset-2 hover:underline">open share link</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
