import atelier from '../lib/endpoints/atelier.js';
import beacon from '../lib/endpoints/beacon.js';
import card from '../lib/endpoints/card.js';
import catfall from '../lib/endpoints/catfall.js';
import cathead from '../lib/endpoints/cathead.js';
import chock from '../lib/endpoints/chock.js';
import crosstree from '../lib/endpoints/crosstree.js';
import desk from '../lib/endpoints/desk.js';
import embed from '../lib/endpoints/embed.js';
import ferry from '../lib/endpoints/ferry.js';
import forefoot from '../lib/endpoints/forefoot.js';
import jackstay from '../lib/endpoints/jackstay.js';
import ketch from '../lib/endpoints/ketch.js';
import luff from '../lib/endpoints/luff.js';
import docket from '../lib/endpoints/docket.js';
import quire from '../lib/endpoints/quire.js';
import nightglass from '../lib/endpoints/nightglass.js';
import quarter from '../lib/endpoints/quarter.js';
import quay from '../lib/endpoints/quay.js';
import ribbon from '../lib/endpoints/ribbon.js';
import scuttle from '../lib/endpoints/scuttle.js';
import selvage from '../lib/endpoints/selvage.js';
import share from '../lib/endpoints/share.js';
import signal from '../lib/endpoints/signal.js';
import stay from '../lib/endpoints/stay.js';
import tide from '../lib/endpoints/tide.js';
import tiller from '../lib/endpoints/tiller.js';
import vesper from '../lib/endpoints/vesper.js';
import wall from '../lib/endpoints/wall.js';
import spunyarn from '../lib/endpoints/spunyarn.js';
import shelf from './shelf.js';
import handoff from '../lib/endpoints/handoff.js';
import wick from '../lib/endpoints/wick.js';
import slip from '../lib/endpoints/slip.js';
import cask from '../lib/endpoints/cask.js';
import tender from '../lib/endpoints/tender.js';
import holdfast from '../lib/endpoints/holdfast.js';
import deadlight from '../lib/endpoints/deadlight.js';
import wayleave from '../lib/endpoints/wayleave.js';
import quoin from '../lib/endpoints/quoin.js';
import newel from '../lib/endpoints/newel.js';
import latch from '../lib/endpoints/latch.js';
import grommet from '../lib/endpoints/grommet.js';
import splice from '../lib/endpoints/splice.js';
import vellum from '../lib/endpoints/vellum.js';
import thimble from '../lib/endpoints/thimble.js';
import sheave from '../lib/endpoints/sheave.js';

const routes = {
  atelier, beacon, card, catfall, cathead, chock, crosstree, desk, embed, ferry, forefoot,
  docket, jackstay, ketch, luff, nightglass, quarter, quay, scuttle, selvage, quire, share, signal, stay, tide,
  tiller, vesper, wall, ribbon, loom: ribbon,
  spunyarn, eyelet: spunyarn,
  shelf, board: shelf, receipt: shelf, satchel: shelf,
  ashlar: shelf, tympanum: shelf, nosing: shelf,
  sill: shelf, keepsake: shelf, lintel: shelf, oriel: shelf,
  trundle: shelf, coping: shelf, springline: shelf,
  handoff, proof: handoff, quiet: handoff,
  wick,
  slip,
  cask,
  stave: cask,
  tender,
  gangway: tender,
  holdfast,
  clew: holdfast,
  deadlight,
  beeswax: deadlight,
  wayleave,
  quoin,
  rebate: quoin,
  newel,
  latch,
  hasp: latch,
  grommet,
  ring: grommet,
  splice,
  serving: splice,
  vellum,
  vellumboard: vellum,
  thimble,
  thimbles: thimble,
  sheave,
  coak: sheave,
  sheaveboard: sheave,
};

export default function handler(req, res) {
  const fromQuery = (req.query && req.query.name) || '';
  const path = (req.url || '').split('?')[0];
  const fromPath = path.split('/').filter(Boolean).pop() || '';
  const name = String(fromQuery || fromPath || 'desk').toLowerCase();
  const fn = routes[name] || desk;
  return fn(req, res);
}
