import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Handoff = {
  id: string;
  name: string;
  mime?: string | null;
  size?: number;
  note?: string | null;
  recipient?: string | null;
  author?: string | null;
  share_id?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function OrlopPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [rows, setRows] = useState<Handoff[]>([]);
  const [open, setOpen] = useState<Handoff | null>(null);

  useEffect(() => {
    fetch('/api/orlop')
      .then((r) => r.json())
      .then((j) => setRows(Array.isArray(j.rows) ? j.rows : []))
      .catch(() => {});
  }, [link]);

  useEffect(() => {
    if (!shareId) return;
    fetch('/api/orlop?id=' + encodeURIComponent(shareId))
      .then((r) => r.json())
      .then((j) => setOpen(j.row || null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 12 * 1024 * 1024 ? 'large file. nothing is refused — encoding may feel slow.' : '');
    try {
      const dataUrl = await readAsDataUrl(file);
      const shared = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: recipient || 'orlop',
          caption: note,
        }),
      });
      const shareJson = await shared.json();
      if (!shared.ok || !shareJson?.ok) throw new Error(shareJson?.error || 'share table refused the file');
      const filed = await fetch('/api/orlop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareId: shareJson.id,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          fileUrl: shareJson.fileUrl,
          note,
          recipient,
          author: 'orlop',
        }),
      });
      const filedJson = await filed.json();
      if (!filed.ok || !filedJson?.ok) throw new Error(filedJson?.error || 'handoff table refused the receipt');
      const next = window.location.origin + '/orlop/' + filedJson.id;
      setLink(next);
      if (filedJson.warn) setWarn(filedJson.warn);
      try { await navigator.clipboard.writeText(next); } catch { /* clipboard is optional */ }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'orlop failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2">orlop</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a locker under the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a local file. the bytes land in the share table, the receipt lands in handoffs. paste the link in Discord for a card. no size cap.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0A84FF]/50 p-8 text-center transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0] || null;
                setFile(next);
                setWarn(next && next.size > 12 * 1024 * 1024 ? 'large file. we will not refuse it. the browser may just take a breath.' : '');
              }}
            />
            <p className="text-white font-medium">{file ? file.name : 'choose a file from this machine'}</p>
            <p className="text-xs text-neutral-500 mt-2">{file ? pretty(file.size) : 'any size. only a slowness warning.'}</p>
          </label>
          <div className="mt-4 grid gap-3">
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="who is this for"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/60"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="a short note that rides with the file"
              rows={3}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/60 resize-none"
            />
          </div>
          <button
            onClick={send}
            disabled={!file || busy}
            className="mt-4 rounded-full bg-[#0A84FF] text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'filing…' : 'file the handoff'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-300 mt-4 break-all">copied {link}</p>}
        </motion.div>

        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-[28px] p-6 mt-4">
            <p className="text-xs text-[#0A84FF] mb-1">open receipt</p>
            <p className="text-lg font-medium">{open.name}</p>
            <p className="text-sm text-neutral-400 mt-1">{open.recipient || 'no name'} · {pretty(Number(open.size) || 0)}</p>
            {open.note && <p className="text-sm text-neutral-300 mt-3">{open.note}</p>}
          </motion.div>
        )}

        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <a key={row.id} href={'/orlop/' + row.id} className="block glass rounded-2xl px-4 py-3 hover:bg-white/5 transition">
              <p className="text-sm text-white">{row.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.recipient || 'unnamed'} · {pretty(Number(row.size) || 0)}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
