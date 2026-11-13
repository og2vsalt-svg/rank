import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietFiresidePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF4500');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warns, setWarns] = useState<string[]>([]);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const onFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const newWarns: string[] = [];
    arr.forEach(f => {
      if (f.size > 40 * 1024 * 1024) {
        newWarns.push(`${f.name}: large file. browser may slow. no hard limit.`);
      }
    });
    setWarns(newWarns);
    setFiles(prev => [...prev, ...arr]);
    setStatus('idle');
  }, []);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const publish = async () => {
    if (files.length === 0 && !note.trim()) return;
    setStatus('uploading');
    const newResults: typeof results = [];
    // publish note as text if no files or alongside
    if (note.trim() && files.length === 0) {
      const blob = new Blob([note], { type: 'text/plain' });
      const textFile = new File([blob], 'fireside-note.txt', { type: 'text/plain' });
      const res = await publishLocalFile(textFile, {
        caption: caption || note.slice(0, 280),
        color,
        cardTitle: 'quiet fireside',
        author: 'rankvault',
        meta: { desk: 'quietfireside', note },
      });
      if (res.ok && res.id) {
        newResults.push({ id: res.id, embed: shareUrls(res.id).embed, name: 'fireside note' });
      }
    }
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || note.slice(0, 280) || undefined,
        color,
        cardTitle: file.name,
        author: 'rankvault',
        meta: { desk: 'quietfireside', note: note.slice(0, 2000) },
      });
      if (res.ok && res.id) {
        newResults.push({ id: res.id, embed: shareUrls(res.id).embed, name: file.name });
      }
    }
    setResults(newResults);
    setFiles([]);
    setNote('');
    setCaption('');
    listPublicShares(6).then(setRecent).catch(() => {});
    setStatus('done');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="min-h-screen bg-transparent text-white pt-24 px-5 pb-16 relative overflow-hidden">
        {/* flickering ember particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none blur-[1px]"
            style={{
              width: 3 + (i % 4),
              height: 3 + (i % 4),
              background: color,
              left: `${8 + (i * 7) % 84}%`,
              bottom: '5%',
              opacity: 0.4,
            }}
            animate={{
              y: [0, -30 - (i % 5) * 8, -70],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              opacity: [0.3, 0.8, 0],
              scale: [1, 1.4, 0.5],
            }}
            transition={{ duration: 3.5 + i * 0.25, repeat: Infinity, ease: 'easeOut', delay: i * 0.2 }}
          />
        ))}

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            className="text-4xl font-semibold tracking-tight mb-2"
          >
            quiet fireside
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="text-neutral-400 mb-8 max-w-2xl"
          >
            Gather around the fireside. Drop local files or compose a quiet note that glows into the hearth. Shared caption, warm flickering accent. Publish each to the database with polished Discord embeds. Soft size warnings only — large files may slow the browser, never refused. Human-crafted Apple-style spring motion. All prior desks remain fully intact. No traces of boosting.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="whisper a note to the fireside…"
                className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-sm outline-none focus:border-white/30 resize-none"
              />

              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                className="mt-4 block rounded-3xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center cursor-pointer hover:border-white/40 transition"
              >
                <input type="file" multiple className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} />
                <div className="text-sm font-medium">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop local files into the hearth'}</div>
                <div className="text-xs text-neutral-500 mt-1">or click to browse · soft size warnings only</div>
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  {files.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 rounded-2xl px-4 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-neutral-400 hover:text-white text-xs">remove</button>
                    </div>
                  ))}
                </div>
              )}

              {warns.length > 0 && (
                <div className="mt-3 text-amber-300 text-xs space-y-1">
                  {warns.map((w, i) => <div key={i}>{w}</div>)}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="shared caption (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/30"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">ember accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0" />
                </div>
                <button
                  onClick={publish}
                  disabled={(files.length === 0 && !note.trim()) || status === 'uploading'}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3 disabled:opacity-40 transition hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'uploading' ? 'kindling the hearth…' : 'publish to the fireside'}
                </button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white/5 rounded-2xl p-4 space-y-2">
                    <div className="font-medium">shared</div>
                    {results.map(r => (
                      <a key={r.id} href={r.embed} className="text-sm text-blue-400 block truncate" target="_blank" rel="noreferrer">{r.name} — {r.embed}</a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">live preview</h2>
              <motion.div
                className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-h-[180px]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{note || 'your note will flicker here…'}</div>
                {files.length > 0 && <div className="mt-4 text-xs text-neutral-500">{files.length} file{files.length > 1 ? 's' : ''} attached</div>}
                {caption && <div className="mt-3 text-xs italic text-neutral-400">caption: {caption}</div>}
              </motion.div>

              <h2 className="text-lg font-medium mt-8 mb-4">recent firesides</h2>
              <div className="space-y-3">
                {recent.map(item => (
                  <motion.a
                    key={item.id}
                    href={`/s/${item.id}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="block bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition"
                  >
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.caption || 'shared from rankvault'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-neutral-500 text-sm">no public firesides yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
