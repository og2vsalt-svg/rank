import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietnebulaPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#C084FC');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lastEmbed, setLastEmbed] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    setLastEmbed('');
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'quietnebula', nebula: true },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
      if (res.embed) setLastEmbed(res.embed);
    }
    setFiles([]);
    setBusy(false);
    if (!status) setStatus('drifting in the nebula');
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      {/* quiet drifting nebula */}
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 300 + i * 150,
              height: 200 + i * 100,
              background: `radial-gradient(ellipse, ${color}${15 + i * 10}, transparent 70%)`,
              left: `${10 + i * 25}%`,
              top: `${20 + i * 15}%`,
              filter: 'blur(60px)',
            }}
            animate={{
              x: [0, 30 - i * 10, 0],
              y: [0, -20 + i * 8, 0],
              scale: [1, 1.05, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 16 + i * 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <Navbar />
      <main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
        >
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">quietnebula</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">quiet drifting nebula for what you carry</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
            Drop local files into a quiet nebula where soft clouds of light gently drift and breathe in your color, like distant stars forming in still space. Multi-file with shared note and accent. Spring motion, glass surfaces, polished Discord embeds. Each file lands in storage and the public_shares table. Large files warned, never refused. Prior desks remain untouched. No traces of boosting.
          </p>
        </motion.div>

        <motion.aside
          className="glass mt-8 rounded-3xl p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 120, damping: 18 }}
        >
          <p className="text-[13px] font-medium">let something drift into the nebula</p>
          <label className="mt-4 block cursor-pointer rounded-2xl bg-white/[0.04] p-8 text-center">
            <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <div className="text-[15px] text-white/85">{files.length ? `${files.length} files ready` : 'drop or choose local files'}</div>
            <div className="mt-1 text-[11px] text-white/40">any type · soft warning only</div>
          </label>
          {!!files.length && (
            <ul className="mt-3 space-y-1 text-[12px] text-white/60">
              {files.map((f) => (
                <li key={f.name + f.size} className="truncate">{f.name}</li>
              ))}
            </ul>
          )}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared note"
            className="mt-4 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="name, optional"
            className="mt-2 w-full rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[13px] outline-none"
          />
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
            />
            <span className="text-[12px] text-white/45">accent</span>
          </div>
          {heavy && (
            <p className="mt-2 text-[12px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={send}
            disabled={!files.length || busy}
            className="mt-4 w-full rounded-full px-4 py-2.5 text-[14px] font-medium text-black disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'drifting…' : 'share into the nebula'}
          </motion.button>
          {status && <p className="mt-3 text-[12px] text-white/50">{status}</p>}
          {lastEmbed && (
            <a href={lastEmbed} className="mt-2 block text-[12px] text-white/60 underline-offset-2 hover:underline">
              open the share link
            </a>
          )}
        </motion.aside>
      </main>
    </div>
  );
}
