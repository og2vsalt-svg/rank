import belaying from '../lib/routes/belaying.js';
import cleat from '../lib/routes/cleat.js';
import deadeye from '../lib/routes/deadeye.js';
import fairlead from '../lib/routes/fairlead.js';
import garboard from '../lib/routes/garboard.js';
import hounds from '../lib/routes/hounds.js';
import keelson from '../lib/routes/keelson.js';
import marline from '../lib/routes/marline.js';
import orlop from '../lib/routes/orlop.js';
import parcel from '../lib/routes/parcel.js';
import requests from '../lib/routes/requests.js';
import sounding from '../lib/routes/sounding.js';
import taffrail from '../lib/routes/taffrail.js';
import treenail from '../lib/routes/treenail.js';
import counter from '../lib/routes/counter.js';
import scupper from '../lib/routes/scupper.js';
import rider from '../lib/routes/rider.js';
import futtock from '../lib/routes/futtock.js';
import stringer from '../lib/routes/stringer.js';
import knee from '../lib/routes/knee.js';
import transom from '../lib/routes/transom.js';
import bumkin from '../lib/routes/bumkin.js';
import apostle from '../lib/routes/apostle.js';
import tumblehome from '../lib/routes/tumblehome.js';
import sheerstrake from '../lib/routes/sheerstrake.js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
function esc(s) {
  const amp = String.fromCharCode(38);
  return String(s || '')
    .replace(/&/g, amp + 'amp;')
    .replace(/</g, amp + 'lt;')
    .replace(/>/g, amp + 'gt;')
    .replace(/"/g, amp + 'quot;');
}
function deskName(req) {
  const q = String(req.query.desk || '').toLowerCase();
  if (q) return q;
  const path = String(req.url || '').split('?')[0];
  const part = path.split('/').filter(Boolean).pop() || '';
  return part.replace(/\.js$/, '');
}
async function sb(path, init) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init && init.headers) } });
}

async function notes(req, res, table, key) {
  if (req.method === 'GET') {
    const r = await sb(`${table}?select=*&order=created_at.desc&limit=40`);
    if (!r.ok) { res.status(502).json({ error: 'table did not answer', detail: (await r.text()).slice(0, 180) }); return; }
    res.status(200).json({ ok: true, [key]: await r.json() });
    return;
  }
  if (req.method === 'POST') {
    const body = bodyOf(req);
    const text = String(body.body || '').trim();
    if (!text) { res.status(400).json({ error: 'write a line first' }); return; }
    const row = { id: uid(), body: text.slice(0, 2000), author: body.author ? String(body.author).slice(0, 80) : null, tone: body.tone || 'note' };
    const r = await sb(table, { method: 'POST', body: JSON.stringify(row) });
    if (!r.ok) { res.status(502).json({ error: 'could not file the note', detail: (await r.text()).slice(0, 180) }); return; }
    const rows = await r.json();
    res.status(200).json({ ok: true, note: Array.isArray(rows) ? rows[0] : rows });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
}

async function ferry(req, res) {
  if (req.method === 'GET') {
    const id = String(req.query.id || '').trim();
    if (!id) { res.status(400).json({ error: 'missing id' }); return; }
    const roomRes = await sb(`ferry_rooms?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const rooms = await roomRes.json();
    if (!roomRes.ok || !rooms[0]) { res.status(404).json({ error: 'room not found' }); return; }
    const itemRes = await sb(`ferry_items?room_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc`);
    const items = await itemRes.json();
    res.status(200).json({ ok: true, room: rooms[0], items: Array.isArray(items) ? items : [] });
    return;
  }
  if (req.method === 'POST') {
    const body = bodyOf(req);
    if (body.roomId && body.item) {
      const item = { id: uid(), room_id: String(body.roomId).slice(0, 64), share_id: body.item.shareId || null, name: String(body.item.name || 'file').slice(0, 512), mime: body.item.mime || null, size: Number(body.item.size) || 0, file_url: body.item.fileUrl || null };
      const up = await sb('ferry_items', { method: 'POST', body: JSON.stringify(item) });
      const rows = await up.json().catch(() => null);
      if (!up.ok) { res.status(502).json({ error: 'item not saved' }); return; }
      res.status(200).json({ ok: true, item: Array.isArray(rows) ? rows[0] : item });
      return;
    }
    const room = { id: uid(), title: String(body.title || 'untitled room').slice(0, 140), note: body.note ? String(body.note).slice(0, 2000) : null, author: body.author ? String(body.author).slice(0, 80) : null };
    const up = await sb('ferry_rooms', { method: 'POST', body: JSON.stringify(room) });
    const rows = await up.json().catch(() => null);
    if (!up.ok) { res.status(502).json({ error: 'room not saved' }); return; }
    res.status(200).json({ ok: true, room: Array.isArray(rows) ? rows[0] : room });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
}

async function margins(req, res) {
  if (req.method === 'GET') {
    const shareId = String(req.query.shareId || '').trim().slice(0, 64);
    if (!shareId) { res.status(400).json({ error: 'shareId required' }); return; }
    const r = await sb(`share_margins?share_id=eq.${encodeURIComponent(shareId)}&select=id,share_id,body,author,created_at&order=created_at.asc&limit=80`);
    if (!r.ok) { res.status(502).json({ error: 'margins table did not answer' }); return; }
    res.status(200).json({ ok: true, margins: await r.json() });
    return;
  }
  if (req.method === 'POST') {
    const body = bodyOf(req);
    const shareId = String(body.shareId || '').trim().slice(0, 64);
    const line = String(body.body || '').trim().slice(0, 500);
    if (!shareId || !line) { res.status(400).json({ error: 'shareId and body required' }); return; }
    const r = await sb('share_margins', { method: 'POST', body: JSON.stringify({ share_id: shareId, body: line, author: String(body.author || 'pintle').slice(0, 80) }) });
    if (!r.ok) { res.status(502).json({ error: 'margin was not written', detail: (await r.text()).slice(0, 180) }); return; }
    const rows = await r.json();
    res.status(200).json({ ok: true, margin: Array.isArray(rows) ? rows[0] : rows });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
}

async function waybill(req, res) {
  if (req.method === 'GET') {
    const id = String(req.query.id || '').trim();
    const url = id ? `waybills?id=eq.${encodeURIComponent(id)}&select=*&limit=1` : 'waybills?select=*&order=created_at.desc&limit=20';
    const r = await sb(url);
    if (!r.ok) { res.status(502).json({ error: 'waybills unreadable' }); return; }
    res.status(200).json({ ok: true, waybills: await r.json() });
    return;
  }
  if (req.method === 'POST') {
    const body = bodyOf(req);
    const destination = String(body.destination || '').trim().slice(0, 300);
    if (!destination) { res.status(400).json({ error: 'destination required' }); return; }
    const row = { id: String(body.id || uid()).slice(0, 64), destination, note: body.note ? String(body.note).slice(0, 800) : null, share_id: body.shareId ? String(body.shareId).slice(0, 64) : null, file_name: body.fileName ? String(body.fileName).slice(0, 240) : null, file_url: body.fileUrl ? String(body.fileUrl).slice(0, 2000) : null, author: body.author ? String(body.author).slice(0, 80) : null };
    const r = await sb('waybills', { method: 'POST', body: JSON.stringify(row) });
    if (!r.ok) { res.status(502).json({ error: (await r.text()).slice(0, 240) }); return; }
    const saved = await r.json();
    res.status(200).json({ ok: true, waybill: Array.isArray(saved) ? saved[0] : saved, card: '/waybill' });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
}

async function manifest(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'method not allowed' }); return; }
  const id = String(req.query.id || '').trim();
  const url = id ? `manifests?id=eq.${encodeURIComponent(id)}&select=*&limit=1` : 'manifests?select=id,title,note,author,accent,created_at&order=created_at.desc&limit=24';
  const r = await sb(url);
  if (!r.ok) { res.status(r.status).json({ error: await r.text() }); return; }
  res.status(200).json({ ok: true, manifests: await r.json() });
}

async function partners(req, res) {
  const board = String(req.query.board || 'main').slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'main';
  if (req.method === 'GET') {
    const r = await sb(`hawser_notes?board=eq.${encodeURIComponent(board)}&select=id,body,author,share_id,accent,created_at&order=created_at.desc&limit=40`);
    if (!r.ok) { res.status(502).json({ error: 'board read failed', notes: [] }); return; }
    res.status(200).json({ ok: true, notes: await r.json() });
    return;
  }
  if (req.method === 'POST') {
    const body = bodyOf(req);
    const text = String(body.body || '').trim().slice(0, 500);
    if (!text) { res.status(400).json({ error: 'line required' }); return; }
    const name = String(body.board || board).slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'main';
    const row = { id: uid(), board: name, body: text, author: body.author ? String(body.author).slice(0, 40) : null, share_id: body.shareId ? String(body.shareId).slice(0, 64) : null, accent: '#30D158' };
    const r = await sb('hawser_notes', { method: 'POST', body: JSON.stringify(row) });
    if (!r.ok) { res.status(502).json({ error: await r.text() }); return; }
    res.status(200).json({ ok: true, id: row.id, card: `/partners?b=${name}` });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
}

async function capstan(req, res) {
  if (req.method === 'GET') {
    const id = String(req.query.id || '').trim();
    const url = id ? `capstan_watches?id=eq.${encodeURIComponent(id)}&select=*&limit=1` : 'capstan_watches?select=id,title,note,share_id,file_name,created_at&order=created_at.desc&limit=30';
    const r = await sb(url);
    if (!r.ok) { res.status(200).json({ ok: true, watches: [], detail: 'watch table not ready yet. a filed drop still unfurls at /s.' }); return; }
    const rows = await r.json();
    res.status(200).json({ ok: true, watches: rows });
    return;
  }
  if (req.method === 'POST') {
    const body = bodyOf(req);
    const title = String(body.title || 'watch').trim().slice(0, 140);
    const row = { id: uid(), title, note: body.note ? String(body.note).slice(0, 500) : null, share_id: body.shareId ? String(body.shareId).slice(0, 64) : null, file_name: body.fileName ? String(body.fileName).slice(0, 240) : null, author: 'capstan' };
    const r = await sb('capstan_watches', { method: 'POST', body: JSON.stringify(row) });
    if (!r.ok) {
      res.status(200).json({ ok: true, id: row.id, fallback: true, card: row.share_id ? `/s/${row.share_id}` : '/capstan', detail: 'watch table missing. the file card still works.' });
      return;
    }
    res.status(200).json({ ok: true, id: row.id, card: `/capstan/${row.id}` });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
}

function cardHtml({ title, desc, url, image }) {
  const img = image && /^https?:\/\//i.test(image) ? image : 'https://og2vsalt-svg.github.io/rank/og.png';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>${esc(title)}</title><meta name="description" content="${esc(desc)}" /><meta name="theme-color" content="#64D2FF" /><meta property="og:type" content="website" /><meta property="og:site_name" content="rankvault" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(desc)}" /><meta property="og:image" content="${esc(img)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:url" content="${esc(url)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(desc)}" /><meta name="twitter:image" content="${esc(img)}" /></head><body style="margin:0;background:#050506;color:#f5f5f7;font-family:Inter,system-ui,-apple-system,sans-serif;padding:64px 28px"><p style="opacity:.55;letter-spacing:.08em;text-transform:uppercase;font-size:13px">rankvault</p><h1 style="letter-spacing:-.04em">${esc(title)}</h1><p style="color:#a1a1aa">${esc(desc)}</p><script>if(!/discord|bot|embed|preview/i.test(navigator.userAgent||'')) location.replace(${JSON.stringify(url)});</script></body></html>`;
}

async function one(table, id, select) {
  const r = await sb(`${table}?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`);
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function sendCard(req, res, card, dest) {
  const ua = String(req.headers['user-agent'] || '');
  if (!/discord|bot|embed|preview|slack|twitter|facebook/i.test(ua) && req.query.embed !== '1') {
    res.status(302).setHeader('Location', dest);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).send(cardHtml({ ...card, url: dest }));
}

async function paircard(req, res) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const breastwork = String(req.query.breastwork || '').trim();
  const scantling = String(req.query.scantling || '').trim();
  const page = String(req.query.page || '').trim().toLowerCase();
  let title = 'rankvault';
  let desc = 'quiet file hosting. discord cards on every link.';
  let dest = `${proto}://${host}/`;
  let image;
  if (breastwork) {
    const row = await one('breastworks', breastwork, 'id,title,note,left_name,right_name');
    dest = `${proto}://${host}/#breastwork?f=${encodeURIComponent(breastwork)}`;
    title = row ? `${row.title} — rankvault` : 'breastwork — rankvault';
    desc = row ? `${row.note || ''} ${[row.left_name, row.right_name].filter(Boolean).join(' · ')}`.trim() : 'two local files, filed side by side.';
  } else if (scantling) {
    const row = await one('scantlings', scantling, 'id,label,note,share_id,width,height,bytes');
    dest = `${proto}://${host}/#scantling?f=${encodeURIComponent(scantling)}`;
    title = row ? `${row.label} — rankvault` : 'scantling — rankvault';
    desc = row ? `${row.note || 'a measure filed with the local file'}` : 'a measure filed with the local file.';
    if (row && row.share_id) {
      const share = await one('public_shares', row.share_id, 'mime,file_url');
      if (share && String(share.mime || '').startsWith('image/') && /^https?:\/\//i.test(share.file_url || '')) image = share.file_url;
    }
  } else if (page) {
    dest = `${proto}://${host}/#${encodeURIComponent(page)}`;
    title = `${page} — rankvault`;
    desc = 'discord unfurls this desk. older routes stay put.';
  }
  await sendCard(req, res, { title, desc, image }, dest);
}

async function spirket(req, res) {
  const id = String(req.query.id || '').trim();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const row = id ? await one('spirkets', id, 'id,recipient,note,share_id,accent') : null;
  const dest = id ? `${proto}://${host}/#spirketing?f=${encodeURIComponent(id)}` : `${proto}://${host}/#spirketing`;
  const title = row ? `${row.recipient} — rankvault` : 'spirketing — rankvault';
  const desc = row ? `${row.note}${row.share_id ? ' · file attached' : ''}` : 'a handover slip. optional local file lands in the share table.';
  await sendCard(req, res, { title, desc }, dest);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const desk = deskName(req);
  try {
    if (desk === 'cuddy') return notes(req, res, 'cuddy_notes', 'notes');
    if (desk === 'ferry') return ferry(req, res);
    if (desk === 'margins') return margins(req, res);
    if (desk === 'waybill') return waybill(req, res);
    if (desk === 'manifest') return manifest(req, res);
    if (desk === 'partners') return partners(req, res);
    if (desk === 'capstan') return capstan(req, res);
    if (desk === 'paircard') return paircard(req, res);
    if (desk === 'spirket') return spirket(req, res);

    const routed = { belaying, cleat, deadeye, fairlead, garboard, hounds, keelson, marline, orlop, parcel, requests, sounding, taffrail, treenail, counter, scupper, rider, futtock, stringer, knee, transom, bumkin, apostle, tumblehome, sheerstrake };
    if (routed[desk]) return routed[desk](req, res);
    res.status(404).json({ error: 'unknown desk' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'desk failed' });
  }
}
