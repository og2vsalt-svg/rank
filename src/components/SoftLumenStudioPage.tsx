import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenStudioPage() {
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => file && file.size > 50 * 1024 * 1024, [file]);

  const refresh = async () => {
    setLoading(true);
    const rows = await listPublicShares(48);
    setShares(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const publish = async () => {
    if (!file && !note.trim()) return;
    setBusy(true);
    setStatus('');
    const res = await publishLocalFile(file || new File([note], 'note.txt', { type: 'text/plain' }), {
      caption: note || title || 'studio note',
      color,
      cardTitle: title || 'studio share',
      meta: { accent: color, source: 'softlumenstudio', kind: 'studio' },
    });
    if (!res.ok) {
      setStatus(res.error || 'could not settle');
    } else {
      setFile(null);
      setTitle('');
      setNote('');
      setStatus('settled');
    }
    setBusy(false);
    await refresh();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 pb-28 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 22 }}
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">softlumenstudio</p>
          <h1 className="mt-3 text-[44px] font-semibold tracking-[-0.055em] leading-[0.95] text-white">
            a quiet studio<br />for what you carry
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/55">
            Drop a local file or write a note. It settles into storage and the public_shares table with your accent. Every link unfurls a polished Discord card. Large drops receive only a gentle warning. Spring motion, glass surfaces, human pacing. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_380px]">
          <section>
            {loading ? (
              <p className="text-sm text-white/40">gathering recent shares…</p>
            ) : !shares.length ? (
              <p className="text-sm text-white/40">the studio is still. the first drop will appear here.</p>
            ) : (
              <div className="space-y-2.5">
                {shares.map((s, i) => (
                  <motion.a
                    key={s.id}
                    href={shareUrls(s.id).app}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.4), type: 'spring', stiffness: 140, damping: 20 }}
                    className="group flex items-center gap-4 rounded-2xl glass px-4 py-3.5 transition-all hover:bg-white/[0.025]"
                  >
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[10px] uppercase tracking-wider text-white/60"
                      style={{ background: `${s.color || '#5AC8FA'}22` }}
                    >
                      {(s.type || 'file').split('/')[0].slice(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-white/90">{s.cardTitle || s.name || 'untitled'}</p>
                      <p className="mt-0.5 truncate text-[12px] text-white/40">{s.caption || 'no note'}</p>
                    </div>
                    <span className="text-[12px] text-[#5AC8FA] opacity-0 transition-opacity group-hover:opacity-100">open</span>
                  </motion.a>
                ))}
              </div>
            )}
          </section>

          <aside className="glass h-fit rounded-[28px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <p className="text-[15px] font-medium text-white/90">compose</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="title"
              className="mt-5 w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[15px] outline-none ring-1 ring-white/5 focus:ring-white/15"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="a quiet note"
              rows={3}
              className="mt-3 w-full resize-none rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[15px] outline-none ring-1 ring-white/5 focus:ring-white/15"
            />
            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-3 text-[14px] ring-1 ring-white/5 hover:bg-white/[0.06]">
              <span className="text-white/70">{file ? file.name : 'optional local file'}</span>
              <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="text-[12px] text-white/40">choose</span>
            </label>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg bg-transparent"
              />
              <span className="text-[13px] text-white/50">accent</span>
            </div>
            {heavy && (
              <p className="mt-3 text-[12px] text-amber-300/80">this drop may feel slow — still welcome, no hard limit.</p>
            )}
            <button
              onClick={publish}
              disabled={busy || (!file && !note.trim())}
              className="mt-5 w-full rounded-2xl bg-white py-2.5 text-[15px] font-medium text-black transition active:scale-[0.98] disabled:opacity-40"
            >
              {busy ? 'settling…' : 'settle into the studio'}
            </button>
            {status && <p className="mt-3 text-center text-[13px] text-white/50">{status}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
