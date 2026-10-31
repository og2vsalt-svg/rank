import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Attachment = {
  name: string;
  size: number;
  id?: string;
  embed?: string;
  error?: string;
  warn?: string | null;
};

export default function SoftQuietDriftPage() {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    id?: string;
    embed?: string;
    attachments: Attachment[];
    error?: string;
    warn?: string | null;
  } | null>(null);
  const [copied, setCopied] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const publish = async () => {
    if (!files.length && !caption.trim()) return;
    setBusy(true);
    setResult(null);
    const attachments: Attachment[] = [];
    let primaryId: string | undefined;
    let primaryEmbed: string | undefined;
    let primaryWarn: string | null = null;

    if (files.length) {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          author,
          caption: caption ? `${title ? title + ' \u2014 ' : ''}${caption.slice(0, 280)}${caption.length > 280 ? '\u2026' : ''}` : title || file.name,
          color,
          cardTitle: title || file.name,
          meta: { accent: color, source: 'softquietdrift', note: caption.slice(0, 2000) },
        });
        const att: Attachment = {
          name: file.name,
          size: file.size,
          id: res.id,
          embed: res.id ? shareUrls(res.id).embed : undefined,
          error: res.ok ? undefined : res.error,
          warn: res.warn,
        };
        attachments.push(att);
        if (!primaryId && res.id) {
          primaryId = res.id;
          primaryEmbed = att.embed;
          primaryWarn = res.warn || null;
        }
      }
    } else {
      const blob = new Blob([caption], { type: 'text/plain' });
      const file = new File([blob], `${(title || 'drift-note').replace(/\s+/g, '-')}.txt`, { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        author,
        caption: title ? `${title} \u2014 ${caption.slice(0, 280)}` : caption.slice(0, 280),
        color,
        cardTitle: title || 'drift note',
        meta: { accent: color, source: 'softquietdrift', note: caption },
      });
      if (res.ok && res.id) {
        primaryId = res.id;
        primaryEmbed = shareUrls(res.id).embed;
        primaryWarn = res.warn || null;
        attachments.push({
          name: file.name,
          size: file.size,
          id: res.id,
          embed: primaryEmbed,
          warn: res.warn,
        });
      } else {
        setResult({ attachments: [], error: res.error || 'could not file the note' });
        setBusy(false);
        return;
      }
    }

    setResult({
      id: primaryId,
      embed: primaryEmbed,
      attachments,
      warn: primaryWarn,
    });
    setBusy(false);
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12 relative">
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + (i % 4) * 2,
                height: 3 + (i % 4) * 2,
                background: color,
                opacity: 0.35,
                left: `${10 + (i * 11) % 80}%`,
                top: `${15 + (i * 9) % 70}%`,
                filter: 'blur(1px)',
              }}
              animate={{
                x: [0, 20 + i * 3, -10, 0],
                y: [0, -8 - i, 6, 0],
                opacity: [0.2, 0.5, 0.25],
              }}
              transition={{
                duration: 9 + i * 0.7,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="relative"
        >
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">softquietdrift</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em]">quiet drift for what you carry</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Drop one or many local files with a shared title, caption, and accent light. Soft lights drift and settle with spring motion on frosted glass. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <div className="mt-8 space-y-4 relative">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title for the card (optional)"
            className="glass w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="a quiet note that drifts with the share\u2026"
            rows={5}
            className="glass w-full rounded-3xl px-4 py-4 text-[15px] leading-relaxed outline-none resize-none"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="your name, optional"
            className="glass w-full rounded-2xl px-4 py-3 text-[14px] outline-none"
          />
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
            <span className="text-[13px] text-white/45">accent light for the drifting cards</span>
          </div>

          <label className="glass mt-2 block cursor-pointer rounded-3xl p-6 text-center">
            <input
              className="hidden"
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <div className="text-[14px] text-white/75">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to drift` : 'drop local files here'}
            </div>
            <div className="mt-1 text-[12px] text-white/35">any type \u00b7 soft warning only</div>
          </label>

          {!!files.length && (
            <ul className="space-y-1.5">
              {files.map((f) => (
                <li key={f.name + f.size} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-2 text-[13px]">
                  <span className="truncate pr-3">{f.name}</span>
                  <span className="shrink-0 text-white/35">{(f.size / 1024).toFixed(0)} kb</span>
                </li>
              ))}
            </ul>
          )}

          {heavy && (
            <p className="text-[13px] text-amber-200/75">large attachments. sending may feel slow. nothing is refused.</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={(!caption.trim() && !files.length) || busy}
            className="w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
            style={{ background: color }}
          >
            {busy ? 'drifting\u2026' : 'let it drift'}
          </motion.button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-3"
          >
            {result.error ? (
              <div className="glass rounded-2xl px-4 py-3 text-[14px] text-red-300">{result.error}</div>
            ) : (
              <>
                {result.embed && (
                  <div className="glass rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium">drift link</p>
                      <button
                        onClick={() => copy(result.embed!)}
                        className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]"
                      >
                        {copied === result.embed ? 'copied' : 'copy'}
                      </button>
                    </div>
                    <p className="mt-1.5 break-all text-[12px] text-white/40">{result.embed}</p>
                    {result.warn && <p className="mt-1 text-[12px] text-amber-200/70">{result.warn}</p>}
                  </div>
                )}
                {result.attachments.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-[12px] uppercase tracking-wider text-white/35">attachments</p>
                    {result.attachments.map((a) => (
                      <div key={a.name + a.size} className="glass rounded-2xl px-4 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-[13px]">{a.name}</p>
                          {a.embed ? (
                            <button
                              onClick={() => copy(a.embed!)}
                              className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]"
                            >
                              {copied === a.embed ? 'copied' : 'copy'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-red-300">{a.error || 'failed'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
