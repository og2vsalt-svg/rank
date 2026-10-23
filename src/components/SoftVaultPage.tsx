import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftVaultPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(64);
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
        meta: { accent: color, source: 'softvault', kind: 'vault' },
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
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 20 }}>
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">softvault</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-[-0.05em] leading-none">quiet central vault</h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/60">
            A still place for everything you carry. Drop any local files to settle them into storage and the public_shares table. Soft spring motion, glass surfaces, professional Discord embeds on every link. Large files warned, never refused. Prior features remain untouched.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">gathering the vault…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the vault is quiet. the first drop will appear here.</p>
            ) : (
              <div className="space-y-3">
                {shares.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).app}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 120, damping: 18 }}
                    className="flex items-center gap-4 rounded-2xl glass p-4 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-[11px] uppercase tracking-wide text-white/50">
                      {(s.type || 'file').split('/')[0].slice(0, 4)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{s.name || 'untitled'}</p>
                      <p className="mt-0.5 text-[12px] text-white/45">
                        {s.caption || 'no note'} · {s.size ? `${Math.round(s.size / 1024)} kb` : ''}
                      </p>
                    </div>
                    <span className="text-[12px] text-[#0A84FF]">open</span>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-3xl p-6">
            <p className="text-[14px] font-medium">add to the vault</p>
            <label className="mt-4 block cursor-pointer rounded-2xl bg-white/[0.04] p-8 text-center transition-colors hover:bg-white/[0.06]">
              <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready` : 'drop or choose any files'}</div>
              <div className="mt-1 text-[12px] text-white/40">all types welcome · no hard limits</div>
            </label>
            {!!files.length && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-[12px] text-white/60">
                {files.map((f) => (
                  <li key={f.name + f.size} className="truncate">{f.name}</li>
                ))}
              </ul>
            )}
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared note" className="mt-4 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] outline-none" />
            <div className="mt-3 flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
              <span className="text-[13px] text-white/50">accent</span>
            </div>
            {heavy && <p className="mt-3 text-[12px] text-amber-200/80">large batch. encoding or sending may feel slow. nothing is refused.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={send}
              disabled={!files.length || busy}
              className="mt-4 w-full rounded-full px-4 py-3 text-[15px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'settling…' : 'share into the vault'}
            </motion.button>
            {status && <p className="mt-2 text-[12px] text-red-300">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
