import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { db } from '../lib/db';

type Slip = { id: string; body: string; author: string | null; created_at: string; kind: string | null };

export default function ReadingPage() {
  const { shareId } = useRouter();
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [slips, setSlips] = useState<Slip[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(db.url + '/rest/v1/whispers?select=id,body,author,created_at,kind&order=created_at.desc&limit=24', {
      headers: { apikey: db.key, Authorization: 'Bearer ' + db.key },
    });
    if (res.ok) setSlips(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function leave(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return setError('Write a line first.');
    if (body.trim().length > 280) return setError('Keep it under 280 characters so the card stays readable.');
    setBusy(true);
    setError('');
    const res = await fetch(db.url + '/rest/v1/whispers', {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: 'Bearer ' + db.key,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ body: body.trim(), author: author || null, kind: 'status' }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.text()) || 'Could not leave the slip.');
    const rows = await res.json();
    setBody('');
    if (rows[0]?.id) history.pushState(null, '', '/reading/' + rows[0].id);
    load();
  }

  const open = slips.find((s) => s.id === shareId);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <p className="text-[12px] tracking-[0.16em] uppercase text-white/40">reading room</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Reading</h1>
        <p className="mt-3 text-neutral-400 max-w-xl">A short slip on the table. No file drawer. Paste /reading/id in Discord and the line becomes the card.</p>
        {open && (
          <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-lg leading-relaxed">{open.body}</p>
            <p className="mt-3 text-sm text-neutral-500">{open.author || 'unsigned'} · {new Date(open.created_at).toLocaleString()}</p>
          </article>
        )}
        <form onSubmit={leave} className="mt-8 space-y-3">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Leave a line" className="w-full min-h-32 rounded-3xl bg-white/[0.03] border border-white/10 px-4 py-3 outline-none focus:border-[#0A84FF] transition" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Name, optional" className="w-full rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 outline-none focus:border-[#0A84FF] transition" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50">{busy ? 'leaving…' : 'leave the slip'}</button>
        </form>
        <div className="mt-10 space-y-3">
          {slips.map((s) => (
            <a key={s.id} href={'/reading/' + s.id} className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] transition">
              <p className="text-sm text-neutral-200">{s.body}</p>
              <p className="mt-1 text-xs text-neutral-500">{s.author || 'unsigned'}</p>
            </a>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
