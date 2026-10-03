import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Note = { id: string; body: string; author: string | null; share_id: string | null; accent: string | null; created_at: string };

export default function PartnersPage() {
  const [board, setBoard] = useState('main');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');

  const load = async (name = board) => {
    const res = await fetch(`/api/partners?board=${encodeURIComponent(name)}`);
    const data = await res.json().catch(() => ({}));
    setNotes(Array.isArray(data.notes) ? data.notes : []);
  };

  useEffect(() => {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const next = q.get('b') || 'main';
    setBoard(next);
    load(next);
  }, []);

  const send = async () => {
    if (!body.trim() && !file) return;
    setBusy(true);
    setErr('');
    setCard('');
    try {
      let shareId = '';
      if (file) {
        const filed = await publishLocalFile(file, {
          caption: body.trim() || file.name,
          cardTitle: file.name,
          color: '#30D158',
          author: author.trim() || 'partners',
        });
        if (!filed.ok || !filed.id) {
          setErr(filed.error || 'the file did not land');
          return;
        }
        shareId = filed.id;
        if (filed.warn) setWarn(filed.warn);
      }
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, body: body.trim() || file?.name || 'file', author: author.trim(), shareId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || 'the board did not take the line');
        return;
      }
      const url = `${location.origin}/partners?b=${encodeURIComponent(board)}`;
      setCard(shareId ? shareUrls(shareId).embed : url);
      setBody('');
      setFile(null);
      await load(board);
      try { await navigator.clipboard.writeText(shareId ? shareUrls(shareId).embed : url); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#30d158] text-sm mb-2">partners</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a board, not a cabinet.</h1>
          <p className="text-neutral-400 text-sm mb-6">lines stay on the partners table. a local file, if you attach one, still lands in the share database and unfurls on Discord.</p>
          <div className="flex gap-2 mb-3">
            <input value={board} onChange={(e) => setBoard(e.target.value.slice(0, 40))} className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none" placeholder="board name" />
            <button onClick={() => load(board)} className="px-4 rounded-full bg-white/10 text-sm">open</button>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="a line for the board" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none resize-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none" />
          <label className="mt-3 block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-5 text-center">
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); setWarn(f && f.size > 18 * 1024 * 1024 ? 'large file. the send may feel slow. nothing is refused.' : ''); }} />
            <p className="text-sm">{file ? file.name : 'optional local file'}</p>
          </label>
          <button onClick={send} disabled={busy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'sending…' : 'pin the line'}</button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">copied {card}</p>}
          <ul className="mt-6 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-sm">{n.body}</p>
                <p className="text-xs text-neutral-500 mt-1">{n.author || 'someone'}{n.share_id ? ' · file attached' : ''}</p>
                {n.share_id && <a className="text-xs text-[#64d2ff]" href={shareUrls(n.share_id).embed}>{shareUrls(n.share_id).embed}</a>}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
