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
  return String(s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/\"/g, '"');
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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const desk = deskName(req);
  try {
    const routed = { belaying, cleat, deadeye, fairlead, garboard, hounds, keelson, marline, orlop, parcel, requests, sounding, taffrail, treenail, counter, scupper };
    if (routed[desk]) return routed[desk](req, res);
    res.status(404).json({ error: 'unknown desk' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'desk failed' });
  }
}
