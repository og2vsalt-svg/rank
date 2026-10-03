import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import Navbar from './Navbar';

type Filed = { id: string; name: string; card: string; warn?: string | null };

const ease = [0.22, 1, 0.36, 1] as const;

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function fileLocal(file: File, extra: { caption: string; author: string; color: string; cardTitle: string }) {
  const body = new FormData();
  body.append('file', file, file.name);
  body.append('author', extra.author);
  body.append('caption', extra.caption);
  body.append('color', extra.color);
  body.append('cardTitle', extra.cardTitle);
  const r = await fetch('/api/share', { method: 'POST', body });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'the share table did not take the file');
  return data as { id: string; embedPath?: string; warn?: string | null };
}

export default function GudgeonPage() {
  const [pin, setPin] = useState<File | null>(null);
  const [leaf, setLeaf] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('the hinge takes two local files. both land in the share table. nothing is refused for size.');
  const [cards, setCards] = useState<Filed[]>([]);
  const [receipt, setReceipt] = useState('');

  const slow = useMemo(() => {
    const total = (pin?.size || 0) + (leaf?.size || 0);
    return total > 12 * 1024 * 1024 ? `about ${pretty(total)}. preview clients may feel slow. the desk still files it.` : '';
  }, [pin, leaf]);

  async function hinge() {
    if (!pin) return;
    setBusy(true);
    setCards([]);
    setReceipt('');
    setStatus('filing the pin');
    try {
      const author = forWhom.trim() || 'gudgeon';
      const pinRes = await fileLocal(pin, {
        author,
        caption: note.trim() || 'hinge pin',
        color,
        cardTitle: pin.name,
      });
      const filed: Filed[] = [
        {
          id: pinRes.id,
          name: pin.name,
          card: `${window.location.origin}/s/${pinRes.id}`,
          warn: pinRes.warn,
        },
      ];
      let leafLine = 'no leaf';
      if (leaf) {
        setStatus('filing the leaf');
        const leafRes = await fileLocal(leaf, {
          author,
          caption: note.trim() || 'hinge leaf',
          color,
          cardTitle: leaf.name,
        });
        filed.push({
          id: leafRes.id,
          name: leaf.name,
          card: `${window.location.origin}/s/${leafRes.id}`,
          warn: leafRes.warn,
        });
        leafLine = leafRes.id;
      }
      setStatus('writing the receipt');
      const receiptText = [
        'gudgeon',
        `for: ${author}`,
        note.trim() ? `note: ${note.trim()}` : '',
        `pin: ${pin.name}`,
        `pin card: ${window.location.origin}/s/${pinRes.id}`,
        leaf ? `leaf: ${leaf.name}` : 'leaf: none',
        leafLine !== 'no leaf' ? `leaf card: ${window.location.origin}/s/${leafLine}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const slip = new File([receiptText], 'gudgeon.txt', { type: 'text/plain' });
      const slipRes = await fileLocal(slip, {
        author,
        caption: note.trim() || 'hinge receipt',
        color,
        cardTitle: `gudgeon · ${pin.name}`,
      });
      filed.unshift({
        id: slipRes.id,
        name: 'gudgeon.txt',
        card: `${window.location.origin}/s/${slipRes.id}`,
        warn: slipRes.warn,
      });
      setCards(filed);
      setReceipt(`${window.location.origin}/gudgeon/${slipRes.id}`);
      setStatus('hinged. paste the receipt in Discord. each file has its own card.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'the hinge did not close');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[#0a84ff] text-[13px] tracking-wide">
          hinge desk
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight"
        >
          gudgeon
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease }}
          className="mt-4 text-neutral-400 text-lg max-w-xl leading-relaxed"
        >
          A pin and an optional leaf. Both leave this machine and land in the share table. The receipt is the Discord card.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="mt-8 grid sm:grid-cols-2 gap-3"
        >
          <label className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
            <span className="text-xs text-neutral-500">pin</span>
            <span className="mt-2 block text-sm text-white truncate">{pin ? pin.name : 'choose the file that leads'}</span>
            <span className="mt-1 block text-xs text-neutral-500">{pin ? pretty(pin.size) : 'local file'}</span>
            <input type="file" className="sr-only" onChange={(e) => setPin(e.target.files?.[0] || null)} />
          </label>
          <label className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
            <span className="text-xs text-neutral-500">leaf</span>
            <span className="mt-2 block text-sm text-white truncate">{leaf ? leaf.name : 'optional companion'}</span>
            <span className="mt-1 block text-xs text-neutral-500">{leaf ? pretty(leaf.size) : 'cover, reply, or still'}</span>
            <input type="file" className="sr-only" onChange={(e) => setLeaf(e.target.files?.[0] || null)} />
          </label>
        </motion.div>

        <div className="mt-3 space-y-3">
          <input
            value={forWhom}
            onChange={(e) => setForWhom(e.target.value)}
            placeholder="for whom"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 transition-colors"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="handover note"
            rows={3}
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 transition-colors resize-none"
          />
          <label className="flex items-center gap-3 text-sm text-neutral-400">
            accent
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-xl bg-transparent border border-white/10" />
            <span className="font-mono text-xs">{color}</span>
          </label>
        </div>

        {slow && <p className="mt-4 text-sm text-amber-200/80">{slow}</p>}

        <button
          disabled={!pin || busy}
          onClick={hinge}
          className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {busy ? 'hinging' : 'file the hinge'}
        </button>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>

        {receipt && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-neutral-500">Discord receipt</p>
            <a className="mt-1 block break-all text-[#0a84ff]" href={receipt}>{receipt}</a>
            <div className="mt-4 space-y-2">
              {cards.map((c) => (
                <a key={c.id} href={c.card} className="block rounded-2xl bg-black/30 px-3 py-2 text-sm text-neutral-200 hover:bg-black/40">
                  <span className="text-white">{c.name}</span>
                  <span className="block text-xs text-neutral-500 break-all">{c.card}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
