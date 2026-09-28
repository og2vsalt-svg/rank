import { motion } from 'framer-motion';

const items = [
  { title: 'pontoon pile', body: 'float several local files across. each one becomes its own public drop and discord /s card.' },
  { title: 'silt sieve', body: 'filter a pile by image, video, audio, or text, then settle one file into the share db.' },
  { title: 'latch phrase', body: 'optional pass on a public drop. friends need the phrase. discord still unfurls /s.' },
  { title: 'quay line', body: 'queue several locals and ship them one after another, each with its own embed path.' },
  { title: 'mosaic card', body: 'tile stills into a single jpeg, then drop that card into the share db.' },
  { title: 'ledger', body: 'read what already landed in supabase. not a vault — just the public log.' },
  { title: 'locket + relay', body: 'frame one still, or hand a file across with a clock. both mint discord cards.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id plus /f /x /d /go /open /card /link /v all serve og tags so previews look finished.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
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
