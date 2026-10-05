import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function fileOne(file: File, author: string, caption: string) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const step = 0x8000;
  for (let o = 0; o < bytes.length; o += step) binary += String.fromCharCode(...bytes.subarray(o, o + step));
  const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${btoa(binary)}`;
  const id = uid();
  const shared = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name: file.name, type: file.type || 'application/octet-stream', size: file.size, author, caption, dataUrl }),
  });
  const share = await shared.json();
  if (!shared.ok) throw new Error(share.error || 'the share table did not take the file');
  return { id: share.id as string, warn: share.warn as string | null, name: file.name, size: file.size };
}

export default function GarboardPage() {
  const { navigate } = useRouter();
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('two local files, one seam note. both land in the share table.');
  const [links, setLinks] = useState<string[]>([]);
  const [seams, setSeams] = useState<{ id: string; note: string; left_id: string; right_id: string }[]>([]);

  const slow = useMemo(() => {
    const size = (left?.size || 0) + (right?.size || 0);
    if (!size) return null;
    if (size > 40 * 1024 * 1024) return 'heavy pair. the tab may pause while it reads. nothing is refused.';
    if (size > 12 * 1024 * 1024) return 'large drop. the write may feel slow. it still goes up.';
    return null;
  }, [left, right]);

  useEffect(() => {
    fetch('/api/desk?desk=garboard')
      .then((r) => r.json())
      .then((data) => setSeams(Array.isArray(data.seams) ? data.seams : []))
      .catch(() => setSeams([]));
  }, [links]);

  async function store() {
    if (!left || !right || !note.trim()) {
      setStatus('both files and a seam note');
      return;
    }
    setBusy(true);
    setStatus('writing the port file\u2026');
    try {
      const a = await fileOne(left, author.trim() || 'garboard', note.trim());
      setStatus('writing the starboard file\u2026');
      const b = await fileOne(right, author.trim() || 'garboard', note.trim());
      const noted = await fetch('/api/desk?desk=garboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leftId: a.id, rightId: b.id, note: note.trim(), author: author.trim() || 'garboard' }),
      });
      const seam = await noted.json();
      if (!noted.ok) throw new Error(seam.error || 'the seam note was not written');
      setLinks([`${window.location.origin}/s/${a.id}`, `${window.location.origin}/s/${b.id}`]);
      setStatus(a.warn || b.warn || 'filed. paste either link in Discord.');
      navigate('garboard');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file the seam');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] text-white/45">garboard</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease, delay: 0.04 }} className="mt-2 text-[40px] leading-none tracking-tight font-semibold">Two planks, one seam.</motion.h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">Each local file goes into the share database. The note between them stays on the seam table. Older desks stay. Nothing is refused for size.</p>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <label className="block rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 cursor-pointer hover:bg-white/[0.07] transition-colors duration-300">
            <span className="text-xs text-white/45">port</span>
            <span className="mt-2 block text-[15px] truncate">{left ? left.name : 'choose a file'}</span>
            <span className="mt-1 block text-xs text-white/40">{left ? pretty(left.size) : 'no size cutoff'}</span>
            <input type="file" className="sr-only" onChange={(e) => setLeft(e.target.files?.[0] || null)} />
          </label>
          <label className="block rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 cursor-pointer hover:bg-white/[0.07] transition-colors duration-300">
            <span className="text-xs text-white/45">starboard</span>
            <span className="mt-2 block text-[15px] truncate">{right ? right.name : 'choose a file'}</span>
            <span className="mt-1 block text-xs text-white/40">{right ? pretty(right.size) : 'only a slowness warning'}</span>
            <input type="file" className="sr-only" onChange={(e) => setRight(e.target.files?.[0] || null)} />
          </label>
        </div>
        {slow && <p className="mt-3 text-sm text-amber-200/80">{slow}</p>}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what the seam is holding" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <button disabled={!left || !right || busy} onClick={store} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">{busy ? 'writing\u2026' : 'file the seam'}</button>
        {links.length > 0 && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-2">
            {links.map((href) => <a key={href} href={href} className="block break-all text-[#0A84FF] text-sm">{href}</a>)}
          </div>
        )}
        <p className="mt-4 text-sm text-white/45">{status}</p>
        {seams.length > 0 && (
          <div className="mt-10 space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">recent seams</p>
            {seams.slice(0, 8).map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm">{row.note}</p>
                <p className="mt-1 text-xs text-white/40">{row.left_id} · {row.right_id}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
