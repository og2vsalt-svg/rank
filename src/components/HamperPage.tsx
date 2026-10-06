import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type FileRow = { id: string; name: string; mime: string | null; size: number; file_url: string; share_id: string | null };
type Pack = { id: string; title: string; note: string | null; author: string | null; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function HamperPage() {
  const { shareId } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [open, setOpen] = useState<Pack | null>(null);
  const [openFiles, setOpenFiles] = useState<FileRow[]>([]);

  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  const load = () => {
    sbRest('hampers?select=id,title,note,author,created_at&order=created_at.desc&limit=24')
      .then((r) => r.json())
      .then((data) => setPacks(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`hampers?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setOpen(Array.isArray(data) ? data[0] || null : null))
      .catch(() => {});
    sbRest(`hamper_files?hamper_id=eq.${encodeURIComponent(shareId)}&select=id,name,mime,size,file_url,share_id`)
      .then((r) => r.json())
      .then((data) => setOpenFiles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [shareId]);

  const onFiles = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles(next);
    setErr('');
    setLink('');
    const bytes = next.reduce((n, f) => n + f.size, 0);
    setWarn(bytes > 25 * 1024 * 1024 ? 'large pack. the tab may pause while it sends. nothing is refused.' : '');
  };

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const uploaded: FileRow[] = [];
    for (const file of files) {
      const published = await publishLocalFile(file, { caption: note || title || undefined, author: author || undefined, cardTitle: file.name });
      if (!published.ok || !published.url) {
        setBusy(false);
        setErr(published.error || `could not store ${file.name}`);
        return;
      }
      uploaded.push({
        id: published.id || `${id}-${uploaded.length}`,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        share_id: published.id || null,
      });
    }
    const pack = await sbRest('hampers', {
      method: 'POST',
      body: JSON.stringify({ id, title: title || files[0].name, note: note || null, author: author || null }),
    });
    if (!pack.ok) {
      setBusy(false);
      setErr((await pack.text()).slice(0, 180));
      return;
    }
    const rows = await sbRest('hamper_files', {
      method: 'POST',
      body: JSON.stringify(uploaded.map((f) => ({ ...f, hamper_id: id }))),
    });
    setBusy(false);
    if (!rows.ok) {
      setErr((await rows.text()).slice(0, 180));
      return;
    }
    setLink(`${window.location.origin}/hamper/${id}`);
    setFiles([]);
    setTitle('');
    setNote('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">packed share</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Hamper</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Several local files go into storage, then one row for the pack and one row per file. Older desks stay where they are. Large packs get a slowness note, not a ceiling. Paste the link in Discord for a card.</p>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] font-medium">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready` : 'Choose files from this computer'}</span>
            <span className="mt-1 text-[13px] text-white/45">{files.length ? pretty(total) : 'any size, any type, more than one'}</span>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pack name" className="mt-4 w-full rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what this pack is for" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <button onClick={send} disabled={!files.length || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40">{busy ? 'packing…' : 'pack and share'}</button>
          {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
          {link && <p className="mt-3 break-all text-[13px] text-[#7ec8ff]"><a href={link}>{link}</a></p>}
        </motion.section>
        {open && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">opened pack</p>
            <h2 className="mt-1 text-xl font-medium">{open.title}</h2>
            {open.note && <p className="mt-2 text-[15px] text-white/75">{open.note}</p>}
            <div className="mt-4 space-y-2">
              {openFiles.map((f) => (
                <a key={f.id} href={f.file_url} className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3 text-[14px] hover:bg-black/50">
                  <span>{f.name}</span>
                  <span className="text-[12px] text-white/40">{pretty(Number(f.size) || 0)}</span>
                </a>
              ))}
            </div>
          </section>
        )}
        <section className="mt-10">
          <h2 className="mb-3 text-[17px] font-medium">Recent packs</h2>
          <div className="space-y-2">
            {packs.map((p, i) => (
              <motion.a key={p.id} href={`/hamper/${p.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.24) }} className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06]">
                <span className="block text-[14px]">{p.title}</span>
                <span className="block text-[12px] text-white/40">{p.note || 'no note'}</span>
              </motion.a>
            ))}
            {packs.length === 0 && <p className="text-[13px] text-white/40">No packs yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
