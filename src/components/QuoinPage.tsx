import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function QuoinPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [corner, setCorner] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('name the corner, then drop a local file. no size cap.');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const tone = useMemo(() => (warn ? 'text-amber-200/90' : 'text-white/45'), [warn]);

  useEffect(() => {
    if (!shareId) return;
    let live = true;
    setLink(`${location.origin}/quoin/${shareId}`);
    fetch(`${SB_URL}/rest/v1/quoin_corners?id=eq.${encodeURIComponent(shareId)}&select=corner,note,author,file_name,size,share_id&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((rows) => {
        if (!live || !rows?.[0]) return;
        const row = rows[0];
        setCorner(row.corner || '');
        setNote(row.note || '');
        setAuthor(row.author || '');
        setStatus(`${row.file_name || 'file'} · ${pretty(Number(row.size) || 0)}. paste the link in Discord for the card.`);
      })
      .catch(() => {
        if (live) setStatus('this corner link is open. the row may still be settling.');
      });
    return () => {
      live = false;
    };
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setLink('');
    if (!next) {
      setWarn('');
      return;
    }
    if (next.size > 12 * 1024 * 1024) {
      setWarn('this corner is heavy. the upload can feel slow, especially on a phone. it is still accepted.');
    } else setWarn('');
  }

  async function fileCorner() {
    if (!file || busy) return;
    const title = corner.trim() || file.name.replace(/\.[^.]+$/, '') || 'corner';
    setBusy(true);
    setStatus('writing the file into the share table…');
    try {
      const result = await publishLocalFile(file, {
        caption: note.trim() || title,
        author: author.trim() || 'quoin',
        cardTitle: file.name,
        color: 'quoin',
      });
      if (!result.ok || !result.id) {
        setStatus(result.error || 'the share table did not take the file.');
        return;
      }
      const id = uid();
      const row = {
        id,
        corner: title,
        note: note.trim() || null,
        author: author.trim() || null,
        share_id: result.id,
        file_name: file.name,
        size: file.size,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/quoin_corners`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!ins.ok) {
        const text = await ins.text();
        setStatus(`file landed, corner row did not: ${text.slice(0, 140)}`);
        setLink(`${location.origin}/s/${result.id}`);
        return;
      }
      const card = `${location.origin}/quoin/${id}`;
      setLink(card);
      setStatus(result.warn || 'cornered. paste the link in Discord for the card.');
      try { await navigator.clipboard.writeText(card); } catch {}
      navigate('quoin', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'corner failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">file desk</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">quoin</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Name a corner and attach one local file. The bytes go into the share table, and the corner row keeps the note. Large drops are warned, never refused.
          </p>
        </motion.div>

        <motion.label
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 block cursor-pointer rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.06]"
        >
          <input type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0] || null)} />
          <span className="text-sm text-white/80">{file ? file.name : 'choose a local file'}</span>
          <span className="mt-1 block text-[13px] text-white/40">{file ? pretty(file.size) : 'anything you can pick in this tab'}</span>
        </motion.label>

        <div className="mt-4 space-y-3">
          <input value={corner} onChange={(e) => setCorner(e.target.value)} placeholder="corner name" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who set it" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this corner is holding" rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
        </div>

        <p className={`mt-4 text-[13px] leading-relaxed ${tone}`}>{warn || status}</p>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={fileCorner} disabled={!file || busy} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40">
            {busy ? 'setting…' : 'set corner'}
          </button>
          <button type="button" onClick={() => navigate('rebate')} className="text-sm text-white/50 transition hover:text-white">open rebate</button>
          <button type="button" onClick={() => navigate('newel')} className="text-sm text-white/50 transition hover:text-white">open newel</button>
        </div>

        {link && (
          <motion.a href={link} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 block break-all rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-sky-200">
            {link}
          </motion.a>
        )}
      </main>
    </div>
  );
}
