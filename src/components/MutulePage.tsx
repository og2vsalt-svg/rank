import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Mutule = {
  id: string;
  board: string;
  slot_a: string | null;
  slot_b: string | null;
  slot_c: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  share_id: string | null;
  author: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function MutulePage() {
  const { shareId } = useRouter();
  const [board, setBoard] = useState('');
  const [slotA, setSlotA] = useState('');
  const [slotB, setSlotB] = useState('');
  const [slotC, setSlotC] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [rows, setRows] = useState<Mutule[]>([]);
  const [focus, setFocus] = useState<Mutule | null>(null);
  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'This one is large. The tab may feel slow while it sends. Nothing is refused.' : null),
    [file],
  );

  async function load() {
    const res = await fetch(`${SB_URL}/rest/v1/mutules?select=*&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as Mutule[];
    setRows(Array.isArray(data) ? data : []);
    if (shareId) setFocus((Array.isArray(data) ? data : []).find((r) => r.id === shareId) || null);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [shareId]);

  async function hang() {
    setErr(null);
    setLink(null);
    if (!board.trim()) {
      setErr('Name the board.');
      return;
    }
    if (![slotA, slotB, slotC].some((s) => s.trim())) {
      setErr('Fill at least one slot.');
      return;
    }
    setBusy(true);
    try {
      let shareIdOut: string | null = null;
      let fileUrl: string | null = null;
      let mime: string | null = null;
      let size = 0;
      let fileName: string | null = null;
      if (file) {
        const published = await publishLocalFile(file, {
          caption: [slotA, slotB, slotC].filter((s) => s.trim()).join(' · '),
          author: author.trim() || undefined,
          cardTitle: board.trim(),
          color: '#FFD60A',
          meta: { desk: 'mutule' },
        });
        if (!published.ok || !published.id) {
          setErr(published.error || 'The share table did not take the file.');
          return;
        }
        shareIdOut = published.id;
        fileUrl = published.url || null;
        mime = file.type || 'application/octet-stream';
        size = file.size;
        fileName = file.name;
      }
      const id = shareIdOut || Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const row = {
        id,
        board: board.trim(),
        slot_a: slotA.trim() || null,
        slot_b: slotB.trim() || null,
        slot_c: slotC.trim() || null,
        file_name: fileName,
        mime,
        size,
        file_url: fileUrl,
        share_id: shareIdOut,
        author: author.trim() || null,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/mutules`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!ins.ok) {
        setErr(`mutules ${ins.status}: ${(await ins.text()).slice(0, 160)}`);
        return;
      }
      setLink(`${location.origin}/mutule/${id}`);
      setBoard('');
      setSlotA('');
      setSlotB('');
      setSlotC('');
      setFile(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">rankvault · hanging board</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight" style={{ animation: 'mutuleIn .7s cubic-bezier(.2,.8,.2,1) both' }}>
          mutule
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Three short slots, not a cabinet. Hang an optional local file under the board. Discord unfurls the link. Large drops are warned, never refused.
        </p>
        <style>{`@keyframes mutuleIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`}</style>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <label className="block text-sm text-white/70">
            board
            <input value={board} onChange={(e) => setBoard(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#FFD60A]" placeholder="friday handoff" />
          </label>
          <div className="mt-3 grid gap-3">
            {[['slot a', slotA, setSlotA], ['slot b', slotB, setSlotB], ['slot c', slotC, setSlotC]].map(([label, value, setter]) => (
              <label key={String(label)} className="block text-sm text-white/70">
                {label as string}
                <input value={value as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#FFD60A]" />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-sm text-white/70">
            signed
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#FFD60A]" placeholder="optional" />
          </label>
          <label className="mt-3 block text-sm text-white/70">
            optional local file
            <input type="file" className="mt-1 block w-full text-sm text-white/70" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {file && <p className="mt-2 text-xs text-white/45">{file.name} · {pretty(file.size)}</p>}
          {slow && <p className="mt-2 text-sm text-amber-300/90">{slow}</p>}
          {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
          <button type="button" disabled={busy} onClick={hang} className="mt-4 rounded-full bg-[#FFD60A] px-5 py-2 text-sm font-medium text-black transition duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
            {busy ? 'hanging…' : 'hang the board'}
          </button>
          {link && (
            <p className="mt-3 text-sm text-white/70">
              card link <a className="text-[#FFD60A] underline" href={link}>{link}</a>
            </p>
          )}
        </section>

        {focus && (
          <article className="mt-6 rounded-3xl border border-[#FFD60A]/30 bg-[#FFD60A]/10 p-5">
            <h2 className="text-xl font-medium">{focus.board}</h2>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {[focus.slot_a, focus.slot_b, focus.slot_c].filter(Boolean).map((slot) => <li key={slot}>{slot}</li>)}
            </ul>
            {focus.file_url && <a className="mt-2 inline-block text-sm text-[#FFD60A]" href={focus.file_url}>open {focus.file_name || 'file'}</a>}
          </article>
        )}

        <ul className="mt-8 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition duration-300 hover:-translate-y-0.5">
              <a href={`/mutule/${row.id}`} className="font-medium">{row.board}</a>
              <p className="text-sm text-white/50">{[row.slot_a, row.slot_b, row.slot_c].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
