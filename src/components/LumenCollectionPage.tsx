import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

interface Item {
  id: string;
  kind: 'note' | 'file';
  title: string;
  body?: string;
  file?: File;
  size?: number;
}

export default function LumenCollectionPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const addNote = () => {
    if (!noteBody.trim()) return;
    const id = Date.now().toString(36);
    setItems((prev) => [
      ...prev,
      { id, kind: 'note', title: noteTitle.trim() || 'note', body: noteBody.trim() },
    ]);
    setNoteTitle('');
    setNoteBody('');
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next: Item[] = files.map((f) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      kind: 'file',
      title: f.name,
      file: f,
      size: f.size,
    }));
    setItems((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setError(null);
    setLink(null);
    setWarn(null);

    try {
      // Build a clean markdown representation of the collection
      let md = `# Lumen Collection\n\nGathered notes and files. Soft size warnings only. No hard limits.\n\n`;
      const fileLinks: string[] = [];

      for (const item of items) {
        if (item.kind === 'note') {
          md += `## ${item.title}\n\n${item.body}\n\n`;
        } else if (item.file) {
          const res = await publishLocalFile(item.file, {
            caption: item.title,
            color: '#0A84FF',
            cardTitle: item.title,
            meta: { desk: 'lumencollection', kind: 'collection-item' },
          });
          if (res.ok && res.id) {
            const urls = shareUrls(res.id);
            fileLinks.push(`- [${item.title}](${urls.app})`);
            if (res.warn) setWarn((w) => w || res.warn);
          } else {
            md += `## ${item.title}\n\n(file could not be attached)\n\n`;
          }
        }
      }

      if (fileLinks.length) {
        md += `## Attached files\n\n${fileLinks.join('\n')}\n\n`;
      }

      md += `\n---\nPublished from Lumen Collection on rankvault. Apple-style springs. Polished Discord embeds on every link.\n`;

      const file = new File([md], 'lumen-collection.md', { type: 'text/markdown' });
      const res = await publishLocalFile(file, {
        caption: 'Lumen Collection',
        color: '#0A84FF',
        cardTitle: 'Lumen Collection',
        meta: { desk: 'lumencollection', kind: 'collection', itemCount: items.length },
      });

      if (res.ok && res.id) {
        setLink(shareUrls(res.id).app);
        if (res.warn) setWarn(res.warn);
      } else {
        setError(res.error || 'could not publish the collection');
      }
    } catch (e: any) {
      setError(e.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Lumen Collection</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Gather notes and files.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Pin quiet notes and drop local files into one board. Publish the whole collection as a clean markdown share with permanent Discord-ready links. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <div className="space-y-4 mb-8">
            <div className="grid gap-3">
              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title (optional)"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
              />
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Write a note to pin…"
                rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={addNote}
                disabled={!noteBody.trim()}
                className="self-start px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 disabled:opacity-40 transition"
              >
                pin note
              </motion.button>
            </div>

            <label className="block">
              <span className="text-sm text-neutral-400">or drop files</span>
              <input type="file" multiple onChange={onFiles} className="mt-2 block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#0A84FF] file:text-white hover:file:bg-[#3A9DFF]" />
            </label>
          </div>

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mb-8"
              >
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 24 }}
                    className="glass rounded-2xl p-4 flex items-start justify-between gap-3 border border-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-neutral-500">
                        {item.kind === 'note' ? 'note' : `${((item.size || 0) / 1024).toFixed(1)} KB file`}
                      </p>
                    </div>
                    <button onClick={() => remove(item.id)} className="text-xs text-neutral-500 hover:text-white shrink-0">
                      remove
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {warn && <p className="text-sm text-amber-400/90 mb-4">soft warning: {warn}</p>}
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'publishing collection…' : 'publish collection'}
          </motion.button>

          {link && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
              <p className="text-sm text-neutral-400 mb-2">your collection is live</p>
              <button onClick={() => navigate('share', link.split('/').pop() || '')} className="text-[#0A84FF] text-sm underline">
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
