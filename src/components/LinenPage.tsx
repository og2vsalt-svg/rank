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
  fold: string | null;
  receiver: string | null;
  note: string | null;
  author: string | null;
};

const FOLDS = ['plain', 'letter', 'bundle', 'keep'];

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function LinenPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fold, setFold] = useState('letter');
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [status, setStatus] = useState('fold a local file for someone. the bytes go to storage; the label goes in linen_press.');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [opened, setOpened] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  useEffect(() => {
    sbRest('linen_press?select=id,name,mime,size,file_url,fold,receiver,note,author,created_at&order=created_at.desc&limit=10')
      .then((r) => r.json())
      .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
      .catch(() => setRecent([]));
  }, [link]);

  useEffect(() => {
    if (!shareId) {
      setOpened(null);
      return;
    }
    sbRest(`linen_press?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
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
    setWarn(next.size > 24 * 1024 * 1024 ? 'large fold. the browser may feel slow while it sends. nothing is refused.' : '');
  }

  async function press() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('pressing…');
    const id = uid();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 90) || 'file';
    const path = `linen/${id}/${safe}`;
    try {
      const up = await fetch(`${supabaseConfig.url}/storage/v1/object/shares/${path}`, {
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
        throw new Error(detail.slice(0, 180) || 'storage did not take the file');
      }
      const fileUrl = `${supabaseConfig.url}/storage/v1/object/public/shares/${path}`;
      const row = {
        id,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: fileUrl,
        fold,
        receiver: receiver.trim() || null,
        note: note.trim() || null,
        author: author.trim() || null,
      };
      const saved = await sbRest('linen_press', { method: 'POST', body: JSON.stringify(row) });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180) || 'could not write the linen row');
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
          meta: { desk: 'linen', fold, receiver: receiver.trim() || null },
        }),
      });
      const href = `${window.location.origin}/linen/${id}`;
      setLink(href);
      setStatus('folded. the Discord card reads the receiver and the note.');
      navigate('linen', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not press that');
    } finally {
      setBusy(false);
    }
  }

  const preview = opened?.mime?.startsWith('image/') ? opened.file_url : '';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24 apple-in">
        <p className="text-[12px] uppercase tracking-[0.16em] text-white/40">linen press</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Fold a file for someone.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
          Not a cabinet. A press: one local file, a fold, and a name on the outside. The file lands in storage and a row in linen_press. Vault, courier, and keepsake stay as they were.
        </p>

        {opened && (
          <section className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs text-white/40">{opened.fold || 'plain'} fold{opened.receiver ? ` for ${opened.receiver}` : ''}</p>
            <h2 className="text-xl text-white mt-1">{opened.name}</h2>
            <p className="text-sm text-neutral-400 mt-1">{pretty(Number(opened.size) || 0)}{opened.author ? ` · ${opened.author}` : ''}</p>
            {opened.note && <p className="text-sm text-neutral-300 mt-3 leading-relaxed">{opened.note}</p>}
            {preview && <img src={preview} alt="" className="mt-4 rounded-2xl max-h-72 object-cover" />}
            <a href={opened.file_url} className="inline-flex mt-4 text-sm px-4 py-2 rounded-full bg-white text-black" download>download</a>
          </section>
        )}

        <section className="glass apple-card rounded-3xl p-6 mt-8">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:bg-white/[0.05] transition">
            <input type="file" className="hidden" onChange={(e) => take(e.target.files?.[0] || null)} />
            <span className="text-white">{file ? file.name : 'choose the file to fold'}</span>
            <span className="block text-xs text-neutral-500 mt-2">{file ? pretty(file.size) : 'no size cap. a warning only if it may feel slow.'}</span>
          </label>
          {warn && <p className="text-sm text-amber-200/90 mt-3">{warn}</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            {FOLDS.map((item) => (
              <button key={item} type="button" onClick={() => setFold(item)} className={`text-[13px] px-3 py-1.5 rounded-full transition ${fold === item ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>{item}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="who it is for" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from, optional" className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line to sit on the outside of the fold" className="mt-3 w-full min-h-24 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          <button onClick={press} disabled={!file || busy} className="mt-4 text-sm font-medium px-4 py-2.5 rounded-full bg-white text-black disabled:opacity-40 active:scale-[0.98] transition">{busy ? 'pressing…' : 'press and share'}</button>
          <p className="text-sm text-neutral-400 mt-3">{status}</p>
          {link && <a className="block text-sm text-white mt-2 break-all" href={link}>{link}</a>}
        </section>

        <section className="mt-10">
          <h2 className="text-sm text-white/50 mb-3">recent folds</h2>
          <div className="space-y-2">
            {recent.map((row) => (
              <button key={row.id} onClick={() => navigate('linen', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 lift">
                <span className="text-white text-sm">{row.name}</span>
                <span className="block text-xs text-neutral-500">{row.fold || 'plain'}{row.receiver ? ` for ${row.receiver}` : ''} · {pretty(Number(row.size) || 0)}</span>
              </button>
            ))}
            {!recent.length && <p className="text-sm text-neutral-500">the press is empty.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
