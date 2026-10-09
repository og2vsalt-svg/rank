import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  panel: string;
  recess: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  created_at: string;
};
type Lid = { id: string; coffer_id: string; lid: string; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CofferPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [panel, setPanel] = useState('');
  const [recess, setRecess] = useState('');
  const [lid, setLid] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [lids, setLids] = useState<Lid[]>([]);

  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'a large file in the recess may feel slow to send. it is not refused.' : ''),
    [file],
  );

  const load = () => {
    sbRest('coffers?select=*&order=created_at.desc&limit=12')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`coffers?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
    sbRest(`coffer_lids?coffer_id=eq.${encodeURIComponent(shareId)}&select=*&order=created_at.desc&limit=20`)
      .then((r) => r.json())
      .then((data) => setLids(Array.isArray(data) ? data : []))
      .catch(() => setLids([]));
  }, [shareId]);

  const sink = async () => {
    if (!panel.trim()) return;
    setBusy(true);
    setErr('');
    let fileUrl: string | null = null;
    let id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    let publishedWarn = '';
    if (file) {
      const published = await publishLocalFile(file, { caption: recess, author: panel, cardTitle: `${panel.trim()} — coffer` });
      if (!published.ok || !published.id) {
        setBusy(false);
        setErr(published.error || 'could not set the panel');
        return;
      }
      id = published.id;
      fileUrl = published.url || null;
      publishedWarn = published.warn || '';
    }
    const res = await sbRest('coffers', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id,
        panel: panel.trim(),
        recess: recess || null,
        file_name: file?.name || null,
        mime: file?.type || null,
        size: file?.size || 0,
        file_url: fileUrl,
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
    setLink(`${location.origin}/coffer/${id}`);
    setWarn(publishedWarn || slow || '');
    if (next) setRows((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 12));
    history.pushState(null, '', `/coffer/${id}`);
  };

  const addLid = async () => {
    if (!row || !lid.trim()) return;
    const res = await sbRest('coffer_lids', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ coffer_id: row.id, lid: lid.trim() }),
    });
    if (!res.ok) {
      setErr((await res.text()).slice(0, 160));
      return;
    }
    const saved = await res.json();
    const next = Array.isArray(saved) ? saved[0] : null;
    if (next) setLids((prev) => [next, ...prev]);
    setLid('');
  };

  const shown = row;
  const image = shown?.mime?.startsWith('image/') ? shown.file_url : '';

  return (
    <div className="min-h-screen bg-[#070708] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          recessed panel
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">
          Coffer
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Sink a panel. A local file is optional. Lids are short lines other people can set on the same recess. Paste /coffer/id in Discord. Large files are warned, never refused.
        </p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center transition duration-200 hover:border-[#bf5af2]/70">
            <span className="text-sm text-white/80">{file ? file.name : 'optional file from this device'}</span>
            <span className="mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'a panel can be text only'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {slow && <p className="mt-3 text-xs text-amber-200/80">{slow}</p>}
          <input value={panel} onChange={(e) => setPanel(e.target.value)} placeholder="panel name" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#bf5af2]" />
          <textarea value={recess} onChange={(e) => setRecess(e.target.value)} placeholder="what sits in the recess" className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#bf5af2]" />
          <button disabled={!panel.trim() || busy} onClick={sink} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'sinking…' : 'sink the panel'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {warn && <p className="mt-3 text-sm text-amber-200/80">{warn}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="mt-3 block text-left text-sm text-[#e5c8ff]">
              {link} — copied on click
            </button>
          )}
        </motion.div>
        {shown && (
          <motion.article layout className="mt-6 overflow-hidden rounded-3xl border border-[#bf5af2]/40 bg-white/[0.04]">
            {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
            <div className="p-5">
              <h2 className="text-2xl font-semibold tracking-tight">{shown.panel}</h2>
              <p className="mt-2 text-sm text-white/60">{shown.recess || 'empty recess'}{shown.file_name ? ` · ${pretty(Number(shown.size) || 0)}` : ''}</p>
              {shown.file_url && <a href={shown.file_url} className="mt-3 inline-block text-sm text-[#e5c8ff]">download {shown.file_name}</a>}
              <div className="mt-4 flex gap-2">
                <input value={lid} onChange={(e) => setLid(e.target.value)} placeholder="set a lid on this panel" className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm outline-none" />
                <button onClick={addLid} className="rounded-full bg-white/10 px-4 text-sm">set</button>
              </div>
              <ul className="mt-3 space-y-1">
                {lids.map((item) => (
                  <li key={item.id} className="rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-white/70">{item.lid}</li>
                ))}
              </ul>
            </div>
          </motion.article>
        )}
        <ul className="mt-8 space-y-2">
          {rows.map((item) => (
            <li key={item.id}>
              <a href={`/coffer/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <span>{item.panel}</span>
                <span className="text-white/40">{item.file_name || 'text panel'}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
