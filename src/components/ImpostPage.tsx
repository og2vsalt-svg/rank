import { useMemo, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';
import { db } from '../lib/db';

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function ImpostPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? 'This drop is large. The tab may feel slow while it sends. Nothing is refused.' : ''), [file]);

  async function seat(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError('Choose a local file first.');
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: note,
        author,
        cardTitle: title || file.name,
        meta: { desk: 'impost' },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'The file did not land.');
      const id = Math.random().toString(36).slice(2, 10);
      const saved = await fetch(db.url + '/rest/v1/impost_seats', {
        method: 'POST',
        headers: {
          apikey: db.key,
          Authorization: 'Bearer ' + db.key,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id,
          title: title || file.name,
          note: note || null,
          author: author || null,
          share_id: published.id,
          file_name: file.name,
          file_url: published.url,
          mime: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()) || 'File uploaded, seat row failed.');
      const next = window.location.origin + '/impost/' + id;
      setLink(next);
      setWarn(published.warn || slow);
      navigate('impost', id);
    } catch (err: any) {
      setError(err?.message || 'Could not seat the file.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <p className="text-[12px] tracking-[0.16em] uppercase text-white/40">not a drawer</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Impost</h1>
        <p className="mt-3 text-neutral-400 max-w-xl">Seat one local file with a short note. The bytes go to the share table. Paste the link in Discord and it unfurls as a card.</p>
        <form onSubmit={seat} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4 transition-transform duration-300">
          <label className="block text-sm text-neutral-300">
            Local file
            <input type="file" className="mt-2 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black hover:file:bg-neutral-200" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {file && <p className="text-sm text-neutral-500">{file.name} · {pretty(file.size)}</p>}
          {(slow || warn) && <p className="text-sm text-amber-300/90">{warn || slow}</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Card title" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-[#0A84FF] transition" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="A line for the person opening it" className="w-full min-h-28 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-[#0A84FF] transition" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name, optional" className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-[#0A84FF] transition" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50">{busy ? 'seating…' : 'seat the file'}</button>
        </form>
        {(link || shareId) && (
          <div className="mt-6 rounded-3xl border border-white/10 p-5">
            <p className="text-sm text-neutral-400">Discord link</p>
            <p className="mt-1 break-all text-white">{link || window.location.origin + '/impost/' + shareId}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
