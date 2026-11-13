import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

export default function QuietStillroomPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
  }, []);

  const onFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    const large = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'large file detected. the browser may feel slow while uploading. no hard limit.' : null);
    setFiles(prev => [...prev, ...arr]);
    setStatus('idle');
  }, []);

  const remove = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx));

  const publish = async () => {
    if (!files.length && !note.trim()) return;
    setStatus('uploading');
    const out: { id: string; embed: string; name: string }[] = [];

    if (note.trim()) {
      const noteFile = new File([note], 'stillroom-note.txt', { type: 'text/plain' });
      const res = await publishLocalFile(noteFile, {
        caption: caption || 'quiet stillroom note',
        color,
        cardTitle: 'Stillroom note',
        author: 'rankvault',
        meta: { desk: 'quietstillroom', kind: 'note' },
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, embed: shareUrls(res.id).embed, name: 'stillroom note' });
      }
    }

    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || file.name,
        color,
        cardTitle: file.name.replace(/\.[^.]+$/, ''),
        author: 'rankvault',
        meta: { desk: 'quietstillroom' },
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, embed: shareUrls(res.id).embed, name: file.name });
      }
    }

    setResults(out);
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
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
        >
          <div className="absolute left-1/3 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: `${color}18` }} />
          <div className="absolute right-1/4 bottom-1/4 w-80 h-80 rounded-full blur-[90px] bg-white/4" />
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
          >
            quiet stillroom
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="text-neutral-400 mb-10 max-w-2xl text-lg leading-relaxed"
          >
            A quiet stillroom for compositions. Write a note or drop local files. They settle as soft glowing cards with gentle spring motion on frosted glass. Shared caption, cool accent. Publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                className="block rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] backdrop-blur-md p-10 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <input type="file" multiple className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} />
                <div className="text-base font-medium mb-1">drop files into the stillroom</div>
                <div className="text-xs text-neutral-500">or click to browse · soft size warnings only</div>
                {warn && <div className="mt-3 text-amber-300/90 text-xs">{warn}</div>}
              </label>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-auto">
                  {files.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-2.5 text-sm border border-white/5"
                    >
                      <span className="truncate pr-4">{f.name}</span>
                      <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs shrink-0">remove</button>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <textarea
                  placeholder="quiet note (optional)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/25 focus:bg-white/[0.07] transition resize-none"
                />
                <input
                  type="text"
                  placeholder="shared caption (optional)"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/25 focus:bg-white/[0.07] transition"
                />
                <div className="flex gap-4 items-center">
                  <label className="text-sm text-neutral-400">stillroom accent</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer" />
                </div>
                <motion.button
                  onClick={publish}
                  disabled={(!files.length && !note.trim()) || status === 'uploading'}
                  whileTap={{ scale: 0.985 }}
                  className="w-full rounded-2xl bg-white text-black font-medium py-3.5 disabled:opacity-40 transition hover:bg-neutral-100"
                >
                  {status === 'uploading' ? 'settling into the stillroom…' : 'publish from the stillroom'}
                </motion.button>
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-white/5 backdrop-blur-md rounded-2xl p-5 space-y-3 border border-white/10"
                  >
                    <div className="font-medium text-sm">shared from the stillroom</div>
                    {results.map(r => (
                      <a key={r.id} href={r.embed} className="block text-sm text-blue-400 truncate hover:text-blue-300" target="_blank" rel="noreferrer">
                        {r.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <div className="text-sm font-medium text-neutral-300 mb-4">recent stillroom shares</div>
              <div className="space-y-3">
                {recent.map(share => (
                  <motion.a
                    key={share.id}
                    href={shareUrls(share.id).embed}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.015 }}
                    className="block bg-white/[0.04] backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:border-white/15 transition"
                  >
                    <div className="font-medium text-sm truncate">{share.name || 'untitled'}</div>
                    <div className="text-xs text-neutral-500 mt-1 truncate">{share.caption || 'no caption'}</div>
                  </motion.a>
                ))}
                {recent.length === 0 && <div className="text-xs text-neutral-500">no recent shares yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
