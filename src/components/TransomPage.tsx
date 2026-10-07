import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { db, prettySize } from '../lib/db';

type WindowRow = { id: string; label: string; note: string | null; author: string | null; open: boolean };
type DropRow = { id: string; name: string; mime: string | null; size: number; file_url: string; note: string | null; author: string | null; created_at: string };

function headers(extra?: Record<string, string>) {
  return { apikey: db.key, Authorization: `Bearer ${db.key}`, ...extra };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TransomPage() {
  const { shareId, navigate } = useRouter();
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [windowRow, setWindowRow] = useState<WindowRow | null>(null);
  const [drops, setDrops] = useState<DropRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    (async () => {
      const res = await fetch(`${db.url}/rest/v1/transoms?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() });
      const rows = res.ok ? await res.json() : [];
      if (stop) return;
      setWindowRow(rows[0] || null);
      const dropsRes = await fetch(`${db.url}/rest/v1/transom_drops?window_id=eq.${encodeURIComponent(shareId)}&select=*&order=created_at.desc`, { headers: headers() });
      if (stop) return;
      setDrops(dropsRes.ok ? await dropsRes.json() : []);
    })();
    return () => { stop = true; };
  }, [shareId]);

  const openWindow = async () => {
    if (!label.trim()) return;
    setBusy(true);
    setErr('');
    const id = uid();
    const res = await fetch(`${db.url}/rest/v1/transoms`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ id, label: label.trim(), note: note.trim() || null, author: author.trim() || null, open: true }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180) || 'could not open the window');
      return;
    }
    navigate('transom', id);
  };

  const onFiles = async (list: FileList | null) => {
    if (!list?.length || !shareId || !windowRow?.open) return;
    const file = list[0];
    setWarn(file.size > 40 * 1024 * 1024 ? 'chunky file. the tab may feel slow while it sends. there is no cap.' : '');
    setErr('');
    setBusy(true);
    const id = uid();
    const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'file';
    const path = `transom/${shareId}/${id}-${safe}`;
    const up = await fetch(`${db.url}/storage/v1/object/shares/${path}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' }),
      body: file,
    });
    if (!up.ok) {
      setBusy(false);
      setErr((await up.text()).slice(0, 180) || 'storage refused the file');
      return;
    }
    const file_url = `${db.url}/storage/v1/object/public/shares/${path}`;
    const saved = await fetch(`${db.url}/rest/v1/transom_drops`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ id, window_id: shareId, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, file_url, author: author.trim() || null, note: note.trim() || null }),
    });
    setBusy(false);
    if (!saved.ok) {
      setErr((await saved.text()).slice(0, 180) || 'file landed, row did not');
      return;
    }
    const rows = await saved.json();
    setDrops((prev) => [rows[0], ...prev]);
  };

  const copy = async () => {
    if (!shareId) return;
    try {
      await navigator.clipboard.writeText(`${location.origin}/transom/${shareId}`);
      setCopied(true);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#64d2ff] text-sm mb-2">receiving window</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">{windowRow ? windowRow.label : 'open a transom'}</h1>
          <p className="text-neutral-400 text-sm mb-6">{windowRow ? (windowRow.note || 'anyone with the link can leave a local file here.') : 'not a vault drawer. you name a window, then other people drop a file into it. bytes go to storage, the slip goes in the database.'}</p>
          {!shareId && (
            <div className="space-y-3">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="window name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what should people leave" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60" />
              <button onClick={openWindow} disabled={busy || !label.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">{busy ? 'opening…' : 'open window'}</button>
            </div>
          )}
          {shareId && windowRow && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={copy} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition">{copied ? 'copied' : 'copy discord link'}</button>
                <button onClick={() => navigate('casement')} className="px-4 py-2 rounded-full bg-white/5 text-sm">all windows</button>
              </div>
              <p className="text-xs text-neutral-500 break-all">{location.origin}/transom/{shareId}</p>
              <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#64d2ff]/50 p-8 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
                <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
                <p className="text-white font-medium">{busy ? 'sending…' : 'leave a local file'}</p>
                <p className="text-xs text-neutral-500 mt-2">no hard limit. a warning only if it might be slow.</p>
              </label>
              <ul className="space-y-2">
                {drops.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{d.name}</p>
                      <p className="text-xs text-neutral-500">{prettySize(Number(d.size))}{d.author ? ` · ${d.author}` : ''}</p>
                    </div>
                    <a href={d.file_url} className="text-xs text-[#64d2ff] shrink-0">open</a>
                  </li>
                ))}
                {!drops.length && <p className="text-xs text-neutral-500">nothing left yet.</p>}
              </ul>
            </div>
          )}
          {shareId && !windowRow && !busy && <p className="text-sm text-neutral-500">that window is not in the book.</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
        </motion.div>
      </div>
    </div>
  );
}
