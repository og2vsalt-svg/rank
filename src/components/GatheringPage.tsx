import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type Piece = { name: string; size: number; id: string; url: string };

export default function GatheringPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('several local files, one gathering. each file lands in the share table. no size cap.');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);

  const total = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  function pick(list: FileList | null) {
    const next = Array.from(list || []);
    setFiles(next);
    setLink('');
    setPieces([]);
    if (next.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024) {
      setWarn('this gathering is heavy. sending may feel slow. nothing is refused.');
    } else setWarn('');
  }

  async function bind() {
    if (!files.length || busy) return;
    setBusy(true);
    const stored: Piece[] = [];
    try {
      for (const file of files) {
        setStatus(`sending ${file.name}...`);
        const result = await publishLocalFile(file, {
          caption: note.trim() || title.trim() || 'gathering piece',
          author: 'gathering',
          cardTitle: file.name,
          color: 'gathering',
        });
        if (!result.ok || !result.id || !result.url) {
          setStatus(result.error || `the share table refused ${file.name}.`);
          return;
        }
        stored.push({ name: file.name, size: file.size, id: result.id, url: result.url });
        setPieces([...stored]);
      }
      const manifest = { title: title.trim() || 'untitled gathering', note: note.trim(), pieces: stored };
      const blob = new File([JSON.stringify(manifest, null, 2)], 'gathering.json', { type: 'application/json' });
      setStatus('writing the gathering row...');
      const head = await publishLocalFile(blob, {
        caption: `${manifest.title} · ${stored.length} files`,
        author: 'gathering',
        cardTitle: manifest.title,
        color: 'gathering',
      });
      if (!head.ok || !head.id) {
        setStatus(head.error || 'pieces landed, but the gathering row did not.');
        return;
      }
      const card = `${location.origin}/gathering/${head.id}`;
      setLink(card);
      setStatus(head.warn || 'gathered. paste the link in Discord for the card.');
      navigate('gathering', head.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/40 mb-3">rankvault · gathering</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">several sheets, one signature</h1>
          <p className="mt-4 text-neutral-400 max-w-xl">pick more than one local file. each lands in the share table, then a gathering row ties them. older desks stay. large packets are warned, never refused.</p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center cursor-pointer hover:border-white/30 transition">
            <input type="file" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
            <span className="text-sm text-white/80">{files.length ? `${files.length} files · ${pretty(total)}` : 'choose local files'}</span>
            <span className="block mt-1 text-xs text-white/40">no cap, only a slowness note</span>
          </label>
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {!!files.length && (
            <ul className="mt-4 space-y-2">
              {files.map((file) => (
                <li key={file.name + file.size} className="flex justify-between text-sm text-white/70 border-b border-white/5 py-2">
                  <span className="truncate pr-3">{file.name}</span>
                  <span className="text-white/35">{pretty(file.size)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="gathering title" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the packet" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30" />
          </div>
          <button onClick={bind} disabled={!files.length || busy} className="mt-5 inline-flex px-5 py-2.5 rounded-full bg-[#0a84ff] text-white text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'gathering...' : 'file the gathering'}
          </button>
          <p className="mt-4 text-sm text-white/50">{status}</p>
          {link && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <code className="text-xs text-[#9ecbff] break-all">{link}</code>
              <button onClick={() => navigator.clipboard.writeText(link)} className="text-xs px-3 py-1.5 rounded-full bg-white/10">copy</button>
            </div>
          )}
          {!!pieces.length && (
            <div className="mt-5 space-y-2">
              {pieces.map((piece) => (
                <a key={piece.id} href={piece.url} className="block text-sm text-[#9ecbff]" target="_blank" rel="noreferrer">{piece.name}</a>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
