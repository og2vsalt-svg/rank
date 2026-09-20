import { motion } from 'framer-motion';

const items = [
  {
    title: 'local-first vault',
    body: 'files live in your browser for this demo. nothing ships to a random box unless you copy a public link.',
  },
  {
    title: 'folders + favorites + pins',
    body: 'inbox by default. make folders, star keepers, pin the ones that should float to the top.',
  },
  {
    title: 'quiet share links',
    body: 'mark a file public and copy a hash link. optional expiry and a passcode so the drop dies or stays locked.',
  },
  {
    title: 'cloud share db',
    body: 'public drops can land in vercel blob so the link works on another device, not just this tab.',
  },
  {
    title: 'discord embeds',
    body: '/s/id pages serve og tags so discord, slack, and x preview the filename and image like a real product.',
  },
  {
    title: 'convert desk',
    body: 'remap png/jpg/webp in the tab. separate from the vault on purpose.',
  },
  {
    title: 'qr desk',
    body: 'turn a share url into a scannable square when typing the hash is mid.',
  },
  {
    title: 'clip rooms',
    body: 'stash raw text clips with their own links. not files, not notes, just a clipboard with memory.',
  },
  {
    title: 'paste or drop',
    body: 'cmd/ctrl-v a screenshot or file right into the vault. drag works too.',
  },
  {
    title: 'notes desk',
    body: 'a second surface that is just writing. not a file dump. titles, drafts, delete when you are done.',
  },
  {
    title: 'paste desk',
    body: 'publish raw text and grab a hash link. logs, configs, lyrics. lives next to the vault, not inside it.',
  },
  {
    title: 'quick drop',
    body: 'one page to upload a local file, park it in the vault db, and jump straight to a public share.',
  },
  {
    title: 'status pulse',
    body: 'see how many files and bytes this tab is holding. still no cap, just honesty.',
  },
  {
    title: 'no hard file cap',
    body: 'drop whatever size you want. we only warn when a file is so big the tab might feel sleepy.',
  },
  {
    title: 'apple-soft motion',
    body: 'springy buttons, glass cards, blur. supposed to feel like something a human actually designed.',
  },
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
