import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

type Pin = { id: string; url: string; note: string | null; author: string | null; created_at: string };

export default function PinboardPage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [pins, setPins] = useState<Pin[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/pinboard');
    if (!r.ok) return;
    const data = await r.json();
    setPins(Array.isArray(data.pins) ? data.pins : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/pinboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, note }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'could not pin that');
      setUrl('');
      setNote('');
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'pin failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 apple-in">
        <p className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">pinboard</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">A board for links, not files.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">
          Pin a URL with a short note. It lands in the links table. Share pages still live on larder.
        </p>
        <form onSubmit={onSubmit} className="mt-8 apple-card rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={180}
            placeholder="why it is here"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]"
          />
          {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60">
            {busy ? 'Pinning…' : 'Pin link'}
          </button>
        </form>
        <ul className="mt-8 space-y-2">
          {pins.map((pin) => (
            <li key={pin.id} className="apple-card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <a href={pin.url} className="break-all text-[#64d2ff]" target="_blank" rel="noreferrer">{pin.url}</a>
              {pin.note ? <p className="mt-1 text-sm text-[#d1d1d6]">{pin.note}</p> : null}
            </li>
          ))}
          {!pins.length ? <li className="text-sm text-[#8e8e93]">No pins yet.</li> : null}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
