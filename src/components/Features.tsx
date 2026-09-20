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
    title: 'paste or drop',
    body: 'cmd/ctrl-v a screenshot or file right into the vault. drag works too.',
  },
  {
    title: 'snippets + notes',
    body: 'dump raw text as a .txt in one tap. tags and notes still sit on the preview sheet.',
  },
  {
    title: 'export the whole vault',
    body: 'download a json dump of everything on this device, or import one back. handy when you wipe a profile.',
  },
  {
    title: 'activity trail',
    body: 'a tiny recents list so you remember what you just dropped, moved, or purged.',
  },
  {
    title: 'no hard file cap',
    body: 'drop whatever size you want. we only warn when a file is so big the tab might feel sleepy.',
  },
  {
    title: 'batch download',
    body: 'select a pile and pull them down one by one. no fake cap, just a little wait if they are huge.',
  },
  {
    title: 'type filters + recents',
    body: 'jump to images, clips, audio, or docs. a recents strip keeps the last drops one tap away.',
  },
  {
    title: 'apple-soft motion',
    body: 'springy buttons, glass cards, blur. supposed to feel like something a human actually designed.',
  },
  {
    title: 'albums',
    body: 'group drops into albums on top of folders. same file can live in inbox and sit in a set.',
  },
  {
    title: 'keyboard + compact',
    body: 'slash to search, g/l to flip views, question mark for the cheat sheet. compact grid when the pile is huge.',
  },
  {
    title: 'storage split',
    body: 'see how much of the tab is images vs clips vs docs. still no cap, just honesty about lag.',
  },
  {
    title: 'batch star pin public',
    body: 'select a pile and favorite, pin, duplicate, or flip public in one tap. keeps the old single-file moves.',
  },
  {
    title: 'markdown + raw',
    body: 'copy a markdown link from the preview sheet, or open the raw data url in another tab.',
  },
  {
    title: 'peek text',
    body: 'txt and json snippets render inside the preview so you do not have to download first.',
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
