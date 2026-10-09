import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;
const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2'];

type Row = {
  id: string;
  recipient: string;
  phrase: string;
  accent?: string | null;
  share_id?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  created_at?: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}
function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function ReticulePage() {
  const { shareId, navigate } = useRouter();
  const [recipient, setRecipient] = useState('');
  const [phrase, setPhrase] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let gone = false;
    fetch(`${SB_URL}/rest/v1/reticules?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => { if (!gone) setRow(Array.isArray(rows) && rows[0] ? rows[0] : null); })
      .catch(() => { if (!gone) setRow(null); });
    return () => { gone = true; };
  }, [shareId]);

  const onPick = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setWarn(next && next.size > SLOW ? 'This one is large. Nothing is blocked — the send may just feel slow.' : '');
  };

  const fileLink = () => {
    if (!row?.id) return '';
    return `${window.location.origin}/reticule/${row.id}`;
  };

  const send = async () => {
    if (!file) { setErr('Choose a file from this computer first.'); return; }
    setBusy(true);
    setErr('');
    try {
      const published = await publishLocalFile(file, {
        caption: phrase || `for ${recipient || 'someone'}`,
        author: recipient || undefined,
        color: accent,
        cardTitle: recipient ? `reticule for ${recipient}` : file.name,
        meta: { desk: 'reticule', phrase, recipient },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'the share table did not take the file');
      const id = published.id;
      const body = {
        id,
        recipient: recipient.trim() || 'unnamed',
        phrase: phrase.trim(),
        accent,
        share_id: id,
        file_name: file.name,
        file_url: published.url,
        mime: file.type || 'application/octet-stream',
        size: file.size,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/reticules`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      if (!ins.ok) {
        const text = await ins.text();
        throw new Error(text.slice(0, 180) || 'reticule row failed');
      }
      const made = await ins.json();
      setRow(Array.isArray(made) ? made[0] : body);
      navigate('reticule', id);
    } catch (e: any) {
      setErr(e?.message || 'could not file the reticule');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-500 mb-3">drawstring handoff</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">Reticule</h1>
          <p className="text-neutral-400 max-w-xl mb-8 leading-relaxed">
            A small bag, not a vault drawer. One local file goes into the share database, with a name and a line to bring back. Older desks stay put.
          </p>
        </motion.div>

        {row ? (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">filed for</p>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">{row.recipient}</h2>
            {row.phrase && <p className="text-neutral-300 mb-5 leading-relaxed">{row.phrase}</p>}
            <div className="flex items-center justify-between gap-3 py-3 border-t border-white/10">
              <div>
                <p className="font-medium">{row.file_name || 'file'}</p>
                <p className="text-sm text-neutral-500">{pretty(Number(row.size) || 0)}</p>
              </div>
              {row.file_url && (
                <a href={row.file_url} className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium" download>
                  Download
                </a>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
                onClick={() => { navigator.clipboard.writeText(fileLink()); setCopied(true); }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => navigate('drawstring')}>Open the board</button>
            </div>
            <p className="text-xs text-neutral-500 mt-4">Discord reads this link as a card. Large files were never refused.</p>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8">
            <label className="block text-sm text-neutral-400 mb-2">Who is it for</label>
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="a name" className="w-full bg-white/5 rounded-2xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-white/20" />
            <label className="block text-sm text-neutral-400 mb-2">Line to bring back</label>
            <textarea value={phrase} onChange={(e) => setPhrase(e.target.value)} rows={3} placeholder="leave this on the table" className="w-full bg-white/5 rounded-2xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-white/20" />
            <div className="flex gap-2 mb-5">
              {ACCENTS.map((c) => (
                <button key={c} aria-label={c} onClick={() => setAccent(c)} className="h-7 w-7 rounded-full" style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center cursor-pointer hover:bg-white/5 transition-colors">
              <input type="file" className="hidden" onChange={(e) => onPick(e.target.files)} />
              <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'Drop a file from this computer'}</span>
            </label>
            {warn && <p className="text-sm text-amber-300 mt-3">{warn}</p>}
            {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
            <button disabled={busy} onClick={send} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50">
              {busy ? 'Filing…' : 'File the reticule'}
            </button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
