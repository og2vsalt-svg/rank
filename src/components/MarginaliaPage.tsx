import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Note = {
  id: string;
  share_id: string | null;
  file_name: string | null;
  passage: string;
  author: string | null;
  created_at: string;
};

export default function MarginaliaPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [passage, setPassage] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [focus, setFocus] = useState<Note | null>(null);

  const load = () => {
    sbRest('marginalia?select=id,share_id,file_name,passage,author,created_at&order=created_at.desc&limit=30')
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!shareId) return;
    sbRest(`marginalia?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setFocus(Array.isArray(data) ? data[0] || null : null))
      .catch(() => {});
  }, [shareId]);

  const onFile = (next: File | null) => {
    setFile(next);
    setWarn(next && next.size > 25 * 1024 * 1024 ? 'large file. the tab may pause while it sends. nothing is refused.' : '');
  };

  const send = async () => {
    if (!passage.trim()) return;
    setBusy(true);
    setErr('');
    let storedId: string | null = null;
    let fileName = file?.name || null;
    if (file) {
      const published = await publishLocalFile(file, { caption: passage.slice(0, 140), author: author || undefined });
      if (!published.ok) {
        setBusy(false);
        setErr(published.error || 'could not store the file');
        return;
      }
      storedId = published.id || null;
    }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ins = await sbRest('marginalia', {
      method: 'POST',
      body: JSON.stringify({ id, share_id: storedId, file_name: fileName, passage: passage.trim(), author: author || null }),
    });
    setBusy(false);
    if (!ins.ok) {
      setErr((await ins.text()).slice(0, 180));
      return;
    }
    setLink(`${window.location.origin}/marginalia/${id}`);
    setPassage('');
    setFile(null);
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">margin notes</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">Marginalia</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A short note, with an optional local file beside it. The note is the page. The file, if you add one, lands in the share table. No size cap, only a warning if the drop may feel slow.</p>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 26 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <textarea value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="the line you want in the margin" rows={5} className="w-full resize-none rounded-2xl bg-black/40 px-4 py-3 text-[15px] leading-relaxed outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="initials" className="flex-1 rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
            <label className="cursor-pointer rounded-2xl bg-black/40 px-4 py-3 text-[14px] text-white/70 ring-1 ring-white/10">
              {file ? file.name : 'optional file'}
              <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          <button onClick={send} disabled={!passage.trim() || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40">{busy ? 'filing…' : 'file the note'}</button>
          {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
          {link && <p className="mt-3 break-all text-[13px] text-[#7ec8ff]"><a href={link}>{link}</a></p>}
        </motion.section>
        {focus && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">{focus.file_name || 'note'}</p>
            <p className="mt-3 text-[17px] leading-relaxed text-white/85">{focus.passage}</p>
            {focus.author && <p className="mt-2 text-[13px] text-white/40">{focus.author}</p>}
            {focus.share_id && <a href={`/s/${focus.share_id}`} className="mt-4 inline-flex rounded-full bg-[#0A84FF] px-4 py-2 text-[13px] font-medium text-white">open the file</a>}
          </section>
        )}
        <section className="mt-10 space-y-2">
          {notes.map((n, i) => (
            <motion.a key={n.id} href={`/marginalia/${n.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.24) }} className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06]">
              <span className="block text-[14px] text-white/85">{n.passage.slice(0, 140)}</span>
              <span className="mt-1 block text-[12px] text-white/40">{n.file_name || 'note only'}</span>
            </motion.a>
          ))}
        </section>
      </main>
    </div>
  );
}
