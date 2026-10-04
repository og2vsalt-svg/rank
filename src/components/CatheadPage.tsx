import { useEffect, useState } from 'react';
import Navbar from './Navbar';

type LinkRow = {
  id: string;
  url: string;
  note: string | null;
  author: string | null;
  created_at?: string;
};

export default function CatheadPage() {
  const [url, setUrl] = useState('https://');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState('');

  async function load() {
    const res = await fetch('/api/cathead');
    const data = await res.json();
    setLinks(Array.isArray(data.links) ? data.links : []);
  }

  useEffect(() => {
    load().catch(() => setLinks([]));
  }, []);

  async function pin() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/cathead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, note, author }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not pin');
      setMade(data.embedPath || '');
      setNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not pin');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <p className="text-[12px] tracking-[0.16em] uppercase text-white/40">cathead</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">An address, not a file.</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/60 max-w-xl">
          Pin a link on the spar. It goes into the links table. Paste /cathead in Discord for a card. Files still live on gammon, davits, and the older desks.
        </p>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <label className="text-[13px] text-white/50">Address
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-[#64D2FF]" />
          </label>
          <label className="mt-3 block text-[13px] text-white/50">Note
            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-[#64D2FF]" placeholder="why this address is here" />
          </label>
          <label className="mt-3 block text-[13px] text-white/50">Name
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-[#64D2FF]" placeholder="optional" />
          </label>
          {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
          <button disabled={busy} onClick={pin} className="mt-4 rounded-full bg-white text-black px-4 py-2 text-[13px] font-medium disabled:opacity-40 transition hover:bg-neutral-200">
            {busy ? 'Pinning…' : 'Pin address'}
          </button>
          {made && <p className="mt-3 text-[13px] text-white/55">Discord link: {made}</p>}
        </section>

        <ul className="mt-8 divide-y divide-white/5 rounded-2xl border border-white/10">
          {links.length === 0 && <li className="px-4 py-4 text-[14px] text-white/40">No addresses pinned yet.</li>}
          {links.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <a href={item.url} className="text-[14px] text-[#64D2FF] break-all">{item.note || item.url}</a>
              <p className="text-[12px] text-white/40 mt-1 break-all">{item.url}{item.author ? ` · ${item.author}` : ''}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
