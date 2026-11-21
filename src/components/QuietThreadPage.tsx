import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietThreadPage() {
  const [notes, setNotes] = useState<string[]>(['']);
  const [files, setFiles] = useState<(File | null)[]>([null]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const addNote = () => {
    setNotes((n) => [...n, '']);
    setFiles((f) => [...f, null]);
  };

  const updateNote = (i: number, val: string) => {
    setNotes((n) => n.map((x, idx) => (idx === i ? val : x)));
  };

  const onFile = (i: number, list: FileList | null) => {
    const f = list?.[0] || null;
    setFiles((prev) => prev.map((x, idx) => (idx === i ? f : x)));
    if (f && f.size > 40 * 1024 * 1024) setWarn('large attachment. browser may slow. no hard limit.');
  };

  const publish = async () => {
    const valid = notes.map((n, i) => ({ note: n.trim(), file: files[i] })).filter((x) => x.note || x.file);
    if (!valid.length) {
      setErr('add a note or file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const item of valid) {
        let res;
        if (item.file) {
          res = await publishLocalFile(item.file, {
            caption: item.note || 'quiet thread',
            cardTitle: item.file.name,
            meta: { desk: 'quietthread' },
          });
        } else {
          const blob = new Blob([item.note], { type: 'text/plain' });
          const file = new File([blob], 'note.txt', { type: 'text/plain' });
          res = await publishLocalFile(file, {
            caption: item.note,
            cardTitle: 'thread note',
            meta: { desk: 'quietthread' },
          });
        }
        if (res.ok && res.id) {
          newLinks.push(shareUrls(res.id).app);
          if (res.warn) setWarn(res.warn);
        } else {
          setErr(res.error || 'publish failed');
        }
      }
      setLinks(newLinks);
      if (newLinks.length) {
        try {
          await navigator.clipboard.writeText(newLinks.join('\n'));
        } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">quietthread</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet thread of notes and files.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Add notes. Attach local files if you like. Each becomes its own share with a polished Discord embed. Soft size warnings only.
          </p>
          {notes.map((note, i) => (
            <div key={i} className="mb-4 space-y-2">
              <textarea
                value={note}
                onChange={(e) => updateNote(i, e.target.value)}
                placeholder={`note ${i + 1}`}
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
              />
              <label className="block cursor-pointer text-xs text-neutral-400">
                <input type="file" className="hidden" onChange={(e) => onFile(i, e.target.files)} />
                {files[i] ? files[i]!.name : 'optional file attachment'}
              </label>
            </div>
          ))}
          <button onClick={addNote} className="text-xs text-[#0A84FF] mb-4 hover:underline">
            + add another
          </button>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'threading…' : 'publish thread'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>copied links:</p>
              {links.map((l, i) => (
                <div key={i} className="break-all">
                  {l}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
