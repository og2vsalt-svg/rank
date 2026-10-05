import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SLOW = 12 * 1024 * 1024;

type Slip = { id: string; body: string; author: string | null; share_id: string | null; created_at: string };

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TillerPage() {
  const { shareId } = useRouter();
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');

  const warn = useMemo(() => (file && file.size > SLOW ? 'this file is large. the tab may feel slow. it is not refused.' : ''), [file]);

  async function load() {
    const r = await fetch('/api/tiller');
    const data = await r.json();
    if (data?.slips) setSlips(data.slips);
  }

  useEffect(() => {
    load().catch(() => setNote('log is quiet for a moment'));
  }, []);

  async function keep(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setNote('');
    setLink('');
    try {
      let shareRef: string | null = null;
      if (file) {
        const form = new FormData();
        form.set('file', file);
        form.set('caption', body.trim().slice(0, 280));
        form.set('author', author.trim());
        form.set('cardTitle', file.name);
        const up = await fetch('/api/share', { method: 'POST', body: form });
        const saved = await up.json();
        if (!up.ok) throw new Error(saved.error || 'file did not land');
        shareRef = saved.id;
        if (saved.warn) setNote(saved.warn);
      }
      const r = await fetch('/api/tiller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), author: author.trim(), shareId: shareRef }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'line was not kept');
      const path = data.path || `/tiller/${data.slip?.id}`;
      setLink(`${window.location.origin}${path}`);
      setBody('');
      setFile(null);
      await load();
    } catch (err: any) {
      setNote(err.message || 'could not keep that');
    } finally {
      setBusy(false);
    }
  }

  const focus = shareId ? slips.find((s) => s.id === shareId) : null;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <p className="text-[#0a84ff] text-sm font-medium tracking-wide mb-3">tiller</p>
        <h1 className="text-4xl font-semibold tracking-tight leading-tight">a log, not another vault.</h1>
        <p className="text-neutral-400 mt-3 leading-relaxed">
          write a line. attach a local file if the line needs proof. the file still lands in the share table. discord cards follow the link.
        </p>
        {focus && (
          <article className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-neutral-200 leading-relaxed">{focus.body}</p>
            <p className="text-xs text-neutral-500 mt-3">{focus.author || 'unsigned'} · {new Date(focus.created_at).toLocaleString()}</p>
            {focus.share_id && (
              <a className="inline-block mt-3 text-sm text-[#0a84ff]" href={`/s/${focus.share_id}`}>open attached file</a>
            )}
          </article>
        )}
        <form onSubmit={keep} className="mt-8 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="what changed, what you handed off, what to remember"
            className="w-full min-h-28 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/60 transition"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="name, optional"
            className="w-full rounded-full bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/60 transition"
          />
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-neutral-400 cursor-pointer hover:border-white/30 transition">
            <span>{file ? `${file.name} · ${pretty(file.size)}` : 'attach a local file, optional'}</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {warn && <p className="text-xs text-amber-300/90">{warn}</p>}
          <button disabled={busy || !body.trim()} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40 transition active:scale-[0.98]">
            {busy ? 'keeping…' : 'keep the line'}
          </button>
        </form>
        {note && <p className="mt-4 text-sm text-neutral-400">{note}</p>}
        {link && (
          <p className="mt-3 text-sm">
            <a className="text-[#0a84ff] break-all" href={link}>{link}</a>
          </p>
        )}
        <ul className="mt-10 space-y-2">
          {slips.map((slip) => (
            <li key={slip.id}>
              <a href={`/tiller/${slip.id}`} className="block rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] px-4 py-3 transition">
                <p className="text-sm text-neutral-200 line-clamp-2">{slip.body}</p>
                <p className="text-xs text-neutral-500 mt-1">{slip.author || 'unsigned'}{slip.share_id ? ' · file attached' : ''}</p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
