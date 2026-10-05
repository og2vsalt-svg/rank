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

export default function GarboardPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [seam, setSeam] = useState('');
  const [port, setPort] = useState('');
  const [starboard, setStarboard] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('the lowest plank. the file still lands in the share table.');
  const [link, setLink] = useState('');
  const [shareLink, setShareLink] = useState('');

  const slow = useMemo(() => {
    if (!file) return null;
    if (file.size > 40 * 1024 * 1024) return 'heavy file. the tab may pause while it reads. nothing is refused.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. the write may feel slow. it still goes up.';
    return null;
  }, [file]);

  useEffect(() => {
    if (!shareId) return;
    let gone = false;
    fetch(`/api/garboard?id=${encodeURIComponent(shareId)}&json=1`)
      .then((r) => r.json())
      .then((row) => {
        if (gone || !row || row.error) return;
        setSeam(row.seam || '');
        setPort(row.port_side || '');
        setStarboard(row.starboard_side || '');
        setAuthor(row.author || '');
        setLink(`${window.location.origin}/garboard/${row.id}`);
        if (row.share_id) setShareLink(`${window.location.origin}/s/${row.share_id}`);
        setStatus(`${row.file_name} · ${pretty(Number(row.size) || 0)}`);
      })
      .catch(() => setStatus('could not read that plank'));
    return () => {
      gone = true;
    };
  }, [shareId]);

  async function store() {
    if (!file) return;
    setBusy(true);
    setStatus('reading the file on this machine…');
    try {
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
        body: JSON.stringify({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          author: author.trim() || 'garboard',
          caption: seam.trim() || 'garboard seam',
          dataUrl,
        }),
      });
      const share = await shared.json();
      if (!shared.ok) throw new Error(share.error || 'the share table did not take the file');
      const noted = await fetch('/api/garboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          share_id: share.id,
          file_name: file.name,
          seam: seam.trim(),
          port_side: port.trim(),
          starboard_side: starboard.trim(),
          size: file.size,
          author: author.trim() || null,
        }),
      });
      const note = await noted.json();
      if (!noted.ok) throw new Error(note.error || 'the seam note was not written');
      setLink(`${window.location.origin}/garboard/${id}`);
      setShareLink(`${window.location.origin}/s/${share.id}`);
      setStatus(share.warn || 'filed. paste either link in Discord.');
      navigate('garboard', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file the plank');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] text-white/45">garboard</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease, delay: 0.04 }} className="mt-2 text-[40px] leading-none tracking-tight font-semibold">The lowest plank.</motion.h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">A local file goes into the share database. The seam note lives beside it, so the card is a measurement, not another drawer.</p>
        <label className="mt-8 block rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 cursor-pointer hover:bg-white/[0.07] transition-colors duration-300">
          <span className="text-xs text-white/45">local file</span>
          <span className="mt-2 block text-[15px] truncate">{file ? file.name : 'choose a file on this machine'}</span>
          <span className="mt-1 block text-xs text-white/40">{file ? pretty(file.size) : 'no size cutoff — only a warning if it will feel slow'}</span>
          <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {slow && <p className="mt-3 text-sm text-amber-200/80">{slow}</p>}
        <input value={seam} onChange={(e) => setSeam(e.target.value)} placeholder="what the seam is holding" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="port side" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
          <input value={starboard} onChange={(e) => setStarboard(e.target.value)} placeholder="starboard side" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        </div>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <button disabled={!file || busy} onClick={store} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">{busy ? 'writing…' : 'file the plank'}</button>
        {(link || shareLink) && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            {link && <a href={link} className="block break-all text-[#0A84FF] text-sm">{link}</a>}
            {shareLink && <a href={shareLink} className="mt-2 block break-all text-white/70 text-sm">{shareLink}</a>}
          </div>
        )}
        <p className="mt-4 text-sm text-white/45">{status}</p>
      </main>
    </div>
  );
}
