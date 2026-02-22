#!/usr/bin/env node
/**
 * Migration script: Upload base64 images/videos from message content to R2 CDN
 * and replace inline base64 data with CDN URLs.
 *
 * Run on the production server:
 *   node scripts/migrate-base64-to-r2.mjs
 *
 * Required env vars (already set in production):
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_KEY = process.env.CLOUDFLARE_API_KEY;
const CF_EMAIL = process.env.CLOUDFLARE_EMAIL;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'rabbithub-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CF_ACCOUNT_ID || !CF_API_KEY || !CF_EMAIL) {
  console.error('Missing Cloudflare R2 credentials');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const R2_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects`;
const cfHeaders = { 'X-Auth-Email': CF_EMAIL, 'X-Auth-Key': CF_API_KEY };

function supabaseFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || '',
      ...options.headers,
    },
  });
}

async function uploadToR2(base64Data, key, contentType) {
  const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  const resp = await fetch(`${R2_API}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { ...cfHeaders, 'Content-Type': contentType },
    body: buffer,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`R2 upload failed (${resp.status}): ${err}`);
  }

  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `https://images.rabbithub.ai/${key}`;
}

async function migrateMessage(msg) {
  let content = msg.content;
  let changed = false;
  const timestamp = Date.now();

  // Migrate images inside [GENERATED_IMAGE] markers
  const imageRegex = /\[GENERATED_IMAGE\]\n?([\s\S]*?)\n?\[\/GENERATED_IMAGE\]/g;
  let match;
  const replacements = [];

  while ((match = imageRegex.exec(content)) !== null) {
    const block = match[1];
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const newLines = [];
    let blockChanged = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('data:image/') || line.startsWith('data:application/')) {
        const mimeMatch = line.match(/^data:([^;]+);base64,/);
        const contentType = mimeMatch?.[1] || 'image/jpeg';
        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const key = `chats/${msg.chat_id}/generated/${timestamp}-${i}.${ext}`;

        try {
          const cdnUrl = await uploadToR2(line, key, contentType);
          newLines.push(cdnUrl);
          blockChanged = true;
          const sizeKB = Math.round(line.length * 0.75 / 1024);
          console.log(`  [OK] Image ${i} (${sizeKB}KB) -> ${key}`);
        } catch (err) {
          console.error(`  [FAIL] Image ${i}:`, err.message);
          newLines.push(line); // Keep original on failure
        }
      } else {
        newLines.push(line); // Already a URL, keep it
      }
    }

    if (blockChanged) {
      replacements.push({
        original: match[0],
        replacement: `[GENERATED_IMAGE]\n${newLines.join('\n')}\n[/GENERATED_IMAGE]`,
      });
      changed = true;
    }
  }

  // Migrate videos inside [GENERATED_VIDEO] markers
  const videoRegex = /\[GENERATED_VIDEO\]\n?([\s\S]*?)\n?\[\/GENERATED_VIDEO\]/g;
  while ((match = videoRegex.exec(content)) !== null) {
    const block = match[1];
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const newLines = [];
    let blockChanged = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('data:video/')) {
        const mimeMatch = line.match(/^data:([^;]+);base64,/);
        const contentType = mimeMatch?.[1] || 'video/mp4';
        const ext = contentType.split('/')[1] || 'mp4';
        const key = `chats/${msg.chat_id}/generated/${timestamp}-vid-${i}.${ext}`;

        try {
          const cdnUrl = await uploadToR2(line, key, contentType);
          newLines.push(cdnUrl);
          blockChanged = true;
          const sizeKB = Math.round(line.length * 0.75 / 1024);
          console.log(`  [OK] Video ${i} (${sizeKB}KB) -> ${key}`);
        } catch (err) {
          console.error(`  [FAIL] Video ${i}:`, err.message);
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    if (blockChanged) {
      replacements.push({
        original: match[0],
        replacement: `[GENERATED_VIDEO]\n${newLines.join('\n')}\n[/GENERATED_VIDEO]`,
      });
      changed = true;
    }
  }

  if (!changed) return false;

  // Apply replacements
  for (const r of replacements) {
    content = content.replace(r.original, r.replacement);
  }

  // Update message in DB
  const resp = await supabaseFetch(`/messages?id=eq.${msg.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
    prefer: 'return=minimal',
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`DB update failed: ${err}`);
  }

  return true;
}

async function main() {
  console.log('=== Base64 to R2 Migration ===\n');

  // Fetch messages with base64 data
  const resp = await supabaseFetch(
    '/messages?or=(content.like.*data:image*,content.like.*data:video*)&select=id,chat_id,content&order=created_at.asc'
  );

  if (!resp.ok) {
    console.error('Failed to fetch messages:', await resp.text());
    process.exit(1);
  }

  const messages = await resp.json();
  console.log(`Found ${messages.length} messages with base64 data\n`);

  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  for (const msg of messages) {
    console.log(`Processing message ${msg.id} (chat: ${msg.chat_id})...`);

    // Skip messages that don't have base64 inside markers
    if (!msg.content.includes('[GENERATED_IMAGE]') && !msg.content.includes('[GENERATED_VIDEO]')) {
      if (msg.content.includes('data:image/') || msg.content.includes('data:video/')) {
        console.log('  [SKIP] Base64 found outside markers - manual review needed');
        skipped++;
      }
      continue;
    }

    try {
      const wasChanged = await migrateMessage(msg);
      if (wasChanged) {
        migrated++;
        console.log('  [DONE] Updated with CDN URLs\n');
      } else {
        console.log('  [SKIP] No base64 data in markers\n');
        skipped++;
      }
    } catch (err) {
      console.error(`  [ERROR] ${err.message}\n`);
      failed++;
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);
}

main().catch(console.error);
