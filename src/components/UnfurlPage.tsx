import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Card = { title: string; desc: string; image: string; url: string };

function readMeta(html: string, key: string) {
  const re = new RegExp(`property="${key}" content="([^"]*)"`, 'i');
  const name = new RegExp(`name="${key}" content="([^"]*)"`, 'i');
  const hit = html.match(re) || html.match(name);
  return hit ? hit[1].replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>') : '';
}

export default function UnfurlPage() {
  const [raw, setRaw] = useState('');
  const [card, setCard] = useState<Card | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const hint = useMemo(() => 'paste a rankvault path, like /keepsake/id or /pallet/id. Discord sees the same card.', [raw]);

  const preview = async () => {
    setErr('');
    setBusy(true);
    try {
      const trimmed = raw.trim();
      const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      const page = (parts[0] || 'home').toLowerCase();
      const id = parts[1] ? decodeURIComponent(parts[1]) : '';
      const gate = new URL('/api/gate', location.origin);
      gate.searchParams.set('name', 'cardfront');
      gate.searchParams.set('page', page);
      if (id) gate.searchParams.set('id', id);
      const res = await fetch(gate.toString());
      if (!res.ok) throw new Error(`card ${res.status}`);
      const html = await res.text();
      setCard({
        title: readMeta(html, 'og:title') || page,
        desc: readMeta(html, 'og:description'),
        image: readMeta(html, 'og:image'),
        url: readMeta(html, 'og:url') || url.toString(),
      });
    } catch (e: any) {
      setCard(null);
      setErr(e?.message || 'could not read that card');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          before you paste it
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Unfurl
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          A desk for the card, not the file. It asks the same embed path Discord uses, then shows the title, line, and image. No upload, no size gate.
        </p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="/keepsake/id or a full link" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          <p className="mt-2 text-xs text-white/40">{hint}</p>
          <button disabled={!raw.trim() || busy} onClick={preview} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40">
            {busy ? 'reading…' : 'preview the card'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.div>
        {card && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-md overflow-hidden rounded-2xl border border-[#1e1f22] bg-[#2b2d31] text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            {card.image && <img src={card.image} alt="" className="aspect-[1.91/1] w-full object-cover" />}
            <div className="border-l-4 border-[#0a84ff] px-4 py-3">
              <p className="text-[12px] text-[#b5bac1]">{new URL(card.url, location.origin).host}</p>
              <h2 className="mt-1 text-[16px] font-semibold text-[#00a8fc]">{card.title}</h2>
              <p className="mt-1 text-[14px] leading-snug text-[#dbdee1]">{card.desc}</p>
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
}
