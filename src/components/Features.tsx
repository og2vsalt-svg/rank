import { motion } from 'framer-motion';

const items = [
  { title: 'folio cover', body: 'give a drop a title, publish one local file to the share db, copy the discord /s card.' },
  { title: 'whet names', body: 'preview cleaned filenames on device. no upload. tidy cards before you share.' },
  { title: 'mason bricks', body: 'publish a pile as separate public drops. each brick gets its own /s embed.' },
  { title: 'rafter glance', body: 'see how heavy this origin is. no cap, just a slowness warning when storage is stuffed.' },
  { title: 'gilt card', body: 'look up a live share id and copy a discord-ready /s link with metadata.' },
  { title: 'gnomon desk', body: 'read last-modified, type, and size of a local file, then publish it to the share db with a discord /s card.' },
  { title: 'laneway aliases', body: 'pin short names to live share ids. stays in this browser. discord still uses /s/id.' },
  { title: 'thimble note', body: 'type a tiny thing, drop it as a public .txt. not a vault grid.' },
  { title: 'kindling desk', body: 'attach a spark note to a local file, publish it to the share db, copy the discord /s card.' },
  { title: 'nave aisle', body: 'sign a drop if you want, then send one local file public. not another vault grid.' },
  { title: 'spur peek', body: 'look up a live share id and get metadata plus the embed url without opening the bytes.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'emberline grade', body: 'warm a photo on canvas, then publish the jpeg to the share db with a discord /s card.' },
  { title: 'driftwood hold', body: 'set a pause, drop a local file, wait, then let it go public. not a vault grid.' },
  { title: 'hinterland log', body: 'pin public share ids with a note. stays in this browser, links stay discord-ready.' },
  { title: 'solarium desk', body: 'one local file plus a caption, published to the share db. discord /s card, no vault grid.' },
  { title: 'wellspring receipt', body: 'one local file in, a discord /s card out. not a vault grid — just a receipt desk.' },
  { title: 'tide queue', body: 'line up local files and publish them one by one to the share db. discord /s links come back in order.' },
  { title: 'halo crop', body: 'circle-crop a photo on device. never hits the vault unless you drop the png later.' },
  { title: 'kite timer', body: 'park a share link and watch a countdown. no upload, just a clock.' },
  { title: 'studio notes', body: 'write or paste text, publish it as a public file with a discord-ready /s link.' },
  { title: 'meadow batch', body: 'drop a pile of local files straight into the share db. get embed links, skip the vault grid.' },
  { title: 'grove stands', body: 'bundle public share ids into named clumps that stay in this browser.' },
  { title: 'vellum desk', body: 'open a local text file, edit it, export a copy. never hits the vault unless you drop it later.' },
  { title: 'copper check', body: 'sha-256 two local files side by side so you know a download matches.' },
  { title: 'willow clean', body: 'redraw a photo on canvas so location and camera tags fall off. stays on device.' },
  { title: 'glacier print', body: 'freeze a sha-256 snapshot card for any local file. no upload.' },
  { title: 'lichen card', body: 'paint a 1200x630 png from a line of text. built for discord previews.' },
  { title: 'gully split', body: 'carve a local file into parts you can stash separately. no hard size cap.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id, /f/id, /d/id and /p/page serve og tags so discord previews look finished.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'summit stats', body: 'see how heavy this vault is, by kind, without sending a byte.' },
  { title: 'hopper rename', body: 'batch-rename a local pile and save copies. stays on device.' },
  { title: 'varnish mark', body: 'stamp a photo with a light watermark. canvas only.' },
  { title: 'plaza feed', body: 'latest public drops from the share db, each with a discord /s link.' },
  { title: 'gasket seal', body: 'hash two local files and see if they are the same bytes.' },
  { title: 'hatch drop', body: 'one file in, discord embed url out. same vault + cloud db as drop.' },
  { title: 'radar pulse', body: 'live counts of files, public links, folders, and recent vault activity.' },
  { title: 'tome notes', body: 'a writing desk that saves .txt straight into the vault instead of a file picker.' },
  { title: 'warden inspect', body: 'paste a share id and read metadata from the db without opening the file.' },
  { title: 'zenith board', body: 'a map of the rooms that are not just another vault grid.' },
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
