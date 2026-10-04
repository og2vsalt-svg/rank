import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Rider = {
  id: string;
  share_id?: string | null;
  timber: string;
  note?: string | null;
  author?: string | null;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function RiderPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [timber, setTimber] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a rider braces a frame. the file is not a drawer.');
  const [card, setCard] = useState('');
  const [share, setShare] = useState('');
  const [rows, setRows] = useState<Rider[]>([]);
  const [open, setOpen] = useState<Rider | null>(null);

  const warn = useMemo(() => {
    if (!file) return '';
    if (file.size > 80 * 1024 * 1024) return 'heavy file. it still goes up. the tab may feel slow while it sends.';
    if (file.size > 12 * 1024 * 1024) return 'large drop. nothing is refused. preview clients can feel slow.';
    return '';
  }, [file]);

  useEffect(() => {
    fetch('/api/rider')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.riders)) setRows(data.riders); })
      .catch(() => setStatus('the rider table did not answer. the share table still takes files.'));
  }, [card]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/rider?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => {
        const row = Array.isArray(data.riders) ? data.riders[0] : null;
        if (row) {
          setOpen(row);
          setCard(`${window.location.origin}/rider/${row.id}`);
          if (row.share_id) setShare(shareUrls(row.share_id).embed);
        }
      })
      .catch(() => {});
  }, [shareId]);

  async function fileIt() {
    if (!file || !timber.trim() || busy) return;
    setBusy(true);
    setStatus('sending the local file into the share table…');
    const filed = await publishLocalFile(file, {
      caption: note.trim() || timber.trim(),
      author: author.trim() || undefined,
      cardTitle: timber.trim(),
      color: '#FF9F0A',
    });
    if (!filed.ok || !filed.id) {
      setBusy(false);
      setStatus(filed.error || 'the share table did not take that file');
      return;
    }
    setStatus('filing the timber note…');
    const r = await fetch('/api/rider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timber: timber.trim(),
        note: note.trim(),
        author: author.trim(),
        shareId: filed.id,
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok || !data.rider?.id) {
      setShare(shareUrls(filed.id).embed);
      setStatus(data.error || 'file landed, but the rider table did not answer');
      return;
    }
    const origin = window.location.origin;
    setCard(`${origin}/rider/${data.rider.id}`);
    setShare(shareUrls(filed.id).embed);
    setOpen(data.rider);
    setStatus(filed.warn || warn || 'filed. paste either link in Discord.');
    history.replaceState(null, '', `/rider/${data.rider.id}`);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] tracking-[0.18em] uppercase text-[#ff9f0a]">
          rider
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-[40px] sm:text-[52px] leading-[0.98] font-semibold tracking-tight"
        >
          Brace the frame.
        </motion.h1>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white/60">
          A rider is the timber that stiffens a frame, not another vault drawer. One local file lands in the share table. The note that names it lives beside it.
        </p>

        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-6 rounded-3xl p-5">
            <div className="text-[13px] text-[#ff9f0a]">open rider</div>
            <div className="mt-1 text-[18px] font-medium">{open.timber}</div>
            {open.note && <p className="mt-1 text-[14px] text-white/60">{open.note}</p>}
          </motion.div>
        )}

        <motion.label
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          className="glass mt-8 block rounded-[28px] p-8 cursor-pointer"
        >
          <input className="sr-only" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-[17px] font-medium">{file ? file.name : 'Choose a local file'}</div>
          <div className="mt-1 text-[13px] text-white/45">
            {file ? pretty(file.size) : 'no size lock. a warning appears only if the send may feel slow.'}
          </div>
          {warn && <p className="mt-3 text-[13px] text-amber-200/90">{warn}</p>}
        </motion.label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={timber} onChange={(e) => setTimber(e.target.value)} placeholder="timber name" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="glass rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none" />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why this brace exists — Discord can show this" className="glass mt-3 w-full rounded-2xl px-4 py-3 text-[14px] bg-transparent outline-none min-h-24" />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={fileIt}
            disabled={busy || !file || !timber.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition hover:bg-neutral-200 active:scale-[0.98]"
          >
            {busy ? 'Filing…' : 'File the rider'}
          </button>
          <p className="text-[13px] text-white/50">{status}</p>
        </div>

        {(card || share) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-6 rounded-3xl p-5 text-[13px] space-y-2">
            {card && <a className="block text-[#ff9f0a] break-all" href={card}>{card}</a>}
            {share && <a className="block text-white/70 break-all" href={share}>{share}</a>}
          </motion.div>
        )}

        <section className="mt-12">
          <h2 className="text-[13px] tracking-[0.16em] uppercase text-white/35">recent riders</h2>
          <div className="mt-3 space-y-2">
            {rows.map((row, i) => (
              <motion.a
                key={row.id}
                href={`/rider/${row.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="glass block rounded-2xl px-4 py-3 transition duration-300 hover:-translate-y-0.5"
              >
                <div className="text-[15px]">{row.timber}</div>
                <div className="mt-1 text-[12px] text-white/40">
                  {row.note || 'open rider'}{row.author ? ` · ${row.author}` : ''}
                </div>
              </motion.a>
            ))}
            {!rows.length && <p className="text-[13px] text-white/40">no riders yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
