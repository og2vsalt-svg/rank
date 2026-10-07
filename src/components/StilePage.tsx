import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Relay = {
  id: string;
  label: string;
  target: string;
  note: string | null;
};

function uid() {
  return Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
}

function safeHttp(raw: string) {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export default function StilePage() {
  const { shareId, navigate } = useRouter();
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('a stile is a short link. the causeway desk still files a local file.');
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<Relay | null>(null);
  const [rows, setRows] = useState<Relay[]>([]);

  useEffect(() => {
    sbRest('relays?select=id,label,target,note,created_at&order=created_at.desc&limit=12')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, [opened]);

  useEffect(() => {
    if (!shareId) {
      setOpened(null);
      return;
    }
    sbRest(`relays?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const row = Array.isArray(data) ? data[0] || null : null;
        setOpened(row);
        const href = row?.target ? safeHttp(row.target) : '';
        if (href) window.setTimeout(() => window.location.assign(href), 900);
      })
      .catch(() => setOpened(null));
  }, [shareId]);

  const save = async () => {
    const href = safeHttp(target);
    if (!label.trim() || !href) {
      setStatus('needs a label and an http(s) address.');
      return;
    }
    setBusy(true);
    const id = uid();
    const res = await sbRest('relays', {
      method: 'POST',
      body: JSON.stringify({ id, label: label.trim().slice(0, 120), target: href, note: note.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setStatus('the stile did not land.');
      return;
    }
    setStatus('filed. paste /stile/' + id + ' into discord.');
    navigate('stile', id);
  };

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">stile</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight text-white">a short way through</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">{status}</p>
        {opened && (
          <motion.article initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="apple-card mt-8 rounded-3xl p-6">
            <h2 className="text-2xl text-white tracking-tight">{opened.label}</h2>
            <p className="mt-2 text-sm text-neutral-400">{opened.note || 'opening the address in a moment.'}</p>
            <a className="mt-4 inline-block text-sm text-[#0A84FF]" href={opened.target}>{opened.target}</a>
          </motion.article>
        )}
        <div className="apple-card mt-8 rounded-3xl p-6 space-y-4">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none placeholder:text-neutral-600" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://" className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none placeholder:text-neutral-600" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note, optional" className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none placeholder:text-neutral-600" />
          <button type="button" onClick={save} disabled={busy} className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file the stile'}</button>
        </div>
        <ul className="mt-10 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => navigate('stile', row.id)} className="w-full text-left apple-card rounded-2xl px-4 py-3">
                <span className="text-white">{row.label}</span>
                <span className="block text-xs text-neutral-500 mt-1 truncate">{row.target}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
