import { motion } from 'framer-motion';

const items = [
  { title: 'tannoy', body: 'hear a local clip as bars, then hang the original on the public board. discord unfurls /s.' },
  { title: 'sundial', body: 'a noon-stick from latitude and hour. stays in the tab.' },
  { title: 'parcel', body: 'tie a packing list of locals and ship only the manifesto.' },
  { title: 'millrace', body: 'send a local file down the channel into the share db. discord unfurls /s. not the vault grid.' },
  { title: 'lychgate', body: 'walk a pasted note out as a public .txt drop. a door, not a filing cabinet.' },
  { title: 'gantry', body: 'hoist a still in the tab, then publish the original when you are ready.' },
  { title: 'clew', body: 'wind three short notes into one thread and ship a single discord card.' },
  { title: 'meander', body: 'preview a still with its frame size, then dock the original in the share db. discord unfurls /s.' },
  { title: 'ford', body: 'weigh two locals in the tab and publish only the heavier crossing.' },
  { title: 'oriel', body: 'peek at name, type, and size locally. nothing uploads from this desk.' },
  { title: 'gesso', body: 'prime a 1200x630 card and file it so discord unfurls cleanly.' },
  { title: 'reliquary', body: 'keep a sha-256 of the thing. only the receipt goes public.' },
  { title: 'harbor', body: 'tie a pile to the dock and send each file out as its own share-db drop.' },
  { title: 'ledger', body: 'read what already landed in supabase. not a vault — just the public log.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id plus /p/page and named paths serve og tags so discord previews look finished.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'nocturne', body: 'a dim writing pad that stays on this device.' },
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
              transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
