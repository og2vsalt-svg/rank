const handlers = {};

// Dynamic import for endpoints to keep prior features intact
async function loadHandler(name) {
  if (handlers[name]) return handlers[name];
  try {
    const mod = await import(`../lib/endpoints/${name}.js`);
    handlers[name] = mod.default || mod;
    return handlers[name];
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const name = String(req.query.name || '').trim();
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  const h = await loadHandler(name);
  if (!h) {
    res.status(404).json({ error: 'endpoint not found' });
    return;
  }
  return h(req, res);
}
