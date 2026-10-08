import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { listPublicShares } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function AnnuletPage() {
  const [shares, setShares] = useState<any[]>([]);
  const [shareId, setShareId] = useState('');
  const [borrower, setBorrower] = useState('');
  const [due, setDue] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    let live = true;
    Promise.all([
      listPublicShares(12).catch(() => []),
      sbRest('modillions?select=id,share_id,borrower,due_note,created_at&order=created_at.desc&limit=10').then((r) => r.json()).catch(() => []),
    ]).then(([listed, saved]) => {
      if (!live) return;
      setShares(listed || []);
      if (Array.isArray(saved)) setRows(saved);
    });
    return () => { live = false; };
  }, [link]);

  async function ring() {
    setError('');
    setLink('');
    if (!borrower.trim() || !shareId.trim()) {
      setError('name who has it and paste a share id. this ring does not take a new file.');
      return;
    }
    setBusy(true);
    try {
      const id = uid();
      const res = await sbRest('modillions', {
        method: 'POST',
        body: JSON.stringify({ id, share_id: shareId.trim(), borrower: borrower.trim(), due_note: due.trim() || null }),
      });
      if (!res.ok) {
        setError((await res.text()) || 'the ring did not save.');
        return;
      }
      setLink(`${location.origin}/annulet/${id}`);
      setDue('');
    } catch (e: any) {
      setError(e?.message || 'could not write the ring.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">a ring, not a cabinet</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">annulet</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            Mark a share that already exists as out with someone. No second copy, no size gate. Paste /annulet in Discord for a card.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <div className="space-y-4">
            <label className="block text-sm text-neutral-300">share id
              <input value={shareId} onChange={(e) => setShareId(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="from /s/…" />
            </label>
            <div className="flex flex-wrap gap-2">
              {shares.slice(0, 6).map((s) => (
                <button key={s.id} type="button" onClick={() => setShareId(s.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/10 transition">{s.name || s.id}</button>
              ))}
            </div>
            <label className="block text-sm text-neutral-300">who has it
              <input value={borrower} onChange={(e) => setBorrower(e.target.value)} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="name" />
            </label>
            <label className="block text-sm text-neutral-300">return note
              <input value={due} onChange={(e) => setDue(e.target.value)} maxLength={160} className="mt-1.5 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" placeholder="after the reading" />
            </label>
            {error ? <p className="text-sm text-[#ff453a]">{error}</p> : null}
            {link ? <motion.a initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} href={link} className="block text-sm text-[#64b5ff] break-all">{link}</motion.a> : null}
            <button disabled={busy} onClick={ring} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition disabled:opacity-60">{busy ? 'writing…' : 'set the ring'}</button>
          </div>
        </motion.div>
        <section className="mt-10 space-y-3">
          {rows.map((row) => (
            <a key={row.id} href={`/s/${row.share_id}`} className="block rounded-2xl border border-white/10 px-4 py-3 hover:-translate-y-0.5 transition">
              <p className="text-sm">{row.borrower}</p>
              <p className="text-xs text-white/45 mt-1">{row.due_note || 'no return note'} · {row.share_id}</p>
            </a>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
