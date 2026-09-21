import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function OnyxPage() {
  const [text, setText] = useState('');

  useEffect(() => {
    setText(localStorage.getItem('rank_onyx') || '');
  }, []);

  useEffect(() => {
    localStorage.setItem('rank_onyx', text);
  }, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 min-h-[60vh]"
        >
          <p className="text-[#0a84ff] text-sm mb-2">onyx</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a dark room for drafts.</h1>
          <p className="text-neutral-400 text-sm mb-6">stays on this device. not a vault. just a quiet pad that does not shout.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="type anything. it stays here."
            className="w-full min-h-[40vh] bg-transparent outline-none text-[17px] leading-relaxed resize-none placeholder:text-neutral-600"
          />
          <p className="text-xs text-neutral-600 mt-4">{text.length} chars</p>
        </motion.div>
      </div>
    </div>
  );
}
