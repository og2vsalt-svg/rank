import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Frame = { id: string; name: string; note: string; shareId?: string; size?: number };

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LoomPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [frames, setFrames] = useState<Frame[]>([]);
  const [status, setStatus] = useState('a sequence of filed drops. not another drawer.');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/loom?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.loom) return;
        setTitle(data.loom.title || '');
        setCaption(data.loom.caption || '');
        setFrames(
          (data.frames || []).map((f: { id: string; name?: string; note?: string; share_id?: string }) => ({
            id: f.id,
            name: f.name || 'frame',
            note: f.note || '',
            shareId: f.share_id || undefined,
          })),
        );
        setLink(`${window.location.origin}/loom/${data.loom.id}`);
      })
      .catch(() => setStatus('could not open that loom'));
  }, [shareId]);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...frames];
    for (const file of Array.from(list)) {
      const heavy = file.size > 12 * 1024 * 1024;
      setStatus(heavy ? `${file.name} is heavy. still accepted — the write may feel slow.` : `filing ${file.name}…`);
      const body = new FormData();
      body.append('file', file, file.name);
      body.append('caption', file.name);
      body.append('author', 'loom');
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) {
        setStatus(data.error || 'the share table did not take that file');
        continue;
      }
      next.push({ id: data.id, name: file.name, note: '', shareId: data.id, size: file.size });
    }
    setFrames(next);
    setStatus('frames are in the share table. save the loom when the order feels right.');
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setStatus('saving the sequence…');
    try {
      const r = await fetch('/api/loom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shareId || undefined,
          title: title.trim() || 'untitled loom',
          caption,
          frames: frames.map((f) => ({ id: f.id, shareId: f.shareId, name: f.name, note: f.note })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'could not save the loom');
      const path = `${window.location.origin}${data.path}`;
      setLink(path);
      history.pushState(null, '', data.path);
      setStatus('saved. paste the link in Discord for the card.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-16 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">loom</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[40px] leading-none font-semibold tracking-tight">A sequence, not a drawer.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/60">Each frame is a local file written to the share table. The loom only keeps the order and a line under each one. Nothing is refused for size.</p>
        <div className="mt-8 grid gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title of the sequence" className="glass rounded-2xl px-4 py-3 text-[15px] bg-transparent outline-none" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="one line for the Discord card" className="glass rounded-2xl px-4 py-3 text-[15px] bg-transparent outline-none" />
        </div>
        <label className="glass mt-4 block rounded-3xl p-6 cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
          <input className="sr-only" type="file" multiple onChange={(e) => addFiles(e.target.files)} />
          <div className="text-[15px] font-medium">Drop frames, or click to add several</div>
          <div className="mt-1 text-[13px] text-white/45">heavy files get a slowness warning and still land</div>
        </label>
        <div className="mt-4 space-y-2">
          {frames.map((frame, i) => (
            <motion.div layout key={frame.id} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-[12px] text-white/35 w-5">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]">{frame.name}</div>
                <input value={frame.note} onChange={(e) => setFrames(frames.map((f) => f.id === frame.id ? { ...f, note: e.target.value } : f))} placeholder="line under this frame" className="mt-1 w-full bg-transparent text-[13px] text-white/70 outline-none" />
              </div>
              <span className="text-[12px] text-white/35">{frame.size ? pretty(frame.size) : ''}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40">{busy ? 'Saving…' : 'Save loom'}</button>
          <span className="text-[13px] text-white/50">{status}</span>
        </div>
        {link && <a href={link} className="glass mt-5 block rounded-2xl px-4 py-3 text-[14px] text-[#64b5ff]">{link}</a>}
      </main>
    </div>
  );
}
