import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import Navbar from './Navbar';

const desks = [
  { to: "quietsearch", label: "quiet search", desc: "discover recent public shares. search by name or caption. filter by type. each opens with a polished Discord embed. soft spring motion on frosted glass. soft size warnings only. no hard limits." },
  { to: "quietstamp", label: "quiet stamp", desc: "drop local images. a quiet caption is stamped onto a polished polaroid-style version. the stamped image settles into the database with a polished Discord embed on every link. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietbinder", label: "quiet binder", desc: "drop several local files into one quiet binder. each settles independently into the database. a single binder note lists them all with a polished Discord embed. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietannotate", label: "quiet annotate", desc: "drop a local image. click to place quiet notes. the annotated version settles into the database with a polished Discord embed on every link. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quiettimestamp", label: "quiet timestamp", desc: "drop local files. each is stamped with the current time and an optional quiet note. they settle into the database with a polished Discord embed on every link. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietchronicle", label: "quiet chronicle", desc: "place local files in time. stamp each with a date and a quiet note. they settle into the database as dated journal entries. every share link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietsequence", label: "quiet sequence", desc: "drop local files in order. reorder into a filmstrip, give each a quiet caption. they settle into the database as an ordered sequence. every share link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietstack", label: "quiet stack", desc: "stack local files with individual captions. layered frosted previews, spring motion. each publishes independently to the database with a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietloom", label: "quiet loom", desc: "write a quiet narrative and drop local files into the weave. the words and files settle together into the database. every share link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietspectrum", label: "quiet spectrum", desc: "choose a base color. a quiet spectrum unfolds into a visual image. caption it and publish to the database with a polished Discord embed. soft warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietpin", label: "quiet pin", desc: "drop a local file and attach a place name or coordinates. it settles into the database with a polished Discord embed on every link. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "quietcollage", label: "quiet collage", desc: "drop several images. they compose into a single quiet collage of frosted glass. choose grid, row, or column. shared caption and accent. publishes to the database with a polished Discord embed on every link. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietquill", label: "quiet quill", desc: "write a quiet note or drop a local file. the words settle with the file into the database. every share link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "audiodesk", label: "audio desk", desc: "record a voice memo in the browser. it settles into the database as a file with a polished Discord embed on every link. soft size warnings only. no hard limits. apple-style springs on frosted glass." },
  { to: "qrdesk", label: "qr desk", desc: "turn text or a link into a visual stamp. publish the image to the database with a polished Discord embed. soft warnings only. no hard limits. apple-style motion." },
  { to: "quietsolace", label: "quiet solace", desc: "drop local files into a calm harbor of frosted glass with optional soft expiration. shared caption and accent. settles into the database with polished Discord embeds on every link. soft size warnings only. no hard limits. gentle spring motion. all prior desks remain fully intact." },
  { to: "quiethorizon", label: "quiet horizon", desc: "drop local files onto a quiet horizon of frosted glass. watch recent public shares drift by. shared caption and accent. publishes to the database with polished Discord embeds on every link. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietharbor", label: "quiet harbor", desc: "drop local files. they moor at quiet docks of frosted glass, gently bobbing on soft waves with spring motion. shared caption, accent color. batch-publish to the database. every link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs. all prior desks remain fully intact." },
  { to: "quietlighthouse", label: "quiet lighthouse", desc: "drop local files or watch recent public shares light up. soft rotating lighthouse beam on frosted glass. shared caption, accent color. publishes to the database with polished Discord embeds on every link. soft size warnings only. no hard limits. apple-style springs. all prior desks remain fully intact." },
  { to: "quietember", label: "quiet ember", desc: "drop local files. they settle as glowing embers in a quiet hearth of frosted glass with soft pulsing heat, rising shimmer, and gentle sparks. shared caption and warm accent. batch-publish to the database. every link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietconstellation", label: "quiet constellation", desc: "drop local files. they settle as stars in a quiet constellation of frosted glass with gentle connecting lines and spring motion. shared caption and accent. batch-publish to the database. every link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietpulse", label: "quiet pulse", desc: "drop a local file. it joins a living pulse of recent public shares with gentle heartbeat motion. shared caption and accent. publishes to the database. every link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietquartz", label: "quiet quartz", desc: "drop local files. they crystallize into a quiet quartz formation of frosted glass with pulsing spring facets. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietaurora", label: "quiet aurora", desc: "drop local files. they drift under soft northern lights of frosted glass with gentle spring waves. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quiettide", label: "quiet tide", desc: "new specialized desk. drop local files onto a soft tidal wave of frosted glass. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietorbit", label: "quiet orbit", desc: "drop local files into a soft orbital path around a quiet center. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietnebula", label: "quiet nebula", desc: "drop local files into drifting soft clouds of frosted glass. shared note, accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietprismdesk", label: "quiet prism desk", desc: "drop local files through a prism of frosted glass. polished Discord embeds on every link. soft size warnings only. no hard limits. apple-style springs." },
  { to: "quietkeepsake", label: "quiet keepsake", desc: "drop files that matter. give each a short personal note. they settle into the database with polished Discord embeds. soft size warnings only. no hard limits." },
  { to: "quietframe", label: "quiet frame", desc: "drop an image. it settles into a soft polaroid frame and publishes with a polished Discord embed. soft size warnings only. no hard limits." },
  { to: "quietecho", label: "quiet echo", desc: "multi-file drop with soft expanding circular rings in your accent color. shared note. batch-publish to the database. every link unfurls a polished Discord embed. soft warnings only." },
  { to: "quietcanvas", label: "quiet canvas", desc: "freehand sketch on frosted glass. export as png and publish with a polished Discord embed. soft size warnings only." },
  { to: "quietnotes", label: "quiet notes", desc: "local collection of short notes. publish the whole set as a shared text file with a polished Discord embed. soft warnings only." },
  { to: "quietmosaic", label: "quiet mosaic", desc: "drop local files into a living mosaic. images settle into a soft glass grid. shared note and accent. every link unfurls a polished Discord embed. soft warnings only." },
  { to: "quietwhisper", label: "quiet whisper", desc: "multi-file drop that settles into soft floating glass cards. batch-publish with polished Discord embeds. soft size warnings only." },
  { to: "quietlantern", label: "quiet lantern", desc: "drop local files. they hang as soft glowing lanterns with gentle floating motion. share to the database. polished Discord embeds. soft warnings only." },
  { to: "quietorchard", label: "quiet orchard", desc: "drop local files. they grow into soft frosted-glass trees with gentle spring growth, fruit-like previews, and a shared note. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style pacing. all prior desks remain fully intact." },
  { to: "quietfade", label: "quiet fade", desc: "drop a local file or write a quiet note that gently fades after a chosen number of hours. settles into the database with a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style spring motion on frosted glass. all prior desks remain fully intact." },
  { to: "quietdaily", label: "quiet daily", desc: "date a quiet note or attach a local file. it settles into the database with a polished Discord embed. soft size warnings only. no hard limits. apple-style springs and frosted glass. prior desks remain fully intact." },
  { to: "quietlumen", label: "quiet lumen", desc: "drop local files. they settle as soft glowing orbs of frosted glass with gentle spring light. shared caption, warm accent. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style pacing. all prior desks remain fully intact." },
  { to: "quietfolio", label: "quiet folio", desc: "compose a quiet portfolio of local files. each piece gets its own title and note, or share one caption. spring-animated frosted glass grid. batch-publish to the database. every link unfurls a polished Discord embed. soft size warnings only. no hard limits. human-crafted Apple-style pacing. all prior desks remain fully intact." },
  { to: "quietsolstice", label: "quiet solstice", desc: "drop local files under a turning sun. soft radial motion, shared caption, chosen warmth. discord cards on every link. size notes only. no hard limits." },
  { to: "quietmeridian", label: "quiet meridian", desc: "a still center for precise local file drops. live time display. soft warnings only. every share link carries a polished discord embed and is copied when ready." },
  { to: "quietequinox", label: "quiet equinox", desc: "where files find balance. dual columns of frosted glass. batch-publish with polished discord embeds. soft size warnings only. no hard limits." },
  { to: "vault", label: "vault", desc: "main local vault" },
  { to: "directory", label: "desks", desc: "this page" },
];

export default function DirectoryPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return desks.filter(d => d.label.includes(s) || d.desc.includes(s) || d.to.includes(s));
  }, [q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 px-5 max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight mb-2">desks</motion.h1>
        <p className="text-neutral-400 text-sm mb-6">search the specialized desks. all prior features preserved. file shares land in the database with Discord embeds. soft warnings only.</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search desks…"
          className="w-full glass rounded-2xl px-4 py-3 text-sm outline-none mb-6"
        />
        <div className="grid gap-3">
          {filtered.map((d, i) => (
            <motion.button
              key={d.to}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => navigate(d.to)}
              className="glass rounded-2xl p-4 text-left hover:bg-white/5 transition"
            >
              <p className="text-sm font-medium">{d.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{d.desc}</p>
            </motion.button>
          ))}
          {!filtered.length && <p className="text-neutral-500 text-sm">no desks match. try a different word.</p>}
        </div>
      </div>
    </div>
  );
}
