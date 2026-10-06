import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function hexPreview(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf).slice(0, 16);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
}

function sniff(bytes: Uint8Array, name: string, mime: string) {
  const sig = [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (sig.startsWith('89504e47')) return 'png';
  if (sig.startsWith('ffd8ff')) return 'jpeg';
  if (sig.startsWith('25504446')) return 'pdf';
  if (sig.startsWith('504b0304')) return 'zip-family';
  if (sig.startsWith('1f8b')) return 'gzip';
  if (sig.startsWith('494433') || sig.startsWith('fffb')) return 'audio';
  if (name.endsWith('.md') || mime.startsWith('text/')) return 'text';
  return mime.split('/')[0] || 'file';
}

type Turn = {
  id: string;
  share_id: string | null;
  file_name: string;
  size: number;
  hauled_by: string | null;
  for_whom: string | null;
  note: string | null;
};

export default function WindlassPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hex, setHex] = useState('');
  const [kind, setKind] = useState('');
  const [warn, setWarn] = useState('');
  const [caption, setCaption] = useState('');
  const [hauledBy, setHauledBy] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);

  const sizeLabel = useMemo(() => {
    if (!file) return '';
    if (file.size < 1024) return `${file.size} B`;
    if (file.size < 1024 * 1024) return `${Math.round(file.size / 1024)} KB`;
    return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  }, [file]);

  useEffect(() => {
    fetch('/api/windlass')
      .then((r) => r.json())
      .then((data) => setTurns(Array.isArray(data.turns) ? data.turns : []))
      .catch(() => {});
  }, []);

  const read = async (next: File | null) => {
    setErr('');
    setCard('');
    setFile(next);
    if (!next) return;
    setWarn(next.size > 25 * 1024 * 1024 ? 'chunky file. the tab may pause while it reads the head. nothing is refused.' : '');
    const head = await next.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(head);
    setHex(hexPreview(head));
    setKind(sniff(bytes, next.name.toLowerCase(), next.type || 'application/octet-stream'));
  };

  const fileIt = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const result = await publishLocalFile(file, {
        caption: caption || `${kind} · ${sizeLabel}`,
        cardTitle: file.name,
        color: '#0A84FF',
        author: hauledBy || 'windlass',
      });
      if (!result.ok || !result.id) {
        setErr(result.error || 'the share table did not take it');
        return;
      }
      const urls = shareUrls(result.id);
      const slip = await fetch('/api/windlass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: result.id,
          share_id: result.id,
          file_name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          hauled_by: hauledBy,
          for_whom: forWhom,
          note: caption,
        }),
      });
      const saved = await slip.json().catch(() => ({}));
      if (!slip.ok) {
        setErr(saved.error || 'file landed, haul note did not');
      } else if (saved.turn) {
        setTurns((prev) => [saved.turn, ...prev.filter((t) => t.id !== saved.turn.id)]);
      }
      setCard(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (result.warn) setWarn(result.warn);
    } catch (e: any) {
      setErr(e?.message || 'file failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">windlass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the head, then file it.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a cabinet. the first sixteen bytes stay in the tab. filing writes the local file into the share table, keeps who turned the windlass, and hands Discord a card.</p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); read(e.dataTransfer.files?.[0] || null); }}
          >
            <input type="file" className="hidden" onChange={(e) => read(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'drop one local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size cap. a warning only if the read may feel slow.</p>
          </label>
          {file && (
            <div className="mt-6 space-y-3 text-sm">
              <p className="text-neutral-300">{kind} · {sizeLabel} · {file.type || 'unknown type'}</p>
              <p className="font-mono text-xs text-neutral-500 break-all">{hex || '—'}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={hauledBy} onChange={(e) => setHauledBy(e.target.value)} placeholder="hauled by" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
                <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="for" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
              </div>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="card line for Discord" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
              <button onClick={fileIt} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform">{busy ? 'filing…' : 'file into the share table'}</button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied: {card}</p>}
        </motion.div>
        {turns.length > 0 && (
          <ul className="mt-4 space-y-2">
            {turns.slice(0, 8).map((turn) => (
              <li key={turn.id} className="glass rounded-2xl px-4 py-3 text-sm">
                <p className="text-white">{turn.file_name}</p>
                <p className="text-neutral-500 mt-1">{turn.hauled_by || 'windlass'}{turn.for_whom ? ` → ${turn.for_whom}` : ''}{turn.note ? ` · ${turn.note}` : ''}</p>
                {turn.share_id ? <a className="text-[#64d2ff] text-xs" href={`/s/${turn.share_id}`}>open file</a> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
