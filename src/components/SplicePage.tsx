import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Pair = {
  id: string;
  title: string | null;
  note: string | null;
  left_name: string | null;
  right_name: string | null;
  left_size: number;
  right_size: number;
  left_url: string | null;
  right_url: string | null;
  left_hash: string | null;
  right_hash: string | null;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function SplicePage() {
  const { navigate, shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [left, setLeft] = useState<File | null>(null);
  const [right, setRight] = useState<File | null>(null);
  const [busy, setBusy] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [pair, setPair] = useState<Pair | null>(null);
  const [loading, setLoading] = useState(Boolean(shareId));

  useEffect(() => {
    if (!shareId) {
      setPair(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    fetch(`${SB_URL}/rest/v1/splices?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setPair(Array.isArray(data) && data[0] ? data[0] : null);
        if (!Array.isArray(data) || !data[0]) setErr('that splice is not on the serving.');
      })
      .catch(() => {
        if (live) setErr('could not open this splice.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [shareId]);

  const send = async () => {
    if (!left || !right) {
      setErr('pick both files first.');
      return;
    }
    setErr('');
    setEmbed('');
    const total = left.size + right.size;
    setWarn(total > 40 * 1024 * 1024 ? 'heavy pair. the tab may feel slow while both send. no hard cap.' : '');
    setBusy('hashing');
    try {
      const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
      setBusy('sending left');
      const a = await publishLocalFile(left, { caption: note.trim() || title.trim() || left.name, cardTitle: left.name });
      if (!a.ok || !a.id) {
        setErr(a.error || 'left file did not land');
        return;
      }
      setBusy('sending right');
      const b = await publishLocalFile(right, { caption: note.trim() || title.trim() || right.name, cardTitle: right.name });
      if (!b.ok || !b.id) {
        setErr(b.error || 'right file did not land');
        return;
      }
      if (a.warn || b.warn) setWarn(a.warn || b.warn || warn);
      const id = a.id;
      const label = (title.trim() || `${left.name} / ${right.name}`).slice(0, 80);
      setBusy('filing');
      const row = await fetch(`${SB_URL}/rest/v1/splices`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id,
          title: label,
          note: note.trim() || null,
          left_name: left.name,
          right_name: right.name,
          left_size: left.size,
          right_size: right.size,
          left_mime: left.type || 'application/octet-stream',
          right_mime: right.type || 'application/octet-stream',
          left_url: a.url || null,
          right_url: b.url || null,
          left_share: a.id,
          right_share: b.id,
          left_hash: leftHash,
          right_hash: rightHash,
        }),
      });
      if (!row.ok) {
        setErr('both files are in the share table, but the splice row did not save');
        return;
      }
      const card = `${location.origin}/splice/${id}`;
      setEmbed(card);
      try { await navigator.clipboard.writeText(card); } catch { /* clipboard optional */ }
    } catch (e: any) {
      setErr(e?.message || 'splice stuck');
    } finally {
      setBusy('');
    }
  };

  const same = pair && pair.left_hash && pair.right_hash && pair.left_hash === pair.right_hash;
  const delta = pair ? Math.abs(Number(pair.left_size) - Number(pair.right_size)) : 0;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          {shareId ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">splice</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">{loading ? 'opening…' : pair?.title || 'missing pair'}</h1>
              {pair && (
                <>
                  <p className="text-neutral-400 text-sm mb-5">{pair.note || 'no note on this pair.'}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[{ name: pair.left_name, size: pair.left_size, url: pair.left_url, hash: pair.left_hash, side: 'left' }, { name: pair.right_name, size: pair.right_size, url: pair.right_url, hash: pair.right_hash, side: 'right' }].map((side) => (
                      <motion.div key={side.side} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: side.side === 'right' ? 0.08 : 0, duration: 0.4 }} className="rounded-3xl bg-white/[0.03] border border-white/10 p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">{side.side}</p>
                        <p className="text-white text-sm break-all">{side.name || 'file'}</p>
                        <p className="text-xs text-neutral-500 mt-1">{pretty(Number(side.size) || 0)}</p>
                        <p className="text-[11px] text-neutral-600 mt-2 break-all">{side.hash ? side.hash.slice(0, 16) + '…' : ''}</p>
                        {side.url && <a href={side.url} className="inline-flex mt-4 rounded-full bg-white text-black text-xs font-medium px-3 py-1.5 hover:bg-neutral-200 transition" download>open</a>}
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-4">{same ? 'same sha-256. these two files match.' : `size gap ${pretty(delta)}. hashes differ.`} both copies stay in the share table.</p>
                </>
              )}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              <button type="button" onClick={() => navigate('splice')} className="mt-6 block text-xs text-[#6eb6ff]">pair another</button>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">splice</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">pair two local files.</h1>
              <p className="text-neutral-400 text-sm mb-6">not a drawer and not a single drop. both files land in the share table, a splice row keeps the hashes, and /splice/id is the discord card. older desks stay put.</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pair name, like draft and final" className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what changed, if you want it on the card" rows={3} className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 resize-none" />
              <div className="grid sm:grid-cols-2 gap-3">
                {[{ side: 'left', file: left, set: setLeft }, { side: 'right', file: right, set: setRight }].map((slot) => (
                  <label key={slot.side} className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition duration-200">
                    <input type="file" className="hidden" onChange={(e) => slot.set(e.target.files?.[0] || null)} />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-2">{slot.side}</p>
                    <p className="text-white text-sm font-medium">{slot.file ? slot.file.name : 'choose a local file'}</p>
                    <p className="text-xs text-neutral-500 mt-2">{slot.file ? pretty(slot.file.size) : 'no size lock'}</p>
                  </label>
                ))}
              </div>
              <button type="button" disabled={Boolean(busy)} onClick={send} className="mt-5 rounded-full bg-white text-black text-sm font-medium px-5 py-2.5 hover:bg-neutral-200 transition disabled:opacity-60">
                {busy ? busy + '…' : 'splice and share'}
              </button>
              {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              {embed && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-neutral-400 break-all">discord card (copied): {embed}</p>
                  <button type="button" onClick={() => navigate('serving')} className="text-xs text-[#6eb6ff]">see the serving</button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
