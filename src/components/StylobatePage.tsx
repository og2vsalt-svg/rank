import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  course: string;
  elevation: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  note: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StylobatePage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [course, setCourse] = useState('');
  const [elevation, setElevation] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [steps, setSteps] = useState<Row[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'this course is carrying a large file. the tab may feel slow. nothing is refused for size.' : ''),
    [file],
  );

  const load = () => {
    sbRest('stylobates?select=*&order=created_at.desc&limit=12')
      .then((r) => r.json())
      .then((data) => setSteps(Array.isArray(data) ? data : []))
      .catch(() => setSteps([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`stylobates?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const lay = async () => {
    if (!file || !course.trim()) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: note,
      author: course,
      cardTitle: `${course.trim()} — stylobate`,
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'could not lay that course');
      return;
    }
    const res = await sbRest('stylobates', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id: published.id,
        course: course.trim(),
        elevation: elevation.trim() || null,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        note: note || null,
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
    setLink(`${location.origin}/stylobate/${published.id}`);
    setWarn(published.warn || slow || '');
    if (next) setSteps((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 12));
    history.pushState(null, '', `/stylobate/${published.id}`);
  };

  const shown = row;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          stepped base
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">
          Stylobate
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Lay one local file as a course on the stepped base. Bytes go to storage, the course lands in stylobates. Paste /stylobate/id in Discord for a card. Large drops are warned, never refused. Older desks stay.
        </p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-10 text-center transition duration-200 hover:border-[#30d158]/70">
            <span className="text-sm text-white/80">{file ? file.name : 'choose a file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'no size cap'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="course name" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <input value={elevation} onChange={(e) => setElevation(e.target.value)} placeholder="elevation, optional" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this step is carrying" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <button disabled={!file || !course.trim() || busy} onClick={lay} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'laying…' : 'lay the course'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#b7f7c8]">
              {link} — copied on click
            </button>
          )}
        </motion.div>
        {shown && (
          <motion.article layout className="mt-6 overflow-hidden rounded-3xl border border-[#30d158]/40 bg-white/[0.04]">
            {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-white/40">{shown.elevation || 'no elevation'}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{shown.course}</h2>
              <p className="mt-2 text-sm text-white/60">{shown.note || 'no note'} · {pretty(Number(shown.size) || 0)}</p>
              <a href={shown.file_url} className="mt-3 inline-block text-sm text-[#b7f7c8]">download {shown.file_name}</a>
            </div>
          </motion.article>
        )}
        <ol className="mt-8 space-y-2">
          {steps.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
              <a href={`/stylobate/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span>{item.course}</span>
                <span className="text-white/40">{item.elevation || item.file_name}</span>
              </a>
            </motion.li>
          ))}
        </ol>
      </main>
    </div>
  );
}
