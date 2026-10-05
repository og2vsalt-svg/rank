import card from '../server/card.js';
import catfall from '../server/catfall.js';
import cathead from '../server/cathead.js';
import chock from '../server/chock.js';
import desk from '../server/desk.js';
import embed from '../server/embed.js';
import ferry from '../server/ferry.js';
import forefoot from '../server/forefoot.js';
import share from '../server/share.js';
import stay from '../server/stay.js';
import tide from '../server/tide.js';
import wall from '../server/wall.js';

const desks = {
  card,
  catfall,
  cathead,
  chock,
  desk,
  embed,
  ferry,
  forefoot,
  share,
  stay,
  tide,
  wall,
};

export default async function handler(req, res) {
  const q = req.query || {};
  const name = String(q.desk || 'embed');
  const fn = desks[name] || desks.embed;
  return fn(req, res);
}
