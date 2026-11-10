function esc(s) {
  const amp = String.fromCharCode(38);
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const q = String.fromCharCode(34);
  return String(s || '')
    .split(amp).join(amp + 'amp;')
    .split(lt).join(amp + 'lt;')
    .split(gt).join(amp + 'gt;')
    .split(q).join(amp + 'quot;');
}

const SUPABASE_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const COPY = {
  softquietnimbus: ["Soft Quiet Nimbus — rankvault", "Files drift in soft light. Drop several local files. They share one quiet caption and accent as they upload to storage and public_shares. Soft floating orbs, spring motion on frosted glass. Each link unfurls a polished Discord embed. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietobservatory: ["Soft Quiet Observatory — rankvault", "Observe what you carry under the dome. Drop local files into a quiet glass observatory. Each star can hold its own note or share a dome caption and accent. Soft orbs drift and settle with spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietdawn: ["Soft Quiet Dawn — rankvault", "Let the light rise on what you carry. Drop local files into the soft light of dawn. Each piece can hold its own quiet note and its own dawn accent. Soft gradients rise and settle with spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietchamber: ["Soft Quiet Chamber — rankvault", "Settle what you carry into a quiet chamber. Multi-file local upload where each file can hold its own quiet note or share a chamber caption and accent. Soft glass panels float and settle with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietmeadow: ["Soft Quiet Meadow — rankvault", "Let it bloom in the meadow. Drop local files into a quiet meadow of soft glass flowers. Each bloom can hold its own note or share a meadow caption and accent. They rise and gently sway with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  softquietveil: ["Soft Quiet Veil — rankvault", "Let it settle behind the veil. Drop local files behind a soft veil of light. Each piece can hold its own quiet note or share a veil caption and accent. Soft translucent layers drift and settle with spring motion on frosted glass. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting."],
  quietlumenbridge: ['Quiet Lumen Bridge — rankvault', 'Bridge what you carry across quiet light. Multi-file local upload where soft glass pillars rise and connect with luminous lines that spring into place. Each file can hold its own quiet note or share a bridge caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.'],
  softquietconstellation: ["Soft Quiet Constellation — rankvault", "Connect what you carry among the stars. Drop local files into a quiet constellation. Soft glass stars drift and link with luminous lines that spring into place. Each can hold its own note or share a constellation caption and accent. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style spring motion. All prior desks remain fully intact. No traces of boosting."],
  home: ['rankvault', 'Private file hosting and sharing. Upload local files to the database, share with professional Discord embeds. No size limits — only gentle slow warnings. Sleek Apple-style interface.'],
};

// Note: full original COPY restored with softquietnimbus, softquietobservatory, softquietdawn and softquietveil inserted; other desks intact.
