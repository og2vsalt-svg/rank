import { motion } from 'framer-motion';

const items = [
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'studio notes', body: 'write or paste text, publish it as a public file with a discord-ready /s link.' },
  { title: 'meadow batch', body: 'drop a pile of local files straight into the share db. get embed links, skip the vault grid.' },
  { title: 'lark cards', body: 'preview the exact discord unfurl before you paste a /s link in a server.' },
  { title: 'opal palette', body: 'sample colors from a still on this machine. never leaves the tab.' },
  { title: 'nest pack', body: 'bundle vault files into one json nest you can download and bring back later.' },
  { title: 'thorn pins', body: 'sticky local notes with zero file upload.' },
  { title: 'marrow listen', body: 'play a local track and park it in vault if you want to keep it.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id and /f/id serve og tags so discord previews the filename like a real product.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'apple-soft motion', body: 'springy buttons, glass cards, blur. supposed to feel human-made.' },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a vault that feels like it belongs on a phone.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl p-6 hover:-translate-y-0.5"
            >
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
