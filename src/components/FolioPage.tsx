import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Folio = {
  id: string;
  title: string;
  author: string | null;
  note: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  excerpt: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FolioPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Folio | null>(null);
  const [recent, setRecent] = useState<Folio[]>([]);

  const load = () => {
    sbRest('folios?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!shareId) return;
    sbRest(`folios?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setOpen(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, { caption: note || title, author, cardTitle: title || file.name });
    if (!published.ok || !published.url) {
      setBusy(false);
      setErr(published.error || 'could not store the file');
      return;
    }
    let excerpt = '';
    if ((file.type || '').startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) {
      excerpt = (await file.slice(0, 480).text()).replace(/\s+/g, ' ').slice(0, 220);
    }
    const id = published.id || Date.now().toString(36);
    const row = await sbRest('folios', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title: title || file.name,
        author: author || null,
        note: note || null,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        share_id: published.id || null,
        excerpt: excerpt || null,
      }),
    });
    setBusy(false);
    if (!row.ok) {
      setErr((await row.text()).slice(0, 180));
      return;
    }
    setLink(`${window.location.origin}/folio/${id}`);
    setFile(null);
    setTitle('');
    setNote('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">reading copy</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">Folio</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">A reading copy, not a drawer. The local file goes to storage, the title and excerpt land in the folios table, and /folio/id unfurls in Discord. Large files get a slowness note, never a refusal.</p>
        {open && (
          <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">{open.author || 'unsigned'}</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{open.title}</h2>
            {open.excerpt && <p className="mt-4 text-[17px] leading-relaxed text-white/80">{open.excerpt}</p>}
            {open.note && <p className="mt-3 text-sm text-white/50">{open.note}</p>}
            <a href={open.file_url} className="mt-5 inline-flex rounded-full bg-[#0a84ff] px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02]">{open.file_name} · {pretty(Number(open.size) || 0)}</a>
          </motion.article>
        )}
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <label className="block text-sm text-white/70">file<input type="file" onChange={(e) => { const next = e.target.files?.[0] || null; setFile(next); setWarn(next && next.size > 25 * 1024 * 1024 ? 'large folio. the tab may pause while it sends. nothing is refused.' : ''); }} className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white" /></label>
          {warn && <p className="mt-2 text-sm text-amber-200/80">{warn}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="author" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="colophon note" className="sm:col-span-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          </div>
          <button disabled={!file || busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'setting type…' : 'set the folio'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm text-white/70">card link <a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </section>
        <section className="mt-10">
          <h2 className="text-lg font-medium">recent folios</h2>
          <ul className="mt-3 space-y-2">
            {recent.map((row) => (
              <li key={row.id}><button onClick={() => navigate('folio', row.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"><span className="text-sm font-medium">{row.title}</span><span className="text-xs text-white/40">{pretty(Number(row.size) || 0)}</span></button></li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
