import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function StillpointPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const handleFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    setWarn(arr.some(f => f.size > 45 * 1024 * 1024) ? 'large file detected. upload may feel slower in the browser. never refused.' : '');
  };

  const publish = async () => {
    if (!files.length) return setErr('select files to share');
    setBusy(true);
    setErr('');
    const created: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || 'stillpoint share',
        cardTitle: file.name,
        meta: { desk: 'stillpoint' },
      });
      if (res.ok && res.id) created.push(shareUrls(res.id).app);
      else setErr(res.error || 'issue with a file');
    }
    setLinks(created);
    if (created[0]) try { await navigator.clipboard.writeText(created[0]); } catch {}
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          className="glass rounded-[28px] p-8"
        >
          <p className="text-neutral-400 text-sm mb-2 tracking-wide">stillpoint</p>
          <h1 className="text-2xl font-semibold mb-3 tracking-tight">a quiet place to set something down.</h1>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Simple multi-file drop with one shared note. Minimal glass, soft spring motion, polished Discord embeds. Files land in the database. Large files warned, never refused. All earlier desks stay intact.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet note"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/10 hover:border-white/30 p-12 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="text-sm text-neutral-400">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'drop here'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full mt-5 py-3 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition"
          >
            {busy ? 'sharing…' : 'set down'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-500 break-all space-y-1">
              {links.map((l, i) => <div key={i}>{l}</div>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
