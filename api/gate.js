import beacon from '../lib/handlers/beacon.js';
import card from '../lib/handlers/card.js';
import catfall from '../lib/handlers/catfall.js';
import cathead from '../lib/handlers/cathead.js';
import chock from '../lib/handlers/chock.js';
import desk from '../lib/handlers/desk.js';
import embed from '../lib/handlers/embed.js';
import ferry from '../lib/handlers/ferry.js';
import forefoot from '../lib/handlers/forefoot.js';
import ketch from '../lib/handlers/ketch.js';
import luff from '../lib/handlers/luff.js';
import quarter from '../lib/handlers/quarter.js';
import selvage from '../lib/handlers/selvage.js';
import share from '../lib/handlers/share.js';
import signal from '../lib/handlers/signal.js';
import stay from '../lib/handlers/stay.js';
import tide from '../lib/handlers/tide.js';
import vesper from '../lib/handlers/vesper.js';
import wall from '../lib/handlers/wall.js';
import scuttle from '../lib/handlers/scuttle.js';

const dedicated = {
  beacon, card, catfall, cathead, chock, desk, embed, ferry, forefoot,
  ketch, luff, quarter, selvage, share, signal, stay, tide, vesper, wall, scuttle,
};

function first(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value == null ? '' : String(value);
}

export default async function handler(req, res) {
  const query = req.query || {};
  let name = first(query.desk).toLowerCase();
  if (!name) {
    const path = String(req.url || '').split('?')[0];
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'api' && parts[1] && parts[1] !== 'gate') name = parts[1].toLowerCase();
  }
  if (!dedicated[name]) {
    req.query = { ...query, desk: name || 'home', page: first(query.page) || name || 'home' };
    return desk(req, res);
  }
  return dedicated[name](req, res);
}
