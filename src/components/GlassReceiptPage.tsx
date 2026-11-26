import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Line = { id: string; label: string; amount: string };

export default function GlassReceiptPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('Glass Receipt');
  const [caption, setCaption] = useState('a clear record of what passed');
  const [color, setColor] = useState('#30D158');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { id: '1', label: '', amount: '' },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = () => {
    setLines((prev) => [...prev, { id: Date.now().toString(36), label: '', amount: '' }]);
  };

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const total = lines.reduce((sum, l) => {
    const n = parseFloat(l.amount.replace(/[^0-9.-]/g, ''));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const publish = async () => {
    setPublishing(true);
    setError(null);
    setResult(null);

    const body = [
      `# ${title}`,
      '',
      caption,
      '',
      '| item | amount |',
      '| --- | ---: |',
      ...lines
        .filter((l) => l.label.trim() || l.amount.trim())
        .map((l) => `| ${l.label || '—'} | ${l.amount || '—'} |`),
      '',
      `**total** · ${currency} ${total.toFixed(2)}`,
      '',
      notes.trim() ? notes.trim() : '',
      '',
      '---',
      'shared from rankvault · Discord-ready',
    ]
      .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
      .join('\n');

    try {
      if (file) {
        const pubFile = await publishLocalFile(file, {
          caption,
          cardTitle: `${title} · attachment`,
          color,
        });
        const attachUrl =
          pubFile.ok && pubFile.id ? shareUrls(pubFile.id).embed : null;
        const full = attachUrl
          ? `${body}\n\nAttachment: ${attachUrl}`
          : body;
        const blob = new Blob([full], { type: 'text/markdown' });
        const md = new File([blob], `${title.replace(/\s+/g, '-')}.md`, {
          type: 'text/markdown',
        });
        const pub = await publishLocalFile(md, {
          caption,
          cardTitle: title,
          color,
          meta: { kind: 'glass-receipt', total, currency },
        });
        if (pub.ok && pub.id) {
          const url = shareUrls(pub.id).embed;
          setResult(url);
          navigator.clipboard.writeText(url).catch(() => {});
        } else {
          setError(pub.error || 'receipt could not print');
        }
      } else {
        const blob = new Blob([body], { type: 'text/markdown' });
        const md = new File([blob], `${title.replace(/\s+/g, '-')}.md`, {
          type: 'text/markdown',
        });
        const pub = await publishLocalFile(md, {
          caption,
          cardTitle: title,
          color,
          meta: { kind: 'glass-receipt', total, currency },
        });
        if (pub.ok && pub.id) {
          const url = shareUrls(pub.id).embed;
          setResult(url);
          navigator.clipboard.writeText(url).catch(() => {});
        } else {
          setError(pub.error || 'receipt could not print');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'print interrupted');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#30D158] text-sm tracking-wide mb-3">glass receipt</p>
          <h1 className="text-5xl font-semibold tracking-tight mb-4 leading-[1.02]">
            line items,
            <br />
            clear totals.
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Build a structured receipt, optionally attach a local file, and publish it as a polished Discord-ready markdown share. Soft size warnings only.
          </p>
        </motion.div>

        <div className="glass rounded-3xl p-6 space-y-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30D158]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">currency</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30D158]/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">caption</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#30D158]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 rounded-2xl cursor-pointer bg-transparent border border-white/10"
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <AnimatePresence>
            {lines.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
              >
                <input
                  value={line.label}
                  onChange={(e) => updateLine(line.id, { label: e.target.value })}
                  placeholder="item"
                  className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
                <input
                  value={line.amount}
                  onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full sm:w-28 bg-white/5 rounded-xl px-3 py-2.5 text-sm outline-none text-right"
                />
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="text-xs text-neutral-500 hover:text-white px-2 py-1"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            + add line
          </button>
        </div>

        <div className="glass rounded-2xl p-4 mb-6 flex justify-between items-center">
          <span className="text-sm text-neutral-400">total</span>
          <span className="text-lg font-medium" style={{ color }}>
            {currency} {total.toFixed(2)}
          </span>
        </div>

        <div className="glass rounded-3xl p-6 space-y-4 mb-8">
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-[#30D158]/50"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">optional attachment</label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full border border-dashed border-white/15 rounded-2xl px-4 py-4 text-sm text-neutral-400 hover:border-white/25 transition text-left"
            >
              {file ? file.name : 'attach a local file (optional)'}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-400 mb-4">{error}</p>}

        <button
          onClick={publish}
          disabled={publishing}
          className="px-7 py-3 rounded-full text-sm font-medium text-black disabled:opacity-50"
          style={{ background: color }}
        >
          {publishing ? 'printing…' : 'publish receipt'}
        </button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass rounded-2xl p-4 text-sm break-all"
          >
            <p className="text-xs text-neutral-500 mb-1">link copied</p>
            {result}
          </motion.div>
        )}

        <button
          onClick={() => navigate('home')}
          className="mt-12 block text-sm text-neutral-500 hover:text-white transition"
        >
          ← back home
        </button>
      </div>
    </div>
  );
}
