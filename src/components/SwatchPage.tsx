import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Swatch = {
  id: string;
  name: string;
  note: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  colors: string[];
};

function colorsFrom(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 24;
      const h = 24;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); resolve([]); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] >> 4;
        const g = data[i + 1] >> 4;
        const b = data[i + 2] >> 4;
        const key = `${r},${g},${b}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      URL.revokeObjectURL(url);
      resolve(top.map(([key]) => {
        const [r, g, b] = key.split(',').map((n) => (Number(n) << 4).toString(16).padStart(2, '0'));
        return `#${r}${g}${b}`;
      }));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    img.src = url;
  });
}

export default function SwatchPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Swatch | null>(null);
  const [recent, setRecent] = useState<Swatch[]>([]);

  const load = () => {
    sbRest('swatches?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!shareId) return;
    sbRest(`swatches?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setOpen(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const onFile = async (list: FileList | null) => {
    const next = list?.[0] || null;
    setFile(next);
    setErr('');
    setWarn(next && next.size > 20 * 1024 * 1024 ? 'large image. sampling may hitch. nothing is refused.' : '');
    setChips(next && next.type.startsWith('image/') ? await colorsFrom(next) : []);
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    const published = await publishLocalFile(file, { caption: note || name, cardTitle: name || file.name, color: chips[0] });
    if (!published.ok || !published.url) {
      setBusy(false);
      setErr(published.error || 'could not store the image');
      return;
    }
    const id = published.id || Date.now().toString(36);
    const row = await sbRest('swatches', {
      method: 'POST',
      body: JSON.stringify({
        id,
        name: name || file.name,
        note: note || null,
        file_name: file.name,
        mime: file.type || 'image/*',
        size: file.size,
        file_url: published.url,
        share_id: published.id,
        colors: chips,
      }),
    });
    setBusy(false);
    if (!row.ok) { setErr((await row.text()).slice(0, 180)); return; }
    setLink(`${window.location.origin}/swatch/${id}`);
    setFile(null);
    setChips([]);
    load();
  };

  const shown = open?.colors || chips;
  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">palette</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">Swatch</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Pull five colors from a local image in the tab, then keep the file and the chips in the swatches table. Not a vault. /swatch/id is the Discord card, and the lead color tints the embed.</p>
        {shown.length > 0 && (
          <div className="mt-8 flex gap-3">
            {shown.map((c, i) => (
              <motion.div key={c + i} initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 20 }} className="h-20 flex-1 rounded-3xl border border-white/10" style={{ background: c }} title={c} />
            ))}
          </div>
        )}
        {open?.file_url && <a href={open.file_url} className="mt-4 inline-flex text-sm text-[#0a84ff]">{open.file_name}</a>}
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files)} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white" />
          {warn && <p className="mt-2 text-sm text-amber-200/80">{warn}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="palette name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="where it came from" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          </div>
          <button disabled={!file || busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'keeping chips…' : 'keep the swatch'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm"><a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </section>
        <ul className="mt-8 space-y-2">
          {recent.map((row) => (
            <li key={row.id}><button onClick={() => navigate('swatch', row.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left"><span>{row.name}</span><span className="flex gap-1">{(row.colors || []).slice(0, 4).map((c) => <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />)}</span></button></li>
          ))}
        </ul>
      </main>
    </div>
  );
}
