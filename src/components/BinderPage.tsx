import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  id: string;
  text: string;
  file: File | null;
  preview?: string;
};

export default function BinderPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<Item[]>([{ id: Math.random().toString(36).slice(2, 9), text: '', file: null }]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const addItem = () => {
    setItems((p) => [...p, { id: Math.random().toString(36).slice(2, 9), text: '', file: null }]);
  };

  const update = (id: string, patch: Partial<Item>) => {
    setItems((p) => p.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const onFile = (id: string, f: File | null) => {
    if (f && f.size > 40_000_000) setWarn('Large file may take a moment. No hard limits.');
    else setWarn(null);
    update(id, {
      file: f,
      preview: f && f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    });
  };

  const publish = async () => {
    if (busy) return;
    const usable = items.filter((i) => i.text.trim() || i.file);
    if (!usable.length) return;
    setBusy(true);
    try {
      const published: { text: string; fileLink?: string; name?: string }[] = [];
      for (const item of usable) {
        let fileLink: string | undefined;
        if (item.file) {
          const res = await publishLocalFile(item.file, {
            caption: item.text.trim() || item.file.name,
            color: '#0A84FF',
            cardTitle: item.file.name,
            meta: { desk: 'binder', parent: title || 'binder' },
          });
          if (res.ok && res.id) fileLink = shareUrls(res.id).app;
        }
        published.push({ text: item.text.trim(), fileLink, name: item.file?.name });
      }

      const md = [
        `# ${title.trim() || 'Binder'}`,
        '',
        ...published.map((p, i) => {
          const lines = [`## ${i + 1}`];
          if (p.text) lines.push(p.text);
          if (p.fileLink) lines.push(`\nFile: [${p.name || 'attachment'}](${p.fileLink})`);
          return lines.join('\n');
        }),
        '',
        '_Collected with rankvault Binder. Soft size warnings only. Polished Discord embeds on every link._',
      ].join('\n');

      const blob = new Blob([md], { type: 'text/markdown' });
      const boardFile = new File([blob], `${(title || 'binder').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.md`, { type: 'text/markdown' });
      const boardRes = await publishLocalFile(boardFile, {
        caption: title.trim() || 'Binder collection',
        color: '#0A84FF',
        cardTitle: title.trim() || 'Binder',
        meta: { desk: 'binder', items: published.length },
      });
      if (boardRes.ok && boardRes.id) setLink(shareUrls(boardRes.id).app);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#0A84FF] mb-2">Binder</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Gather notes and files.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Collect short notes, optionally attach local files, and publish the whole binder as a permanent markdown share. Every link carries a polished Discord embed. Soft size warnings only. Apple-style springs on frosted glass.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Binder title (optional)"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="glass rounded-2xl p-5 mb-4 border border-white/5"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-neutral-500">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems((p) => p.filter((x) => x.id !== item.id))}
                      className="text-xs text-neutral-500 hover:text-white"
                    >
                      remove
                    </button>
                  )}
                </div>
                <textarea
                  value={item.text}
                  onChange={(e) => update(item.id, { text: e.target.value })}
                  placeholder="Quiet note…"
                  rows={3}
                  className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 mb-3 resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-neutral-300 hover:bg-white/10 cursor-pointer">
                    {item.file ? item.file.name.slice(0, 24) : 'attach file'}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => onFile(item.id, e.target.files?.[0] || null)}
                    />
                  </label>
                  {item.preview && <img src={item.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={addItem}
            className="text-sm text-[#0A84FF] mb-6 hover:underline"
          >
            + add another item
          </button>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#0A84FF]"
          >
            {busy ? 'Publishing…' : 'Publish binder'}
          </motion.button>

          {link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-neutral-400 mb-2">Permanent binder link</p>
              <button
                onClick={() => navigate('share', link.split('/').pop() || '')}
                className="text-[#0A84FF] text-sm break-all"
              >
                {link}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
