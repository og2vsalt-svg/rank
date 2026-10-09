import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type PacketFile = { id: string; name: string; mime: string; size: number; url: string };
type Packet = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  files: PacketFile[];
  total_size: number;
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

async function loadPacket(id: string): Promise<Packet | null> {
  const res = await fetch(
    `${SB_URL}/rest/v1/courier_packets?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function CourierPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('packet');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [packet, setPacket] = useState<Packet | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let gone = false;
    loadPacket(shareId).then((row) => {
      if (!gone) setPacket(row);
    });
    return () => {
      gone = true;
    };
  }, [shareId]);

  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const onPick = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((cur) => [...cur, ...next]);
    const big = next.some((f) => f.size > 40 * 1024 * 1024) || total > 80 * 1024 * 1024;
    setWarn(big ? 'A few of these are large. The tab may feel slow while they send. Nothing is refused.' : '');
  };

  const send = async () => {
    if (!files.length) {
      setErr('add at least one local file');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const uploaded: PacketFile[] = [];
      for (const file of files) {
        const done = await publishLocalFile(file, {
          caption: note,
          author,
          cardTitle: file.name,
          meta: { desk: 'courier' },
        });
        if (!done.ok || !done.id || !done.url) throw new Error(done.error || 'upload failed');
        uploaded.push({
          id: done.id,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          url: done.url,
        });
        if (done.warn) setWarn(done.warn);
      }
      const id = uid();
      const row = {
        id,
        title: title.trim() || 'packet',
        note: note.trim() || null,
        author: author.trim() || null,
        files: uploaded,
        total_size: uploaded.reduce((n, f) => n + f.size, 0),
      };
      const ins = await fetch(`${SB_URL}/rest/v1/courier_packets`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180) || 'could not save packet');
      setFiles([]);
      navigate('courier', id);
    } catch (e: any) {
      setErr(e?.message || 'could not file the packet');
    } finally {
      setBusy(false);
    }
  };

  const link = packet ? `${location.origin}/courier/${packet.id}` : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">courier</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">Send a packet of local files.</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">Each file lands in the share database. The packet link lists them together. Discord gets a card. Older desks stay where they are.</p>
        </motion.div>
        {packet ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{packet.files?.length || 0} files · {pretty(Number(packet.total_size) || 0)}</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-1">{packet.title}</h2>
            {packet.note && <p className="text-sm text-neutral-400 mb-4">{packet.note}</p>}
            <ul className="divide-y divide-white/5 mb-6">
              {(packet.files || []).map((f) => (
                <li key={f.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-xs text-neutral-500">{pretty(f.size)} · {f.mime}</p>
                  </div>
                  <a href={f.url} className="text-sm text-[#0a84ff] shrink-0" download={f.name}>download</a>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition">{copied ? 'copied' : 'copy discord link'}</button>
              <button onClick={() => navigate('courier')} className="px-4 py-2 rounded-full bg-white/5 text-sm">new packet</button>
            </div>
            <p className="text-xs text-neutral-500 mt-4 break-all">{link}</p>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8">
            <label className="block text-xs text-neutral-500 mb-1">title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition" />
            <label className="block text-xs text-neutral-500 mb-1">note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition" />
            <label className="block text-xs text-neutral-500 mb-1">from</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition" />
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-sm text-neutral-400 cursor-pointer hover:border-[#0a84ff]/40 transition">
              <span>drop files, or click to pick</span>
              <span className="text-xs text-neutral-500">no size cap — large drops only warn</span>
              <input type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
            </label>
            {!!files.length && (
              <ul className="mt-4 space-y-1">
                {files.map((f, i) => (
                  <li key={f.name + i} className="text-sm text-neutral-300 flex justify-between">
                    <span className="truncate">{f.name}</span>
                    <span className="text-neutral-500 shrink-0 ml-3">{pretty(f.size)}</span>
                  </li>
                ))}
              </ul>
            )}
            {warn && <p className="text-xs text-[#ff9f0a] mt-3">{warn}</p>}
            {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
            <button disabled={busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition">{busy ? 'sending…' : `file packet${files.length ? ` · ${pretty(total)}` : ''}`}</button>
          </motion.section>
        )}
      </main>
    </div>
  );
}
