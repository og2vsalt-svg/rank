import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Shelf = { id: string; title: string; note?: string | null; share_ids?: string[]; author?: string | null };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ChannelsPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [raw, setRaw] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a shelf of links already in the share table. not a new drawer.');
  const [link, setLink] = useState('');
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [recent, setRecent] = useState<Shelf[]>([]);

  useEffect(() => {
    fetch('/api/desk?desk=channels&list=1')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data.shelves) ? data.shelves : []))
      .catch(() => setRecent([]));
  }, [link]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/desk?desk=channels&json=1&id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((row) => {
        if (!row || row.error) return;
        setShelf(row);
        setTitle(row.title || '');
        setNote(row.note || '');
        setRaw((row.share_ids || []).join('\n'));
        setLink(`${window.location.origin}/channels/${row.id}`);
        setStatus(`${(row.share_ids || []).length} links on this shelf`);
      })
      .catch(() => setStatus('could not read that shelf'));
  }, [shareId]);

  async function save() {
    const shareIds = raw.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean).map((x) => x.split('/').pop() || x);
    if (!title.trim()) {
      setStatus('the shelf needs a name');
      return;
    }
    setBusy(true);
    try {
      const id = shelf?.id || uid();
      const r = await fetch('/api/desk?desk=channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: title.trim(), note: note.trim(), share_ids: shareIds, author: author.trim() || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'the shelf was not written');
      setLink(`${window.location.origin}/channels/${id}`);
      setStatus('shelf filed. paste the link in Discord.');
      navigate('channels', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file the shelf');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] text-white/45">channels</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease, delay: 0.04 }} className="mt-2 text-[40px] leading-none tracking-tight font-semibold">Hang links on a shelf.</motion.h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">Paste share ids that already landed. This desk groups them. It does not open the vault, and it does not cap what those files were.</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="shelf name" className="mt-8 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this shelf is for" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="one share id or /s link per line" rows={5} className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/30 transition-colors" />
        <button disabled={busy} onClick={save} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">{busy ? 'writing\u2026' : 'file the shelf'}</button>
        {link && <a href={link} className="mt-6 block break-all text-[#0A84FF] text-sm">{link}</a>}
        <p className="mt-4 text-sm text-white/45">{status}</p>
        {shelf?.share_ids && shelf.share_ids.length > 0 && (
          <ul className="mt-6 space-y-2">
            {shelf.share_ids.map((id) => (
              <li key={id}><a className="text-sm text-white/70 hover:text-white" href={`/s/${id}`}>/s/{id}</a></li>
            ))}
          </ul>
        )}
        {recent.length > 0 && (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">recent shelves</p>
            <div className="mt-3 space-y-2">
              {recent.map((row) => (
                <button key={row.id} onClick={() => navigate('channels', row.id)} className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition-colors">
                  <span className="block text-sm">{row.title}</span>
                  <span className="block text-xs text-white/40">{(row.share_ids || []).length} links</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
