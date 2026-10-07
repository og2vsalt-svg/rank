import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest, supabaseConfig } from '../lib/supabase';

type Row = {
  id: string;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  note: string | null;
  author: string | null;
  created_at?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function CourierPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [status, setStatus] = useState('drop a local file. it lands in the hosted_files table and the public share row.');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [opened, setOpened] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  useEffect(() => {
    sbRest('hosted_files?select=id,name,mime,size,file_url,note,author,created_at&order=created_at.desc&limit=12')
      .then((r) => r.json())
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => setRecent([]));
  }, [link]);

  useEffect(() => {
    if (!shareId) {
      setOpened(null);
      return;
    }
    sbRest(`hosted_files?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((rows) => setOpened(Array.isArray(rows) && rows[0] ? rows[0] : null))
      .catch(() => setOpened(null));
  }, [shareId]);

  function take(next: File | null) {
    setFile(next);
    if (!next) {
      setWarn('');
      return;
    }
    if (next.size > 20 * 1024 * 1024) {
      setWarn('this one is large. the tab may feel slow while it uploads. nothing is refused.');
    } else {
      setWarn('');
    }
  }

  async function send() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('filing…');
    const id = uid();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 90) || 'file';
    const path = `${id}/${safe}`;
    try {
      const up = await fetch(`${supabaseConfig.url}/storage/v1/object/drops/${path}`, {
        method: 'POST',
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'true',
        },
        body: file,
      });
      if (!up.ok) {
        const detail = await up.text();
        throw new Error(detail.slice(0, 180) || 'storage refused the bytes');
      }
      const fileUrl = `${supabaseConfig.url}/storage/v1/object/public/drops/${path}`;
      const row = {
        id,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: fileUrl,
        note: note.trim() || null,
        author: author.trim() || null,
        share_id: id,
        storage_path: path,
      };
      const saved = await sbRest('hosted_files', { method: 'POST', body: JSON.stringify(row) });
      if (!saved.ok) throw new Error('could not write the hosted_files row');
      await sbRest('public_shares', {
        method: 'POST',
        body: JSON.stringify({
          id,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          file_url: fileUrl,
          is_public: true,
          author: author.trim() || null,
          caption: note.trim() || null,
          meta: { desk: 'courier' },
        }),
      });
      const href = `${window.location.origin}/courier/${id}`;
      setLink(href);
      setStatus('filed. paste the link in Discord for a card.');
      navigate('courier', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not file that');
    } finally {
      setBusy(false);
    }
  }

  const preview = opened?.mime?.startsWith('image/') ? opened.file_url : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24 apple-in">
        <p className="text-[12px] uppercase tracking-[0.16em] text-white/40">courier</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Send a local file.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
          Bytes go to the drops bucket. The row lives in hosted_files, and a public share is written so /s and Discord both know the file. Older desks stay where they are.
        </p>

        {opened && (
          <section className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs text-white/40">opened share</p>
            <h2 className="text-xl text-white mt-1">{opened.name}</h2>
            <p className="text-sm text-neutral-400 mt-1">{pretty(Number(opened.size) || 0)}{opened.author ? ` · ${opened.author}` : ''}</p>
            {opened.note && <p className="text-sm text-neutral-300 mt-3">{opened.note}</p>}
            {preview && <img src={preview} alt="" className="mt-4 rounded-2xl max-h-72 object-cover" />}
            <a href={opened.file_url} className="inline-flex mt-4 text-sm px-4 py-2 rounded-full bg-white text-black" download>download</a>
          </section>
        )}

        <section className="glass apple-card rounded-3xl p-6 mt-8">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer">
            <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
            <span className="text-white">{file ? file.name : 'choose a file, or drop it here'}</span>
            <span className="block text-xs text-neutral-500 mt-2">{file ? pretty(file.size) : 'no size cap. only a note if it might feel slow.'}</span>
          </label>
          {warn && <p className="text-sm text-amber-200/90 mt-3">{warn}</p>}
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note for the card" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </div>
          <button onClick={send} disabled={!file || busy} className="mt-4 text-sm font-medium px-4 py-2.5 rounded-full bg-white text-black disabled:opacity-40">
            {busy ? 'filing…' : 'file and share'}
          </button>
          <p className="text-sm text-neutral-400 mt-3">{status}</p>
          {link && (
            <p className="text-sm text-white mt-2 break-all">
              <a href={link}>{link}</a>
              <span className="block text-neutral-500 mt-1">also {window.location.origin}/s/{link.split('/').pop()}</span>
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm text-white/50 mb-3">recent filings</h2>
          <div className="space-y-2">
            {recent.map((row) => (
              <button key={row.id} onClick={() => navigate('courier', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 lift">
                <span className="text-white text-sm">{row.name}</span>
                <span className="block text-xs text-neutral-500">{pretty(Number(row.size) || 0)}{row.note ? ` · ${row.note}` : ''}</span>
              </button>
            ))}
            {!recent.length && <p className="text-sm text-neutral-500">nothing filed yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
