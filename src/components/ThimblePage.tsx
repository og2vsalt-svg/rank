import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Receipt = {
  id: string;
  title: string;
  note: string | null;
  tone: string | null;
  file_name: string | null;
  size: number;
  file_url: string | null;
  author: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function ThimblePage() {
  const { navigate, shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [tone, setTone] = useState('quiet');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [stats, setStats] = useState<{ name: string; size: number; type: string } | null>(null);
  const [card, setCard] = useState('');
  const [open, setOpen] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(Boolean(shareId));

  useEffect(() => {
    if (!shareId) {
      setReceipt(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    fetch(`${SB_URL}/rest/v1/thimbles?id=eq.${encodeURIComponent(shareId)}&select=id,title,note,tone,file_name,size,file_url,author,created_at&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setReceipt(Array.isArray(data) && data[0] ? data[0] : null);
        if (!Array.isArray(data) || !data[0]) setErr('that receipt is not on the desk.');
      })
      .catch(() => {
        if (live) setErr('could not open this thimble.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [shareId]);

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    const label = (title.trim() || file.name).slice(0, 120);
    setErr('');
    setCard('');
    setOpen('');
    setStats({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy drop. the tab may feel slow while it sends. nothing is refused.' : '');
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || label,
        cardTitle: label,
        author: author.trim() || undefined,
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'the file did not land');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const row = await fetch(`${SB_URL}/rest/v1/thimbles`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: res.id,
          title: label,
          note: note.trim() || null,
          tone,
          share_id: res.id,
          file_name: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
          file_url: res.url || null,
          author: author.trim() || null,
        }),
      });
      if (!row.ok) setErr('file is in the share table, but the receipt row did not save');
      const urls = shareUrls(res.id);
      const link = `${location.origin}/thimble/${res.id}`;
      setCard(link);
      setOpen(urls.app);
      try { await navigator.clipboard.writeText(link); } catch { /* clipboard optional */ }
    } catch (e: any) {
      setErr(e?.message || 'thimble stuck');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          {shareId ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">thimble</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">{loading ? 'opening…' : receipt?.title || 'missing receipt'}</h1>
              {receipt && (
                <>
                  <p className="text-neutral-400 text-sm mb-4">{receipt.note || 'no note on this receipt.'}{receipt.author ? ` from ${receipt.author}.` : ''}</p>
                  <p className="text-xs text-neutral-500 mb-5">{receipt.file_name || 'file'} · {pretty(Number(receipt.size) || 0)} · {receipt.tone || 'quiet'}</p>
                  {receipt.file_url && (
                    <a href={receipt.file_url} className="inline-flex rounded-full bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200 transition" download>open the file</a>
                  )}
                </>
              )}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              <button type="button" onClick={() => navigate('thimble')} className="mt-6 block text-xs text-[#6eb6ff]">file another</button>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">thimble</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">a receipt, not a drawer.</h1>
              <p className="text-neutral-400 text-sm mb-6">
                the vault still keeps your private shelf. this desk takes one local file, writes it to the share table, and leaves a short receipt you can paste into Discord. older pages stay on their routes.
              </p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="receipt title" className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 transition" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name (optional)" className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this file is for" rows={3} className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 resize-none" />
              <div className="flex gap-2 mb-4">
                {['quiet', 'proof', 'handoff'].map((t) => (
                  <button key={t} type="button" onClick={() => setTone(t)} className={`text-xs px-3 py-1.5 rounded-full border transition duration-200 ${tone === t ? 'bg-white text-black border-white' : 'border-white/10 text-neutral-400 hover:text-white'}`}>{t}</button>
                ))}
              </div>
              <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition duration-200" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}>
                <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
                <p className="text-white font-medium">{busy ? 'writing the receipt…' : 'drop one local file'}</p>
                <p className="text-xs text-neutral-500 mt-2">no size lock. we only mention it if the tab might lag.</p>
              </label>
              {stats && (
                <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 text-sm text-neutral-300">
                  <p>{stats.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{pretty(stats.size)} · {stats.type}</p>
                </div>
              )}
              {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              {card && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-neutral-400 break-all">discord card (copied): {card}</p>
                  <p className="text-xs text-neutral-500 break-all">open link: {open}</p>
                  <button type="button" onClick={() => navigate('thimbles')} className="text-xs text-[#6eb6ff]">see filed receipts</button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
