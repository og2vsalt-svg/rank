import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Turn = {
  id: string;
  share_id: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  sha256: string | null;
  hauled_by: string | null;
  for_whom: string | null;
  note: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function fingerprint(file: File) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function WindlassPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [hauledBy, setHauledBy] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [note, setNote] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [open, setOpen] = useState<Turn | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const warn = useMemo(() => (file && file.size > 12 * 1024 * 1024 ? 'This drop is large. The page will not refuse it, but the upload may feel slow.' : ''), [file]);

  async function load() {
    const r = await fetch('/api/windlass');
    if (!r.ok) return;
    const data = await r.json();
    setTurns(Array.isArray(data.turns) ? data.turns : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/windlass?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setOpen(data.turn || null))
      .catch(() => {});
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr('choose a local file first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const sha = await fingerprint(file);
      const body = new FormData();
      body.set('file', file);
      body.set('author', hauledBy);
      body.set('caption', note || `hauled for ${forWhom || 'the desk'}`);
      body.set('cardTitle', file.name);
      const share = await fetch('/api/share', { method: 'POST', body });
      const shared = await share.json().catch(() => ({}));
      if (!share.ok) throw new Error(shared.error || 'share table did not take the file');
      const slip = await fetch('/api/windlass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shared.id,
          share_id: shared.id,
          file_name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          sha256: sha,
          hauled_by: hauledBy,
          for_whom: forWhom,
          note,
        }),
      });
      const saved = await slip.json().catch(() => ({}));
      if (!slip.ok) throw new Error(saved.error || 'haul note was not saved');
      setFile(null);
      setNote('');
      setOpen(saved.turn || null);
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'haul failed');
    } finally {
      setBusy(false);
    }
  }

  async function copy(path: string) {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(path);
    window.setTimeout(() => setCopied(''), 1400);
  }

  const shown = open ? [open, ...turns.filter((t) => t.id !== open.id)] : turns;

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24 apple-in">
        <p className="text-[13px] tracking-[0.16em] uppercase text-[#8e8e93]">windlass</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Haul a file, keep the turn.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">
          A local file lands in the share table. The haul note lives beside it: who turned, who it is for, and a fingerprint. Not another drawer.
        </p>
        <form onSubmit={onSubmit} className="mt-8 apple-card rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center cursor-pointer hover:border-[#0a84ff]/60 transition-colors duration-200">
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-[#d1d1d6]">{file ? file.name : 'Choose a file from this machine'}</span>
            {file ? <span className="block mt-1 text-xs text-[#8e8e93]">{pretty(file.size)}</span> : null}
          </label>
          {warn ? <p className="text-sm text-[#ffd60a]">{warn}</p> : null}
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={hauledBy} onChange={(e) => setHauledBy(e.target.value)} placeholder="hauled by" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
            <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="for" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="what the turn was for" className="w-full min-h-24 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
          {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 transition-transform duration-200 active:scale-[0.98]">
            {busy ? 'Hauling…' : 'Haul file'}
          </button>
        </form>
        <ul className="mt-8 space-y-2">
          {shown.map((turn) => (
            <li key={turn.id} className="apple-card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{turn.file_name}</p>
                  <p className="mt-1 text-sm text-[#a1a1aa]">
                    {pretty(Number(turn.size) || 0)}
                    {turn.hauled_by ? ` · ${turn.hauled_by}` : ''}
                    {turn.for_whom ? ` → ${turn.for_whom}` : ''}
                  </p>
                  {turn.note ? <p className="mt-1 text-sm text-[#d1d1d6]">{turn.note}</p> : null}
                  {turn.sha256 ? <p className="mt-1 text-[12px] text-[#8e8e93] break-all">{turn.sha256}</p> : null}
                </div>
                <button onClick={() => copy(`/windlass/${turn.id}`)} className="shrink-0 text-[12px] text-[#64d2ff]">
                  {copied === `/windlass/${turn.id}` ? 'copied' : 'copy card'}
                </button>
              </div>
              {turn.share_id ? (
                <a className="mt-2 inline-block text-sm text-[#64d2ff]" href={`/s/${turn.share_id}`}>open the file</a>
              ) : null}
            </li>
          ))}
          {!shown.length ? <li className="text-sm text-[#8e8e93]">No turns yet.</li> : null}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
