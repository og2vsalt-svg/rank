import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile, shareUrls, type CloudMeta } from '../lib/cloudShare';

const HOURS = [6, 24, 72, 168];

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function leftLabel(iso?: string | null) {
  if (!iso) return 'no fade set';
  const ms = +new Date(iso) - Date.now();
  if (ms <= 0) return 'this wick has gone out';
  const h = Math.floor(ms / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  if (h >= 48) return `${Math.round(h / 24)} days left`;
  if (h >= 1) return `${h}h ${m}m left`;
  return `${Math.max(1, m)}m left`;
}

export default function WickPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [made, setMade] = useState<{ app: string; card: string } | null>(null);
  const [opened, setOpened] = useState<CloudMeta | null>(null);
  const [tick, setTick] = useState(0);

  const slow = useMemo(() => !!file && file.size > 12 * 1024 * 1024, [file]);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    fetchShare(shareId).then((row) => {
      if (!stop) setOpened(row);
    });
    return () => {
      stop = true;
    };
  }, [shareId]);

  useEffect(() => {
    if (!opened?.expiresAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, [opened?.expiresAt]);

  async function send() {
    setErr('');
    setWarn('');
    if (!file) return setErr('choose a local file first');
    setBusy(true);
    try {
      const expiresAt = new Date(Date.now() + hours * 36e5).toISOString();
      const pub = await publishLocalFile(file, {
        caption: note.trim(),
        author: author.trim(),
        expiresAt,
        color: '#FF9F0A',
        cardTitle: file.name,
      });
      if (!pub.ok || !pub.id) throw new Error(pub.error || 'share failed');
      if (pub.warn) setWarn(pub.warn);
      const app = `${location.origin}/wick/${pub.id}`;
      setMade({ app, card: shareUrls(pub.id).embed });
      try {
        await navigator.clipboard.writeText(app);
      } catch {
        /* clipboard is optional */
      }
    } catch (e: any) {
      setErr(e?.message || 'could not light the wick');
    } finally {
      setBusy(false);
    }
  }

  const faded = opened?.expiresAt ? +new Date(opened.expiresAt) < Date.now() : false;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#ff9f0a] mb-2">wick</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a file that fades</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Attach something from this machine and pick how long the link should stay warm. The bytes land in the share table, then the row expires. Discord unfurls /wick. Large drops are warned, never refused. This is not a vault drawer.
          </p>
        </motion.div>

        {shareId && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-6">
            {!opened && <p className="text-sm text-neutral-400">looking up that wick…</p>}
            {opened && faded && <p className="text-sm text-neutral-300">this one has gone out. the share row is past its fade.</p>}
            {opened && !faded && (
              <>
                <p className="text-xs text-neutral-500 mb-1" data-tick={tick}>{leftLabel(opened.expiresAt)}</p>
                <h2 className="text-white font-medium mb-1">{opened.name}</h2>
                <p className="text-xs text-neutral-500 mb-3">{prettySize(opened.size)} · {opened.author || 'unsigned'}</p>
                {opened.caption && <p className="text-sm text-neutral-300 whitespace-pre-wrap mb-4">{opened.caption}</p>}
                {opened.url && (
                  <a className="inline-flex text-sm text-[#ffd60a]" href={opened.url} rel="noreferrer">open the file</a>
                )}
              </>
            )}
            {shareId && !opened && <p className="text-xs text-neutral-500 mt-2">if this stays empty, the wick may already have faded.</p>}
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30 transition-colors duration-200">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'choose a local file'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{prettySize(file.size)}</span>}
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {HOURS.map((h) => (
              <button key={h} type="button" onClick={() => setHours(h)} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${hours === h ? 'bg-white text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'}`}>
                {h < 48 ? `${h}h` : `${h / 24}d`}
              </button>
            ))}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} placeholder="a line beside the file, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-24 mb-3" />
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4" />
          {slow && <p className="text-xs text-amber-300 mb-3">this one is large. sending may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-300 mb-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {made && (
            <div className="text-xs text-neutral-300 mb-3 space-y-1">
              <p>copied the wick link</p>
              <button type="button" className="text-[#ffd60a] text-left break-all" onClick={() => navigate('wick', made.app.split('/').pop())}>{made.app}</button>
              <p className="text-neutral-500 break-all">discord card: {made.card}</p>
            </div>
          )}
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
            {busy ? 'lighting…' : 'light the wick'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
