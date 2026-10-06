import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_b64?: string | null;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function id8() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.onload = () => {
      const raw = String(reader.result || '');
      const comma = raw.indexOf(',');
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw);
    };
    reader.readAsDataURL(file);
  });
}

export default function CoakPage() {
  const { navigate, shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [stats, setStats] = useState<{ name: string; size: number; type: string } | null>(null);
  const [card, setCard] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(Boolean(shareId));

  useEffect(() => {
    if (!shareId) {
      setRow(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    fetch(`${SB_URL}/rest/v1/sheaves?id=eq.${encodeURIComponent(shareId)}&select=id,title,note,author,file_name,mime,size,file_b64&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setRow(Array.isArray(data) && data[0] ? data[0] : null);
        if (!Array.isArray(data) || !data[0]) setErr('that pin is not in the table.');
      })
      .catch(() => {
        if (live) setErr('could not open this coak.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [shareId]);

  const download = () => {
    if (!row?.file_b64) return;
    const bin = atob(row.file_b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: row.mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = row.file_name || 'coak';
    a.click();
    URL.revokeObjectURL(url);
  };

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    const label = (title.trim() || file.name).slice(0, 120);
    setErr('');
    setCard('');
    setStats({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 4 * 1024 * 1024 ? 'heavy drop. the database write may feel slow. nothing is refused.' : '');
    setBusy(true);
    try {
      const file_b64 = await readAsBase64(file);
      const id = id8();
      const res = await fetch(`${SB_URL}/rest/v1/sheaves`, {
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
          author: author.trim() || null,
          file_name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          file_b64,
        }),
      });
      if (!res.ok) {
        setErr('the row did not save');
        return;
      }
      const link = `${location.origin}/coak/${id}`;
      setCard(link);
      try { await navigator.clipboard.writeText(link); } catch { /* clipboard optional */ }
    } catch (e: any) {
      setErr(e?.message || 'coak stuck');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          {shareId ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">coak</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">{loading ? 'opening…' : row?.title || 'missing pin'}</h1>
              {row && (
                <>
                  <p className="text-neutral-400 text-sm mb-4">{row.note || 'no note on this row.'}{row.author ? ` from ${row.author}.` : ''}</p>
                  <p className="text-xs text-neutral-500 mb-5">{row.file_name} · {pretty(Number(row.size) || 0)} · kept in the database</p>
                  {row.file_b64 ? (
                    <button type="button" onClick={download} className="inline-flex rounded-full bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200 transition">download the file</button>
                  ) : (
                    <p className="text-xs text-neutral-500">the bytes are not on this row.</p>
                  )}
                </>
              )}
              {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
              <button type="button" onClick={() => navigate('coak')} className="mt-6 block text-xs text-[#6eb6ff]">file another</button>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">coak</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">the file lives on the row.</h1>
              <p className="text-neutral-400 text-sm mb-6">the vault still keeps your private shelf. this desk reads one local file and writes the bytes into the sheaves table, then hands you a Discord card. older pages stay on their routes.</p>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what to call it" className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 transition" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name (optional)" className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why this file is here" rows={3} className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 resize-none" />
              <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition duration-200" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}>
                <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
                <p className="text-white font-medium">{busy ? 'writing the row…' : 'drop one local file'}</p>
                <p className="text-xs text-neutral-500 mt-2">no size lock. we only mention it if the write might lag.</p>
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
                  <button type="button" onClick={() => navigate('sheaveboard')} className="text-xs text-[#6eb6ff]">see the board</button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
