import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function KeyringPage() {
  const [id, setId] = useState('');
  const [status, setStatus] = useState('');
  const [urls, setUrls] = useState<Record<string, string> | null>(null);
  const [copied, setCopied] = useState('');

  const inspect = async () => {
    const raw = id.trim().replace(/^.*\/(s|f|open|go|link|d)\//, '').replace(/[#?].*$/, '');
    if (!raw) {
      setStatus('paste a share id or embed path');
      return;
    }
    setStatus('checking the share db…');
    const meta = await fetchShare(raw);
    const bag = shareUrls(raw);
    setUrls(bag);
    setStatus(meta ? `${meta.name} · live` : 'id accepted. if the drop exists, every alias cards the same file.');
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied(value);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">keyring</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">every embed alias for one drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            discord, slack, and iMessage unfurl /s/id. the other short paths hit the same card so a link always looks finished.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id or /s/…"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <button onClick={inspect} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              ring
            </button>
          </div>
          {status && <p className="text-xs text-neutral-400 mb-4">{status}</p>}
          {urls && (
            <div className="space-y-1.5">
              {Object.entries(urls).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => copy(k, v)}
                  className="w-full text-left px-3 py-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition"
                >
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wide">{k}</span>
                  <p className="text-xs text-neutral-300 break-all">{v}</p>
                </button>
              ))}
              {copied && <p className="text-[11px] text-neutral-500 pt-2">copied {copied}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
