import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Filed = { id: string; name: string; mime: string; size: number; file_url: string; embed: string };

export default function SatchelPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [filed, setFiled] = useState<Filed[]>([]);
  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const take = (list: FileList | null) => {
    const next = Array.from(list || []);
    if (!next.length) return;
    setFiles(next);
    setCard('');
    setFiled([]);
    setErr('');
    const heavy = next.some((f) => f.size > 40 * 1024 * 1024) || next.reduce((n, f) => n + f.size, 0) > 80 * 1024 * 1024;
    setWarn(heavy ? 'heavy pack. the tab may stutter while it sends. nothing is refused for size.' : '');
  };

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const landed: Filed[] = [];
    try {
      for (const file of files) {
        const pub = await publishLocalFile(file, { caption: note, author, color: '#0A84FF' });
        if (!pub.ok || !pub.id) {
          setErr(pub.error || `could not file ${file.name}`);
          break;
        }
        landed.push({
          id: pub.id,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          file_url: pub.url || '',
          embed: pub.embed || `${location.origin}/s/${pub.id}`,
        });
        if (pub.warn) setWarn(pub.warn);
      }
      setFiled(landed);
      if (!landed.length) return;
      const id = uid();
      const res = await fetch('/api/parcel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: title.trim() || 'satchel', note, author, items: landed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || 'files landed, parcel row did not');
        return;
      }
      const link = `${location.origin}/parcel/${id}`;
      setCard(link);
      try { await navigator.clipboard.writeText(link); } catch { /* clipboard is optional */ }
    } catch (e: any) {
      setErr(e?.message || 'satchel failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8 apple-in">
          <p className="text-[#0a84ff] text-sm mb-2">satchel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">one pack, many files.</h1>
          <p className="text-neutral-400 text-sm mb-6">each local file is written to the share database. the pack itself is a parcel row, and Discord unfurls /parcel.</p>
          <label
            className="lift block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => take(e.target.files)} />
            <span className="text-neutral-200">{files.length ? `${files.length} ready · ${pretty(total)}` : 'drop a pile, or choose files'}</span>
          </label>
          <div className="grid gap-3 mt-5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pack name" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="line for the discord card" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the card, optional" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
          </div>
          {warn && <p className="text-amber-200/90 text-sm mt-4">{warn}</p>}
          {err && <p className="text-red-300 text-sm mt-4">{err}</p>}
          <button disabled={busy || !files.length} onClick={send} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'filing…' : 'file the pack'}
          </button>
          {card && (
            <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">discord card</p>
              <a href={card} className="text-[#0a84ff] break-all text-sm">{card}</a>
              <ul className="mt-3 space-y-1 text-sm text-neutral-400">
                {filed.map((f) => <li key={f.id}>{f.name} · {pretty(f.size)}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
