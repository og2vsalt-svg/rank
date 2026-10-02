import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function TholePage() {
  const [to, setTo] = useState('');
  const [line, setLine] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [cards, setCards] = useState<string[]>([]);

  const send = async () => {
    if (!line.trim() && !file) {
      setErr('write a line, or attach a local file');
      return;
    }
    setBusy(true);
    setErr('');
    setCards([]);
    const next: string[] = [];
    try {
      const note = new File(
        [`to: ${to || 'whoever'}\n\n${line.trim()}\n`],
        `${(to || 'thole').replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'thole'}.txt`,
        { type: 'text/plain' },
      );
      const slip = await publishLocalFile(note, {
        caption: line.trim().slice(0, 180) || 'a thole slip',
        cardTitle: to ? `for ${to}` : 'thole slip',
        author: 'thole',
        color: '#AF52DE',
      });
      if (!slip.ok || !slip.id) {
        setErr(slip.error || 'the slip did not land');
        return;
      }
      next.push(shareUrls(slip.id).embed);
      if (file) {
        if (file.size > 30 * 1024 * 1024) setWarn('the attachment is large. the send may feel slow. it is not refused.');
        const attached = await publishLocalFile(file, {
          caption: line.trim().slice(0, 180) || file.name,
          cardTitle: file.name,
          author: to || 'thole',
          color: '#0A84FF',
        });
        if (!attached.ok || !attached.id) {
          setErr(attached.error || 'slip filed, attachment did not');
          setCards(next);
          return;
        }
        next.push(shareUrls(attached.id).embed);
        if (attached.warn) setWarn(attached.warn);
      }
      setCards(next);
      try { await navigator.clipboard.writeText(next[0]); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#af52de] text-sm mb-2">thole</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a pin for a person, not a drawer.</h1>
          <p className="text-neutral-400 text-sm mb-6">the line becomes a text row in the share table. an optional local file rides as its own card. Discord unfurls both.</p>
          <div className="space-y-3">
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="who it is for" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#af52de]/40" />
            <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder="the line they should see on the card" rows={4} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#af52de]/40 resize-none" />
            <label className="block rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-neutral-400 cursor-pointer hover:border-white/25 transition">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'optional local file'}
            </label>
            <button onClick={send} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file the slip'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {cards.length > 0 && (
            <div className="mt-5 space-y-1">
              {cards.map((c) => <p key={c} className="text-xs text-neutral-400 break-all">{c}</p>)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
