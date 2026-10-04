import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Cable = { id: string; label: string; href: string; note: string; fileName?: string };

export default function HawserPage() {
  const { shareId } = useRouter();
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Cable | null>(null);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/share?id=${encodeURIComponent(shareId)}`).then((r) => r.json()).then((share) => {
      if (!share?.id) return;
      setRow({ id: share.id, label: share.meta?.label || share.name, href: share.meta?.href || '', note: share.caption || '', fileName: share.meta?.fileName || share.name });
    }).catch(() => setError('could not read that cable'));
  }, [shareId]);

  const send = async () => {
    if (!label.trim() || !/^https?:\/\//i.test(href.trim())) { setError('need a name and an http address'); return; }
    setBusy(true); setError(''); setWarn('');
    try {
      let data: any = {};
      if (file) {
        const body = new FormData();
        body.append('file', file, file.name);
        body.append('caption', note.trim() || label.trim());
        body.append('author', 'hawser');
        body.append('cardTitle', label.trim().slice(0, 120));
        const res = await fetch('/api/share', { method: 'POST', body });
        data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      } else {
        const slip = `hawser\n${label.trim()}\n${href.trim()}\n${note.trim()}\n`;
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${label.trim().slice(0, 80)}.txt`, type: 'text/plain', caption: note.trim() || label.trim(), cardTitle: label.trim(), author: 'hawser', dataUrl: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(slip)))}` }),
        });
        data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `share ${res.status}`);
      }
      if (data.warn) setWarn(data.warn);
      await fetch('/api/share', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.id, caption: note.trim() || href.trim(), cardTitle: label.trim(), meta: { label: label.trim(), href: href.trim(), desk: 'hawser', fileName: file?.name || '' } }) });
      setRow({ id: data.id, label: label.trim(), href: href.trim(), note: note.trim(), fileName: file?.name });
      setLabel(''); setHref(''); setNote(''); setFile(null);
      history.pushState(null, '', `/hawser/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the cable did not take');
    } finally { setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(value); } };
  const card = row ? `${location.origin}/hawser/${row.id}` : '';
  const slow = !!file && file.size > 12 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">hawser</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">tie an address to a cable.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">a short link with an optional local file. the row lands in the share table, not the vault grid. paste /hawser in Discord.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="cable name" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="https:// where it leads" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why it is tied" maxLength={280} rows={3} className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50 resize-none" />
          <label className="mt-3 block text-xs text-neutral-500">local file, optional<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:text-black" /></label>
          {slow && <p className="mt-3 text-xs text-amber-200/90">large drop. preview may feel slow. it still goes through.</p>}
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!label.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'tying…' : 'tie the cable'}</motion.button>
        </motion.div>
        {row && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">{row.label}</p>
            {row.href && <a href={row.href} className="text-sm text-[#64d2ff] mt-1 block break-all">{row.href}</a>}
            {row.note && <p className="text-sm text-neutral-300 mt-2">{row.note}</p>}
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              <a href={`/s/${row.id}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open file card</a>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
