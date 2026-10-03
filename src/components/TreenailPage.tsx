import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Pin = {
  id: string;
  label: string;
  note?: string | null;
  share_id?: string | null;
  file_name?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function TreenailPage() {
  const { shareId } = useRouter();
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a pin, not a drawer.');
  const [card, setCard] = useState('');
  const [pins, setPins] = useState<Pin[]>([]);
  const [open, setOpen] = useState<Pin | null>(null);

  async function load() {
    const r = await fetch('/api/treenail');
    const data = await r.json().catch(() => ({}));
    if (r.ok && Array.isArray(data.pins)) setPins(data.pins);
  }

  useEffect(() => {
    load().catch(() => setStatus('the pin board is quiet right now.'));
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/treenail?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((row) => {
        if (row && row.id) setOpen(row);
      })
      .catch(() => {});
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > 12 * 1024 * 1024 ? 'this file is heavy. the send can feel slow. it is still accepted.' : '');
  }

  async function publish() {
    if (busy) return;
    if (!label.trim()) {
      setStatus('name the pin first.');
      return;
    }
    setBusy(true);
    setStatus(file ? 'filing the local file, then the pin…' : 'setting the pin…');
    try {
      let share = '';
      let fileName = '';
      if (file) {
        const body = new FormData();
        body.append('file', file, file.name);
        body.append('caption', (note || label).slice(0, 280));
        body.append('cardTitle', label.trim());
        body.append('author', 'treenail');
        body.append('color', '#30D158');
        const fr = await fetch('/api/share', { method: 'POST', body });
        const fd = await fr.json();
        if (!fr.ok) throw new Error(fd.error || 'the share table did not take the file');
        share = fd.id;
        fileName = file.name;
        if (fd.warn) setWarn(String(fd.warn));
      }
      const r = await fetch('/api/treenail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), note: note.trim(), shareId: share, fileName }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the pin was not written');
      const origin = window.location.origin;
      const lines = [`${origin}/treenail/${data.id}`];
      if (share) lines.push(`${origin}/s/${share}`);
      setCard(lines.join('\n'));
      setStatus('pinned. paste either link in Discord for a card.');
      setLabel('');
      setNote('');
      setFile(null);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not set the pin');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#30d158] text-sm font-medium tracking-wide">treenail</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl font-semibold tracking-tight text-white">pin the why.</motion.h1>
        <p className="mt-3 text-neutral-400 leading-relaxed">a short board of reasons, not another vault. an optional file from this machine still lands in the share table, and both links unfurl on Discord.</p>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-white/[0.05] border border-white/10 px-4 py-4">
            <p className="text-white font-medium">{open.label}</p>
            {open.note && <p className="mt-1 text-sm text-white/55">{open.note}</p>}
            {open.share_id && (
              <a href={`/s/${open.share_id}`} className="mt-2 inline-block text-sm text-[#30d158]">{open.file_name || 'open the filed drop'}</a>
            )}
          </motion.div>
        )}
        <div className="mt-8 space-y-3">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what this pin is for" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#30d158]/60 transition" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line of context" rows={3} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#30d158]/60 transition" />
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-white/80">{file ? file.name : 'optional local file'}</span>
            {file && <span className="block mt-1 text-xs text-white/40">{pretty(file.size)}</span>}
          </label>
          {warn && <p className="text-amber-200/90 text-sm">{warn}</p>}
          <button onClick={publish} disabled={busy} className="w-full rounded-full bg-white text-black font-medium py-3 disabled:opacity-40 transition active:scale-[0.99]">
            {busy ? 'pinning…' : 'set the pin'}
          </button>
          <p className="text-sm text-white/45">{status}</p>
          {card && (
            <button onClick={() => navigator.clipboard.writeText(card)} className="w-full text-left rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-[#30d158] text-sm whitespace-pre-wrap break-all">
              {card}
            </button>
          )}
        </div>
        <div className="mt-10 space-y-2">
          {pins.map((pin) => (
            <motion.button
              key={pin.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/treenail/${pin.id}`)}
              className="w-full text-left rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 hover:bg-white/[0.07] transition"
            >
              <span className="block text-white">{pin.label}</span>
              {pin.note && <span className="block mt-1 text-sm text-white/45">{pin.note}</span>}
              {pin.file_name && <span className="block mt-1 text-xs text-[#30d158]">{pin.file_name}</span>}
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
