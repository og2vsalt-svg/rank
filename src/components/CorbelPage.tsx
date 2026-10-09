import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  bearer: string;
  load_note: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CorbelPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [bearer, setBearer] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this bracket is carrying a large file. the tab may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  const loadRecent = () => {
    sbRest('corbels?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => setRecent([]));
  };

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`corbels?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const fileIt = async () => {
    if (!file || !bearer.trim()) return;
    setBusy(true);
    setErr('');
    setWarn('');
    const published = await publishLocalFile(file, {
      caption: note,
      author: bearer,
      cardTitle: `${bearer.trim()} — corbel`,
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'could not set that bracket');
      return;
    }
    const res = await sbRest('corbels', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id: published.id,
        bearer: bearer.trim(),
        load_note: note || null,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        share_id: published.id,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180));
      return;
    }
    const saved = await res.json();
    const next = Array.isArray(saved) ? saved[0] : null;
    setRow(next);
    setLink(`${location.origin}/corbel/${published.id}`);
    setWarn(published.warn || slow || '');
    if (next) setRecent((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 8));
    history.pushState(null, '', `/corbel/${published.id}`);
  };

  const shown = row;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          projecting bracket
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Corbel
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Set one local file on a bracket for a named bearer. The bytes land in storage and the row lands in corbels. Paste /corbel/id in Discord for a card. Large drops are warned, never refused. Older desks stay.
        </p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#ff9f0a]/70">
            <span className="text-sm text-white/80">{file ? file.name : 'choose a file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <input value={bearer} onChange={(e) => setBearer(e.target.value)} placeholder="who this bracket holds" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#ff9f0a]" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="the load, in one line" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#ff9f0a]" />
          <button disabled={!file || !bearer.trim() || busy} onClick={fileIt} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'setting…' : 'set the bracket'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#ffd6a0]">
              {link} — copied on click
            </button>
          )}
        </motion.div>

        {shown && (
          <motion.article layout className="mt-6 overflow-hidden rounded-3xl border border-[#ff9f0a]/40 bg-white/[0.04]">
            {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">for</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shown.bearer}</h2>
              <p className="mt-2 text-sm text-white/60">
                {shown.load_note || 'no load note'} · {pretty(Number(shown.size) || 0)}
              </p>
              <a href={shown.file_url} className="mt-3 inline-block text-sm text-[#ffd6a0]">
                download {shown.file_name}
              </a>
            </div>
          </motion.article>
        )}

        <ul className="mt-8 space-y-2">
          {recent.map((item) => (
            <li key={item.id}>
              <a href={`/corbel/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span>{item.bearer}</span>
                <span className="text-white/40">{item.file_name}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
