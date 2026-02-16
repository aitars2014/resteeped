#!/usr/bin/env node

/**
 * Generate embeddings for all teas using OpenAI's text-embedding-3-small model.
 * Idempotent — skips teas that already have embeddings.
 * 
 * Usage: OPENAI_API_KEY=sk-... node scripts/generate-tea-embeddings.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BATCH_SIZE = 100;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is required. Set it in .env or as an environment variable.');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function buildTextBlob(tea) {
  const parts = [
    `${tea.name}.`,
    `${tea.tea_type} tea.`,
    tea.description || '',
    `Flavor notes: ${tea.flavor_notes?.join(', ') || 'none'}.`,
    `Origin: ${tea.origin || 'unknown'}.`,
  ];
  return parts.filter(Boolean).join(' ');
}

async function getEmbeddings(texts) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data.map(d => d.embedding);
}

async function main() {
  console.log('Fetching teas without embeddings...');

  // Fetch all teas without embeddings
  const { data: teas, error } = await supabase
    .from('teas')
    .select('id, name, tea_type, description, flavor_notes, origin')
    .is('embedding', null);

  if (error) {
    console.error('Error fetching teas:', error.message);
    process.exit(1);
  }

  console.log(`Found ${teas.length} teas without embeddings.`);

  if (teas.length === 0) {
    console.log('All teas already have embeddings. Nothing to do.');
    return;
  }

  let processed = 0;

  for (let i = 0; i < teas.length; i += BATCH_SIZE) {
    const batch = teas.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildTextBlob);

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(teas.length / BATCH_SIZE)} (${batch.length} teas)...`);

    try {
      const embeddings = await getEmbeddings(texts);

      // Update each tea with its embedding
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from('teas')
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id);

        if (updateError) {
          console.error(`Error updating tea ${batch[j].name}:`, updateError.message);
        }
      }

      processed += batch.length;
      console.log(`  ✓ ${processed}/${teas.length} teas processed`);
    } catch (err) {
      console.error(`Error processing batch:`, err.message);
      console.log('Waiting 10 seconds before retrying...');
      await new Promise(r => setTimeout(r, 10000));
      i -= BATCH_SIZE; // Retry this batch
    }

    // Rate limit: small delay between batches
    if (i + BATCH_SIZE < teas.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\nDone! ${processed} teas embedded.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
