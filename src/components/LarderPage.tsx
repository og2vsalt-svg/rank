import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

type ShareRow = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  caption?: string | null;
  downloads?: number;
  createdAt?: string;
};

function pretty(n: number) {
  if (!n) return '0 b';
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} mb`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} gb`;
}

export default function LarderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [made, setMade] = useState<{ id: string; path: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<ShareRow[]>([]);

  const slow = useMemo(() => (file ? file.size > 12 * 1024 * 1024 : false), [file]);

  async function load() {
    const r = await fetch('/api/share?list=1&limit=8');
    if (!r.ok) return;
    const data = await r.json();
    setRows(Array.isArray(data.shares) ? data.shares : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr('choose a file from this computer first.');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn(slow ? 'this one is large. it is not blocked, it may just take a while.' : '');
    setMade(null);
    try {
      const body = new FormData();
      body.append('file', file, file.name);
      if (caption.trim()) body.append('caption', caption.trim().slice(0, 240));
      body.append('cardTitle', file.name.slice(0, 80));
      const r = await fetch('/api/share', { method: 'POST', body });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'upload did not finish');
      setMade({ id: data.id, path: data.sharePath || `/s/${data.id}` });
      if (data.warn) setWarn(String(data.warn));
      setFile(null);
      setCaption('');
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'upload failed');
    } finally {
      setBusy(false);
    }
  }

  const link = made ? `${window.location.origin}${made.path}` : '';

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 apple-in">
        <p className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">larder</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Drop a file. Keep the link.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">
          A local file goes up to the share table and the public storage bucket. Nothing is refused for size. A big drop only gets a warning that it may crawl.
        </p>

        <form onSubmit={onSubmit} className="mt-10 apple-card rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-10 text-center cursor-pointer hover:border-[#0a84ff]/60">
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const next = e.target.files?.[0] || null;
                setFile(next);
                setWarn(next && next.size > 12 * 1024 * 1024 ? 'large file. upload is allowed, it may just feel slow.' : '');
              }}
            />
            <span className="block text-[15px] text-white">{file ? file.name : 'Choose a file from this computer'}</span>
            <span className="mt-1 block text-sm text-[#8e8e93]">{file ? pretty(file.size) : 'any type, no cap'}</span>
          </label>
          <label className="mt-4 block text-sm text-[#a1a1aa]">
            Caption for the Discord card
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={240}
              placeholder="optional, shows under the title"
              className="mt-2 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]"
            />
          </label>
          {warn ? <p className="mt-3 text-sm text-[#ffd60a]">{warn}</p> : null}
          {err ? <p className="mt-3 text-sm text-[#ff453a]">{err}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 rounded-full bg-[#0a84ff] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Upload and share'}
          </button>
          {made ? (
            <div className="mt-5 rounded-2xl bg-black/30 px-4 py-3 text-sm">
              <p className="text-[#8e8e93]">Public link, Discord will unfurl this.</p>
              <p className="mt-1 break-all text-white">{link}</p>
              <button
                type="button"
                className="mt-3 text-[#64d2ff]"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          ) : null}
        </form>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight">Recent public drops</h2>
          <ul className="mt-4 space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="apple-card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <a href={`/s/${row.id}`} className="block truncate text-white">{row.name}</a>
                  <p className="text-xs text-[#8e8e93]">{pretty(row.size)} · {row.downloads || 0} downloads</p>
                </div>
                <a href={`/s/${row.id}`} className="text-sm text-[#0a84ff] shrink-0">Open</a>
              </li>
            ))}
            {!rows.length ? <li className="text-sm text-[#8e8e93]">Nothing public yet.</li> : null}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
