import volute from '../lib/endpoints/volute.js';
import courier from '../lib/endpoints/courier.js';
import tally from '../lib/endpoints/tally.js';
import desk from '../lib/endpoints/desk.js';

const extra = { courier, tally };

export default async function handler(req, res) {
  const fromQuery = (req.query && req.query.name) || '';
  const path = (req.url || '').split('?')[0];
  const fromPath = path.split('/').filter(Boolean).pop() || '';
  const name = String(fromQuery || fromPath || '').toLowerCase();
  if (extra[name]) return extra[name](req, res);
  const gate = await import('../lib/endpoints/desk.js');
  return desk(req, res);
}
