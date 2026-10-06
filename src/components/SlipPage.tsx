import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile, type CloudMeta } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function cleanCode(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
}

async function listTable(code: string): Promise<CloudMeta[]> {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const url = `${SB_URL}/rest/v1/public_shares?is_public=eq.true&meta->>slip=eq.${encodeURIComponent(code)}&select=id,name,mime,size,file_url,author,caption,created_at&order=created_at.desc&limit=40`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.mime || 'application/octet-stream',
    size: Number(row.size) || 0,
    url: row.file_url,
    author: row.author || null,
    caption: row.caption || null,
  }));
}

export default function SlipPage() {
  const { shareId, navigate } = useRouter();
  const [code, setCode] = useState(shareId || '');
  const [joined, setJoined] = useState(shareId || '');
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [who, setWho] = useState('');
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const slow = useMemo(() => !!file && file.size > 12 * 1024 * 1024, [file]);

  useEffect(() => {
    if (shareId) {
      setCode(shareId);
      setJoined(shareId);
    }
  }, [shareId]);

  useEffect(() => {
    if (!joined) return;
    let stop = false;
    const pull = () => {
      listTable(joined).then((next) => {
        if (!stop) setRows(next);
      });
    };
    pull();
    const id = window.setInterval(pull, 8000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [joined]);

  function openTable(next: string) {
    const id = cleanCode(next);
    if (id.length < 3) {
      setErr('use at least 3 letters');
      return;
    }
    setErr('');
    setJoined(id);
    navigate('slip', id);
  }

  async function drop() {
    setErr('');
    setWarn('');
    if (!joined) return setErr('open a table first');
    if (!file) return setErr('choose a local file');
    setBusy(true);
    try {
      const pub = await publishLocalFile(file, {
        caption: note.trim(),
        author: who.trim(),
        color: '#64D2FF',
        cardTitle: file.name,
      });
      if (!pub.ok || !pub.id) throw new Error(pub.error || 'share failed');
      if (pub.warn) setWarn(pub.warn);
      await fetch('/api/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pub.id, caption: note.trim(), meta: { slip: joined } }),
      });
      setFile(null);
      setNote('');
      setRows(await listTable(joined));
    } catch (e: any) {
      setErr(e?.message || 'could not set that file down');
    } finally {
      setBusy(false);
    }
  }

  const tableLink = joined ? `${location.origin}/slip/${joined}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#64d2ff] mb-2">slip</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a table, not a drawer</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Pick a short code and anyone with the link can set a local file on the same table. Bytes land in the share database. Discord unfurls /slip. Large drops are warned, never refused. This is not the vault.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-3xl p-5 mb-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
              placeholder="table code"
              className="flex-1 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none"
            />
            <button type="button" onClick={() => openTable(code)} className="rounded-full bg-white text-black text-sm font-medium px-4 active:scale-[0.98] transition">
              open
            </button>
          </div>
          {tableLink && (
            <button
              type="button"
              className="mt-3 text-xs text-[#64d2ff] text-left break-all"
              onClick={() => navigator.clipboard.writeText(tableLink).catch(() => {})}
            >
              {tableLink}
            </button>
          )}
        </motion.div>

        {joined && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-4">
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30 transition-colors duration-200">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="text-sm text-neutral-300">{file ? file.name : 'choose a local file'}</span>
              {file && <span className="block text-xs text-neutral-500 mt-2">{prettySize(file.size)}</span>}
            </label>
            <input value={who} onChange={(e) => setWho(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-3" />
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 400))} placeholder="a line beside the file, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-20 mb-3" />
            {slow && <p className="text-xs text-amber-300 mb-3">this one is large. sending may feel slow. there is no size cap.</p>}
            {warn && <p className="text-xs text-amber-300 mb-3">{warn}</p>}
            {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
            <button type="button" disabled={busy} onClick={drop} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
              {busy ? 'setting it down…' : 'put it on the table'}
            </button>
          </motion.div>
        )}

        {joined && (
          <section className="space-y-2">
            {!rows.length && <p className="text-sm text-neutral-500 px-1">nothing on this table yet.</p>}
            {rows.map((row, i) => (
              <motion.article
                key={row.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03 }}
                className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500">{prettySize(row.size)}{row.author ? ` · ${row.author}` : ''}{row.caption ? ` · ${row.caption}` : ''}</p>
                </div>
                {row.url && (
                  <a className="text-xs text-[#64d2ff] shrink-0" href={row.url} rel="noreferrer">open</a>
                )}
              </motion.article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
