import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile, type CloudMeta } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type Opened = { id: string; title: string; note: string; author: string; files: CloudMeta[] };

export default function CaskPage() {
  const { shareId, navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [made, setMade] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);

  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);
  const slow = total > 12 * 1024 * 1024;

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    (async () => {
      const res = await fetch(
        `${SB_URL}/rest/v1/casks?id=eq.${encodeURIComponent(shareId)}&select=id,title,note,author,file_ids&limit=1`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
      );
      if (!res.ok || stop) return;
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row || stop) {
        if (!stop) setOpened(null);
        return;
      }
      const ids: string[] = Array.isArray(row.file_ids) ? row.file_ids : [];
      const metas = (await Promise.all(ids.map((id) => fetchShare(id)))).filter(Boolean) as CloudMeta[];
      if (!stop) {
        setOpened({
          id: row.id,
          title: row.title || 'untitled cask',
          note: row.note || '',
          author: row.author || '',
          files: metas,
        });
      }
    })();
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function send() {
    setErr('');
    setWarn('');
    setMade(null);
    if (!files.length) return setErr('choose at least one local file');
    if (!title.trim()) return setErr('give the cask a short name');
    setBusy(true);
    try {
      const ids: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setStep(`sending ${i + 1} of ${files.length}`);
        const pub = await publishLocalFile(files[i], {
          caption: note.trim(),
          author: author.trim(),
          color: '#64D2FF',
          cardTitle: files[i].name,
        });
        if (!pub.ok || !pub.id) throw new Error(pub.error || `could not store ${files[i].name}`);
        if (pub.warn) setWarn(pub.warn);
        ids.push(pub.id);
      }
      const id = uid();
      const ins = await fetch(`${SB_URL}/rest/v1/casks`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id,
          title: title.trim().slice(0, 140),
          note: note.trim() || null,
          author: author.trim() || null,
          file_ids: ids,
        }),
      });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180) || 'cask table refused the row');
      const app = `${location.origin}/cask/${id}`;
      setMade(app);
      try {
        await navigator.clipboard.writeText(app);
      } catch {
        /* clipboard is optional */
      }
    } catch (e: any) {
      setErr(e?.message || 'could not seal the cask');
    } finally {
      setBusy(false);
      setStep('');
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#64d2ff] mb-2">cask</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a bundle, not a drawer</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Drop several files from this machine. Each one lands in the share table, then a cask row keeps the list. Discord unfurls /cask. Large bundles are warned, never refused. This is not the vault.
          </p>
        </motion.div>

        {shareId && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-6">
            {!opened && <p className="text-sm text-neutral-400">looking up that cask…</p>}
            {opened && (
              <>
                <h2 className="text-white font-medium mb-1">{opened.title}</h2>
                <p className="text-xs text-neutral-500 mb-3">{opened.files.length} files · {opened.author || 'unsigned'}</p>
                {opened.note && <p className="text-sm text-neutral-300 whitespace-pre-wrap mb-4">{opened.note}</p>}
                <ul className="space-y-2">
                  {opened.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-neutral-200 truncate">{f.name}</span>
                      <a className="text-[#64d2ff] shrink-0" href={f.url} rel="noreferrer">open</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30 transition-colors duration-200">
            <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <span className="text-sm text-neutral-300">{files.length ? `${files.length} local file${files.length === 1 ? '' : 's'}` : 'choose local files'}</span>
            {!!files.length && <span className="block text-xs text-neutral-500 mt-2">{prettySize(total)}</span>}
          </label>
          {!!files.length && (
            <ul className="text-xs text-neutral-400 mb-3 space-y-1">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex justify-between gap-3"><span className="truncate">{f.name}</span><span>{prettySize(f.size)}</span></li>
              ))}
            </ul>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 140))} placeholder="name the bundle" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} placeholder="a line beside the bundle, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-24 mb-3" />
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4" />
          {slow && <p className="text-xs text-amber-300 mb-3">this bundle is large. sending may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-300 mb-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {made && (
            <div className="text-xs text-neutral-300 mb-3 space-y-1">
              <p>copied the cask link</p>
              <button type="button" className="text-[#64d2ff] text-left break-all" onClick={() => navigate('cask', made.split('/').pop())}>{made}</button>
              <p className="text-neutral-500">paste it in Discord for a card. the index lives on /stave.</p>
            </div>
          )}
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
            {busy ? step || 'sealing…' : 'seal the cask'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
