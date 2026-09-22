import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function KeystonePage() {
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [hash, setHash] = useState('');
  const [id, setId] = useState('');
  const [warn, setWarn] = useState('');
  const [copied, setCopied] = useState('');

  const receipt = useMemo(() => {
    if (!hash) return '';
    return `rankvault receipt\nfile: ${name}\nbytes: ${size}\nsha-256: ${hash}\nshare: ${id || '—'}`;
  }, [hash, name, size, id]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setName(file.name);
    setSize(file.size);
    setWarn(file.size > 80 * 1024 * 1024 ? 'huge file. hashing might hitch the tab a bit.' : '');
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    setHash(hex(digest));
    setId(Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
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
          <p className="text-[#0a84ff] text-sm mb-2">keystone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a receipt.</h1>
          <p className="text-neutral-400 text-sm mb-6">hash a local file in the tab. no upload unless you take the id to drop later. not a vault clone.</p>
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center cursor-pointer hover:bg-white/[0.05] transition-colors">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-sm text-neutral-300">drop a file or tap to pick</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {hash && (
            <div className="mt-6 space-y-3">
              <p className="text-white text-sm truncate">{name}</p>
              <p className="text-xs text-neutral-500">{(size / 1024).toFixed(1)} kb</p>
              <p className="text-[11px] text-neutral-400 break-all font-mono">{hash}</p>
              <pre className="text-xs text-neutral-400 bg-black/30 rounded-2xl p-4 whitespace-pre-wrap">{receipt}</pre>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(receipt);
                    setCopied('receipt copied');
                  }}
                  className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
                >
                  copy receipt
                </button>
                {id && (
                  <button
                    onClick={async () => {
                      const url = shareUrls(id).embed;
                      await navigator.clipboard.writeText(url);
                      setCopied('embed preview copied — drop the file on harbor to make it live');
                    }}
                    className="px-5 py-2.5 rounded-full bg-white/5 text-sm"
                  >
                    copy preview embed
                  </button>
                )}
              </div>
              {copied && <p className="text-xs text-neutral-500">{copied}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
