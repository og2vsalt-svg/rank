import { motion } from 'framer-motion';

const items = [
  { title: 'quiet lumen desk', href: '/quietlumendesk', body: 'Drop local files. They float as soft glowing orbs of frosted glass with gentle upward spring motion and live image previews. Individual notes or a shared caption. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.' },
  { title: 'quiet cove', href: '/quietcove', body: 'Gather several quiet notes, each with an optional local file and live preview. Batch-publish the collection to the database. Every link carries a polished Discord embed. Soft size warnings only. No hard limits. All prior desks remain fully intact. No traces of boosting.' },
  { title: 'quiet apple lumen', href: '/quietapplelumen', body: 'Drop local files into a refined lumen of frosted glass. Gentle spring motion, Apple-style pacing, shared caption. Batch publish to the database. Every link unfurls a polished Discord embed. Large files warned for possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.' },
  { title: 'quiet ember', href: '/quietember', body: 'Drop local files. They settle as soft glowing embers of frosted glass with gentle upward spring motion and warm light. Individual notes or a shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact. No traces of boosting.' },
  { title: 'quiet vale', href: '/quietvale', body: 'Drop local files. They settle into a soft vale of frosted glass with gentle spring motion. Individual notes or a shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact. No traces of boosting.' },
  { title: 'quiet link', href: '/quietlink', body: 'Share any URL with a custom polished Discord embed. Set title, description, and optional image. Soft warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet weave', href: '/quietweave', body: 'Drop local files. They settle as interwoven frosted glass strands with gentle spring motion. Individual notes or a shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet shared journal', href: '/quietsharedjournal', body: 'Dated quiet entries that live in the browser and can be published as one share. Optional file attachment on the latest entry. Spring-animated frosted glass, polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet lumenfold', href: '/quietlumenfold', body: 'Soft folds of light for local files. Drop several at once. Each can carry its own quiet note, or share one caption across them. They settle as gentle frosted glass folds with spring motion. Batch-publish to the shared database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet twilight', href: '/quiettwilight', body: 'Drop local files into the soft blue-purple dusk. They settle as gentle frosted glass orbs with upward spring motion and a quiet glow. Shared note, twilight accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet meridian', href: '/quietmeridian', body: 'Drop local files. They settle along a quiet meridian of balanced frosted glass cards with gentle spring motion. Shared caption, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet cascade', href: '/quietcascade', body: 'Drop local files. They cascade into soft frosted glass cards with staggered spring motion, then batch-publish to the database. Each returns a polished Discord embed. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet reflect', href: '/quietreflect', body: 'A still mirror for what you carry. Drop local files. They settle as soft mirrored glass cards with gentle reflection spring motion on frosted glass. Shared caption, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet equinox', href: '/quietequinox', body: 'Drop local files into balanced dual columns of frosted glass with gentle spring motion. Shared caption and cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet stillroom', href: '/quietstillroom', body: 'A quiet stillroom for compositions. Write a note or drop local files. They settle as soft glowing cards with gentle spring motion on frosted glass. Shared caption, cool accent. Publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet reliquary', href: '/quietreliquary', body: 'Seal local files into soft floating glass orbs with upward spring motion. Shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.' },
  { title: 'quiet studio', href: '/quietstudio', body: 'Compose a refined share. Drop a local file, shape title and caption, see a live Discord-style card preview, then publish to the database. Soft size warnings only. No hard limits. Spring-animated frosted glass. All prior desks remain.' },
  { title: 'quiet nexus', href: '/quietnexus', body: 'Calm central hub for quick drops, recent public shares, and navigation to all desks. Spring-animated frosted glass cards. Soft size warnings only. No hard limits. Polished Discord embeds on every share.' },
  { title: 'quiet manuscript', href: '/quietmanuscript', body: 'Compose a quiet note or drop a single local file with live preview. Shared caption and warm accent. Publish to the database with a polished Discord embed. Soft size warnings only. No hard limits.' },
  { title: 'quiet nimbus', href: '/quietnimbus', body: 'Drop local files into a soft nimbus of floating light. They settle as gentle orbs of frosted glass with spring motion. Shared caption and cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.' },
  { title: 'quiet portfolio', href: '/quietportfolio', body: 'Refined multi-file portfolio grid with live image previews that settle into spring-animated frosted glass cards. Per-file or shared captions. Batch-publish to the database with polished Discord embeds. Soft size warnings only.' },
  { title: 'quiet forge', href: '/quietforge', body: 'Drop local files with live image previews that settle into spring-animated frosted glass cards. Batch-publish to the database with polished Discord embeds. Soft size warnings only.' },
  { title: 'quiet current', href: '/quietcurrent', body: 'Drop local files into a soft flowing current of spring-animated frosted glass cards. Batch-publish to the database with polished Discord embeds. Soft size warnings only.' },
  { title: 'quiet shore', href: '/quietshore', body: 'Drop local files that wash onto a soft shore of spring-animated frosted glass cards. Live public shares gather like gentle waves. Batch share to the database, polished Discord embeds on every link. Soft size warnings only.' },
  { title: 'quiet zephyr', href: '/quietzephyr', body: 'Drop local files that drift like a soft breeze. Gentle floating particles and spring motion on frosted glass. Batch share to the database, polished Discord embeds on every link. Soft size warnings only.' },
  { title: 'quiet prism', href: '/quietprism', body: 'Drop local files as soft refracting prism shards. Gentle light beams and spring motion on frosted glass. Batch share to the database, polished Discord embeds on every link. Soft size warnings only.' },
  { title: 'quiet drift', href: '/quietdrift', body: 'Drop local files as soft drifting clouds. Gentle floating motion and spring animations on frosted glass. Batch share to the database, polished Discord embeds on every link. Soft size warnings only.' },
  { title: 'quiet embers', href: '/quietembers', body: 'Drop local files as soft glowing embers. Gentle floating pulse and spring motion on frosted glass. Batch share to the database, polished Discord embeds on every link. Soft size warnings only.' },
  { title: 'quiet ribbon', href: '/quietribbon', body: 'Drop local files into a flowing ribbon of frosted glass cards. Soft spring motion, batch share to the database, polished Discord embeds on every link. Soft size warnings only.' },
  { title: 'soft quiet chronicle', href: '/softquietchronicle', body: 'Dated quiet notes and optional files that settle into the database. Each entry returns a polished Discord embed. Soft slow warnings only. No hard limits.' },
  { title: 'lumen orbit', href: '/lumenorbit', body: 'Files settle into a quiet orbit. Multi-file drop with shared caption and accent. Soft spring motion, Discord embeds. Soft size warnings only.' },
  { title: 'canvas note', href: '/canvasnote', body: 'Draw a quiet note on dark glass. Share the image to the database with a polished Discord card. Soft warnings only.' },
  { title: 'quiet timeline', href: '/quiettimeline', body: 'Calm vertical stream of recent public shares. Spring-entry cards. Every link carries a professional Discord embed.' },
  { title: 'soft quiet lumen', href: '/softquietlumen', body: 'Let files glow into place. Multi-file local upload with shared caption and warm accent. Soft pulsing glow, spring motion, Discord embeds. Soft size warnings only.' },
  { title: 'soft quiet harbor', href: '/softquietharbor', body: 'Files settle like boats in a quiet harbor. Multi-file drops with shared note and ripples. Lands in the database with polished Discord cards. No hard limits.' },
  { title: 'quiet notes', href: '/quietnotes', body: 'A small desk for short text notes. Upload plain text to the database with professional Discord embeds. Soft warnings only. All prior file desks remain.' },
  { title: 'soft quiet atrium', href: '/softquietatrium', body: 'Settle under quiet light shafts. Drop local files. Soft shafts of light, spring motion, Discord embeds on shares. Soft size warnings only.' },
  { title: 'soft quiet vault', href: '/softquietvault', body: 'Private local vault with cloud shares. Upload to database, professional Discord cards. Large files warned, never refused.' },
  { title: 'public board', href: '/publicboard', body: 'Browse recent public shares. Polished embeds, human-crafted animations.' },
  { title: 'soft quiet constellation', href: '/softquietconstellation', body: 'Connect files among the stars. Multi-file drops with linked glass stars and spring animations.' },
  { title: 'soft quiet meadow', href: '/softquietmeadow', body: 'Blooming glass flowers for your files. Each can hold notes. Discord-ready links.' },
  { title: 'soft quiet veil', href: '/softquietveil', body: 'Settle files behind soft light layers. Translucent motion, embeds on every share.' },
  { title: 'direct share', href: '/directshare', body: 'Upload a local file straight to the database and get a pro Discord embed link instantly. Soft warnings for large drops.' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight mb-2">specialized desks</h2>
        <p className="text-neutral-400 text-sm mb-8">quiet desks for files and notes. each keeps prior features. discord embeds on shares. soft warnings only. no hard limits.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href={item.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 20 }}
              className="glass rounded-2xl p-5 block hover:bg-white/5 transition"
            >
              <p className="text-sm font-medium mb-1.5">{item.title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.a>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-6 text-center">All prior desks and features remain fully intact. New ones added carefully. Human-crafted Apple-style animations throughout.</p>
      </div>
    </section>
  );
}
