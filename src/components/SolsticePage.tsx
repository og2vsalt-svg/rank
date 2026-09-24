import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';
import { useAuth } from './AuthContext';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function SolsticePage() {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [label, setLabel] = useState('handoff');
  const [file, setFile] = useState<File | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = useMemo(() => +new Date(when), [when]);
  const left = parts(target - now);

  const publish = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    if (file.size > 8 * 1024 * 1024) setWarn('chunky drop. still going. may feel slow.');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt: new Date(when).toISOString(),
        author: user?.username,
      });
      if (!res.ok) {
        setErr(res.error || 'could not schedule');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setDone(shareUrls(res.id || id).embed);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">solstice</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">time a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            attach a file to a moment. share expires at that timestamp. not a locker — just a timed handoff.
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            placeholder="label"
          />
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <div className="grid grid-cols-4 gap-2 mb-6">
            {(
              [
                [left.d, 'days'],
                [left.h, 'hrs'],
                [left.m, 'min'],
                [left.s, 'sec'],
              ] as const
            ).map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/[0.04] border border-white/8 p-3 text-center">
                <p className="text-xl font-medium tabular-nums">{v}</p>
                <p className="text-[11px] text-neutral-500">{l}</p>
              </div>
            ))}
          </div>
          <input ref={input} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button
            onClick={() => input.current?.click()}
            className="w-full rounded-2xl border border-dashed border-white/15 py-8 text-sm text-neutral-400 mb-4"
          >
            {file ? `${file.name} · ${pretty(file.size)}` : 'attach a file'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!file || busy}
            onClick={publish}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sending…' : `schedule ${label || 'drop'}`}
          </motion.button>
          {done && (
            <p className="mt-4 text-xs text-[#0a84ff] break-all">{done}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
