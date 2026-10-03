import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Receipt = {
  id: string;
  share_id: string;
  from_name: string | null;
  to_name: string | null;
  note: string | null;
  file_name: string | null;
  size: number;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function KeelsonPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a handoff desk. the file goes to the share table. the receipt names who it is for.');
  const [card, setCard] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const slow = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? `${pretty(file.size)}. preview clients may feel slow. the desk still files it.` : ''), [file]);

  async function load() {
    const r = await fetch('/api/keelson');
    const data = await r.json();
    if (r.ok) setReceipts(Array.isArray(data.receipts) ? data.receipts : []);
  }

  useEffect(() => {
    load().catch(() => setStatus('could not read receipts'));
    if (shareId) setCard(`${window.location.origin}/keelson/${shareId}`);
  }, [shareId]);

  async function handOff() {
    if (!file || !toName.trim()) return;
    setBusy(true);
    setStatus('filing the drop');
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('author', fromName.trim() || 'keelson');
      body.append('caption', note.trim() || `for ${toName.trim()}`);
      body.append('cardTitle', file.name);
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the share table did not take the file');
      const receiptId = `k${Date.now().toString(36)}`;
      const rec = await fetch('/api/keelson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: receiptId,
          shareId: data.id,
          fromName: fromName.trim() || 'keelson',
          toName: toName.trim(),
          note: note.trim(),
          fileName: file.name,
          size: file.size,
        }),
      });
      const recData = await rec.json();
      if (!rec.ok) throw new Error(recData.error || 'receipt was not written');
      const link = `${window.location.origin}/keelson/${receiptId}`;
      setCard(link);
      history.replaceState(null, '', `/keelson/${receiptId}`);
      setStatus(data.warn ? data.warn : 'filed. paste the keelson link in Discord.');
      setFile(null);
      setNote('');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'handoff failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[#0a84ff] text-[13px] tracking-wide">handoff desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">keelson</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mt-4 text-neutral-400 text-lg max-w-xl leading-relaxed">
          Name who the file is for. The bytes land in the share table. The receipt is a different row, so this is not another drawer.
        </motion.p>
        <label className="mt-8 block rounded-3xl border border-white/10 bg-white/[0.04] p-5 cursor-pointer hover:bg-white/[0.06] transition-colors">
          <span className="text-xs text-neutral-500">local file</span>
          <span className="mt-2 block text-sm text-white truncate">{file ? file.name : 'choose a file on this machine'}</span>
          <span className="mt-1 block text-xs text-neutral-500">{file ? pretty(file.size) : 'no size cutoff'}</span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {slow && <p className="mt-3 text-sm text-amber-200/80">{slow}</p>}
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="from" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 transition-colors" />
          <input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="for" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 transition-colors" />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="a line on the receipt" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 resize-none" />
        <button disabled={!file || !toName.trim() || busy} onClick={handOff} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">hand it over</button>
        {card && <a href={card} className="mt-4 block break-all text-[#0a84ff] text-sm">{card}</a>}
        <div className="mt-8 space-y-2">
          {receipts.map((row) => (
            <motion.a key={row.id} href={`/keelson/${row.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="block rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 hover:bg-white/[0.07] transition-colors">
              <p className="text-sm text-white">{row.file_name || 'file'} → {row.to_name || 'someone'}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.from_name || 'keelson'} · {pretty(Number(row.size) || 0)} · {row.note || 'no note'}</p>
            </motion.a>
          ))}
          {!receipts.length && <p className="text-sm text-neutral-500">no handoffs yet.</p>}
        </div>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
      </main>
    </div>
  );
}
