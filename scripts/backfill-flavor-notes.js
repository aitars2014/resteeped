#!/usr/bin/env node
/**
 * Backfill flavor_notes for all catalog teas using Claude (Anthropic API).
 *
 * Assigns 3-6 flavor note keywords per tea from the FlavorRadar vocabulary.
 * Uses Claude as a tea sommelier to infer flavor profiles from tea metadata.
 *
 * Usage:
 *   node scripts/backfill-flavor-notes.js
 *   node scripts/backfill-flavor-notes.js --dry-run
 *   node scripts/backfill-flavor-notes.js --limit 100 --offset 500
 *   node scripts/backfill-flavor-notes.js --concurrency 5
 *   node scripts/backfill-flavor-notes.js --overwrite   # re-process teas that already have flavor_notes
 *
 * Flags:
 *   --dry-run        Print results without writing to Supabase
 *   --limit N        Process only N teas
 *   --offset N       Start from offset (for manual pagination)
 *   --concurrency N  Parallel Claude API calls (default: 3)
 *   --overwrite      Also overwrite teas that already have flavor_notes (default: skip them)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Config ---

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CLAUDE_MODEL = 'claude-3-haiku-20240307';
const BATCH_SIZE = 50; // teas per Claude call
const MAX_RETRIES = 3;
const PROGRESS_FILE = path.join(__dirname, 'flavor-notes-progress.json');

// --- CLI Args ---

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const OVERWRITE = args.includes('--overwrite');
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const OFFSET = args.includes('--offset') ? parseInt(args[args.indexOf('--offset') + 1]) : 0;
const CONCURRENCY = args.includes('--concurrency')
  ? parseInt(args[args.indexOf('--concurrency') + 1])
  : 3;

// --- Allowed flavor vocabulary (keys from FLAVOR_MAPPING) ---

const ALLOWED_NOTES = [
  // Sweet
  'sweet', 'honey', 'caramel', 'malty', 'chocolate', 'vanilla', 'fruity',
  // Floral
  'floral', 'jasmine', 'rose', 'orchid', 'lavender', 'fragrant',
  // Vegetal
  'vegetal', 'grassy', 'fresh', 'green', 'herbaceous', 'spinach', 'seaweed',
  // Earthy
  'earthy', 'mineral', 'woody', 'mossy', 'forest', 'mushroom', 'wet',
  // Smoky
  'smoky', 'roasted', 'toasted', 'charred', 'campfire', 'burnt',
  // Astringent
  'astringent', 'bitter', 'tannic', 'dry', 'brisk', 'bold',
];

const ALLOWED_SET = new Set(ALLOWED_NOTES);

// --- System prompt for Claude ---

const SYSTEM_PROMPT = `You are an expert tea sommelier assigning flavor profiles to teas for a radar chart visualization. The chart has 6 dimensions: Sweet, Floral, Vegetal, Earthy, Smoky, and Astringent.

You will receive a JSON array of teas with their metadata. For each tea, assign 3-6 flavor note keywords from ONLY the following allowed vocabulary:

Sweet dimension: sweet, honey, caramel, malty, chocolate, vanilla, fruity
Floral dimension: floral, jasmine, rose, orchid, lavender, fragrant
Vegetal dimension: vegetal, grassy, fresh, green, herbaceous, spinach, seaweed
Earthy dimension: earthy, mineral, woody, mossy, forest, mushroom, wet
Smoky dimension: smoky, roasted, toasted, charred, campfire, burnt
Astringent dimension: astringent, bitter, tannic, dry, brisk, bold

Guidelines:
- Use your deep tea knowledge to infer the most likely flavor profile
- Tea type is the strongest signal:
  - Black teas: typically malty, bold, brisk; some are smoky or sweet
  - Green teas: typically grassy, vegetal, fresh; Japanese greens are more vegetal/seaweed, Chinese greens more sweet/floral
  - Oolong: varies widely — light oolongs are floral/sweet, dark oolongs are roasted/earthy
  - White teas: typically sweet, floral, fresh, delicate
  - Pu-erh: earthy, woody, mushroom, mossy
  - Herbal/rooibos: depends on ingredients; chamomile is floral/sweet, mint is fresh/herbaceous
  - Matcha: vegetal, grassy, sweet, sometimes bitter
- Origin matters: Darjeeling = floral/brisk, Assam = malty/bold, Yunnan = earthy/honey
- Description and name provide extra clues (e.g., "smoked" in the name → smoky)
- Aim for 3-4 notes for simple teas, 5-6 for complex ones
- Try to represent at least 2 different dimensions when possible
- When in doubt about a specific note, use the broader category term (e.g., "floral" instead of "orchid")

Return ONLY a JSON array of objects: [{"tea_id": <number>, "flavor_notes": ["note1", "note2", ...]}]
No markdown, no explanation, just the JSON array.`;

// --- Progress tracking ---

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not load progress file, starting fresh');
  }
  return { processedIds: [], lastOffset: 0, totalProcessed: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// --- Anthropic API call with retries ---

async function callClaude(teas, retryCount = 0) {
  const teaData = teas.map(t => ({
    tea_id: t.id,
    name: t.name,
    tea_type: t.tea_type,
    description: t.description?.substring(0, 300) || '',
    origin: t.origin || '',
    brand_name: t.brand_name || '',
  }));

  const userMessage = JSON.stringify(teaData);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    // Handle rate limits
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '30');
      console.warn(`  Rate limited. Waiting ${retryAfter}s...`);
      await sleep(retryAfter * 1000);
      return callClaude(teas, retryCount); // Don't count rate limits as retries
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('Empty response from Claude');
    }

    // Parse JSON — handle potential markdown fencing
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const results = JSON.parse(jsonStr);

    // Validate and filter to allowed notes only
    return results.map(r => ({
      tea_id: r.tea_id,
      flavor_notes: (r.flavor_notes || [])
        .map(n => n.toLowerCase().trim())
        .filter(n => ALLOWED_SET.has(n)),
    })).filter(r => r.flavor_notes.length > 0);

  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount + 1) * 1000; // 2s, 4s, 8s
      console.warn(`  Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms: ${err.message}`);
      await sleep(delay);
      return callClaude(teas, retryCount + 1);
    }
    console.error(`  Failed after ${MAX_RETRIES} retries: ${err.message}`);
    return [];
  }
}

// --- DB operations ---

async function fetchTeas() {
  console.log('Fetching teas from Supabase...');

  // Supabase caps at 1000 per request, so paginate
  let allTeas = [];
  let from = OFFSET;
  const pageSize = 1000;

  while (true) {
    let query = supabase
      .from('teas')
      .select('id, name, tea_type, description, origin, brand_name, flavor_notes, is_custom')
      .eq('is_custom', false)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allTeas = allTeas.concat(data);
    from += pageSize;

    // If user set a limit and we've got enough, stop
    if (LIMIT && allTeas.length >= LIMIT) {
      allTeas = allTeas.slice(0, LIMIT);
      break;
    }
  }

  // Unless --overwrite, skip teas that already have valid flavor_notes
  if (!OVERWRITE) {
    const before = allTeas.length;
    allTeas = allTeas.filter(t => !t.flavor_notes || t.flavor_notes.length === 0);
    const skipped = before - allTeas.length;
    if (skipped > 0) {
      console.log(`Skipping ${skipped} teas that already have flavor_notes (use --overwrite to include)`);
    }
  }

  console.log(`Fetched ${allTeas.length} teas to process`);
  return allTeas;
}

async function updateFlavorNotes(results) {
  if (DRY_RUN) {
    console.log('[DRY RUN] Would update', results.length, 'teas');
    results.slice(0, 5).forEach(r => {
      console.log(`  ${r.tea_id}: [${r.flavor_notes.join(', ')}]`);
    });
    if (results.length > 5) console.log(`  ... and ${results.length - 5} more`);
    return;
  }

  // Update in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < results.length; i += chunkSize) {
    const chunk = results.slice(i, i + chunkSize);

    // Supabase JS doesn't have a bulk update, so we use individual updates
    // batched with Promise.all for speed
    const updates = chunk.map(r =>
      supabase
        .from('teas')
        .update({ flavor_notes: r.flavor_notes })
        .eq('id', r.tea_id)
    );

    const settled = await Promise.all(updates);
    const errors = settled.filter(r => r.error);
    if (errors.length > 0) {
      console.warn(`  ${errors.length} update errors in chunk`);
      errors.forEach(e => console.warn(`    ${e.error.message}`));
    }
  }
}

// --- Helpers ---

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// --- Main ---

async function main() {
  console.log('=== Backfill Flavor Notes ===');
  console.log(`Model: ${CLAUDE_MODEL}`);
  console.log(`Batch size: ${BATCH_SIZE} teas per API call`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Overwrite existing: ${OVERWRITE}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  if (OFFSET) console.log(`Offset: ${OFFSET}`);
  console.log('');

  const progress = loadProgress();
  const processedSet = new Set(progress.processedIds);

  const teas = await fetchTeas();
  if (teas.length === 0) {
    console.log('No teas to process. Done.');
    return;
  }

  // Filter out already-processed teas (from progress file)
  const remaining = teas.filter(t => !processedSet.has(t.id));
  if (remaining.length < teas.length) {
    console.log(`Resuming: skipping ${teas.length - remaining.length} already-processed teas`);
  }

  const batches = chunk(remaining, BATCH_SIZE);
  const totalBatches = batches.length;
  let totalProcessed = progress.totalProcessed;
  let totalUpdated = 0;

  console.log(`Processing ${remaining.length} teas in ${totalBatches} batches\n`);

  // Process batches with concurrency control
  const batchGroups = chunk(batches, CONCURRENCY);

  for (let gi = 0; gi < batchGroups.length; gi++) {
    const group = batchGroups[gi];
    const batchStartIdx = gi * CONCURRENCY;

    const promises = group.map((batch, i) => {
      const batchNum = batchStartIdx + i + 1;
      console.log(`[Batch ${batchNum}/${totalBatches}] Processing ${batch.length} teas...`);
      return callClaude(batch).then(results => ({ batchNum, batch, results }));
    });

    const outcomes = await Promise.all(promises);

    for (const { batchNum, batch, results } of outcomes) {
      if (results.length > 0) {
        await updateFlavorNotes(results);
        totalUpdated += results.length;
      }

      // Track progress
      const batchIds = batch.map(t => t.id);
      batchIds.forEach(id => processedSet.add(id));
      totalProcessed += batch.length;

      progress.processedIds = [...processedSet];
      progress.totalProcessed = totalProcessed;
      saveProgress(progress);

      const sample = results.slice(0, 2).map(r => `${r.tea_id}:[${r.flavor_notes.join(',')}]`).join(' | ');
      console.log(`[Batch ${batchNum}/${totalBatches}] ✓ ${results.length}/${batch.length} assigned. Sample: ${sample}`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total updated: ${totalUpdated}`);
  if (DRY_RUN) console.log('(Dry run — no changes written to DB)');

  // Clean up progress file on successful completion
  if (!DRY_RUN && totalProcessed >= remaining.length) {
    try {
      fs.unlinkSync(PROGRESS_FILE);
      console.log('Progress file cleaned up.');
    } catch (e) { /* ignore */ }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
