import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function ScriptoriumPage() {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState<{id: string; url: string} | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setWarn(f.size > 50 * 1024 * 1024 ? 'Large attachment — it will upload, but the browser may feel slow.' : '');
  };

  const save = async () => {
    if (!note.trim() && !file) return;
    setBusy(true);
    let id = '';
    if (file) {
      const res = await publishLocalFile(file, { caption: note.slice(0, 200), cardTitle: 'scriptorium note' });
      if (res.ok && res.id) id = res.id;
    }
    // For pure notes we could post to a notes table, but for now share if file or just local
    setBusy(false);
    if (id) {
      setShare({ id, url: shareUrls(id).embed });
    } else {
      setShare({ id: 'local', url: window.location.origin + '/scriptorium' });
    }
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0A84FF] text-sm font-medium mb-3 tracking-wide">scriptorium</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">write freely.<br />attach if it helps.</h1>
          <p className="text-neutral-400 text-lg mb-10">A quiet desk for notes. Optional local file lands in the share table with a Discord card. No size limits, only a gentle warning. Older vaults stay untouched.</p>
        </motion.div>

        <div className="space-y-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="the thought, the margin, the thing you wanted to keep…"
            rows={8}
            className="w-full bg-white/[0.04] border border-white/10 rounded-3xl px-5 py-4 text-sm focus:outline-none focus:border-[#0A84FF]/40 transition resize-y"
          />

          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center cursor-pointer hover:border-white/25 transition"
          >
            <p className="text-sm">{file ? file.name : 'optional attachment'}</p>
            <p className="text-xs text-neutral-500 mt-1">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'any file, warned if heavy'}</p>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
          </div>

          {warn && <p className="text-amber-300 text-sm text-center">{warn}</p>}

          <button
            onClick={save}
            disabled={busy || (!note.trim() && !file)}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium text-sm hover:bg-[#409CFF] active:scale-[0.98] transition disabled:opacity-40"
          >
            {busy ? 'filing…' : 'keep the note'}
          </button>

          {share && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <p className="text-sm mb-2">filed</p>
              <div className="flex gap-2">
                <input readOnly value={share.url} className="flex-1 bg-black/40 rounded-xl px-3 py-2 text-xs font-mono" />
                <button onClick={() => navigator.clipboard.writeText(share.url)} className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium">copy</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
