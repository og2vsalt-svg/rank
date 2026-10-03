import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Pulse = { label: string; ok: boolean; detail: string };

export default function TelltalePage() {
  const [rows, setRows] = useState<Pulse[]>([]);
  const [shares, setShares] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Pulse[] = [];
      try {
        const share = await fetch('/api/share?list=1&limit=8');
        const data = await share.json().catch(() => ({}));
        const count = Array.isArray(data.shares) ? data.shares.length : 0;
        if (!cancelled) setShares(count);
        next.push({ label: 'share table', ok: share.ok, detail: share.ok ? `${count} recent public rows` : 'list did not answer' });
      } catch {
        next.push({ label: 'share table', ok: false, detail: 'request failed' });
      }
      try {
        const bill = await fetch('/api/waybill');
        const data = await bill.json().catch(() => ({}));
        const count = Array.isArray(data.waybills) ? data.waybills.length : 0;
        next.push({ label: 'waybills', ok: bill.ok, detail: bill.ok ? `${count} slips on the board` : data.error || 'unread' });
      } catch {
        next.push({ label: 'waybills', ok: false, detail: 'request failed' });
      }
      next.push({ label: 'discord cards', ok: true, detail: 'paste /waybill, /telltale, or /s/id' });
      if (!cancelled) setRows(next);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">telltale</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">Is the desk awake?</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">A quiet check of the share database and the waybill table. Not a cabinet, and not a size gate. {shares === null ? 'listening…' : `${shares} recent drops answered.`} Paste /telltale in Discord for the card.</p>
        <div className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.div key={row.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
              <div>
                <p className="text-sm font-medium text-zinc-100">{row.label}</p>
                <p className="text-sm text-zinc-400">{row.detail}</p>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${row.ok ? 'bg-[#30d158]' : 'bg-rose-400'}`} />
            </motion.div>
          ))}
          {!rows.length && <p className="text-sm text-zinc-500">checking the lines…</p>}
        </div>
      </main>
    </div>
  );
}
