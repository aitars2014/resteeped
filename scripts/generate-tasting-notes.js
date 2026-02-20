#!/usr/bin/env node
/**
 * Generate tasting notes for all catalog teas using OpenAI.
 * Reads tea data from Supabase, generates notes in batches, writes back.
 * 
 * Usage: node scripts/generate-tasting-notes.js [--dry-run] [--limit N] [--offset N]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('No OpenAI API key found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BATCH_SIZE = 20; // teas per OpenAI call
const CONCURRENCY = 3; // parallel API calls
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const OFFSET = args.includes('--offset') ? parseInt(args[args.indexOf('--offset') + 1]) : 0;

const SYSTEM_PROMPT = `You are writing tasting notes for Resteeped, a tea discovery app. Your voice is like "the friend who got really into tea last year and has opinions, but is never annoying about it." 

Rules:
- Write 1-3 sentences per tea. Concise, specific, opinionated.
- Mention actual flavors, not vague praise. 
- Include a practical tip when relevant (brewing temp, food pairing, best time to drink).
- Never use: "curated", "artisanal", "elevate", "premium", "experience", "journey", "indulge"
- Lowercase energy. Direct. No exclamation marks.
- If a tea is genuinely exceptional, say so plainly. If it's just fine, that's ok too.

You will receive a JSON array of teas. Return a JSON array of objects with "tea_id" and "note" fields. Nothing else.`;

async function generateNotesForBatch(teas) {
  const teaData = teas.map(t => ({
    tea_id: t.id,
    name: t.name,
    brand: t.brand_name,
    type: t.tea_type,
    description: t.description?.substring(0, 300),
    flavors: t.flavor_notes,
    steep_temp: t.steep_temp_f,
    steep_time: t.steep_time_min ? `${t.steep_time_min}-${t.steep_time_max} min` : null,
  }));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(teaData) },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  if (DRY_RUN && process.env.DEBUG) console.log('RAW:', JSON.stringify(content).substring(0, 200));
  return Array.isArray(content) ? content : content.notes || content.tasting_notes || Object.values(content).find(v => Array.isArray(v)) || [];
}

async function main() {
  console.log(`🍵 Tasting Notes Generator`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  
  // Get teas that don't already have tasting notes
  let query = supabase
    .from('teas')
    .select('id, name, brand_name, tea_type, description, flavor_notes, steep_temp_f, steep_time_min, steep_time_max')
    .eq('is_custom', false)
    .not('description', 'is', null)
    .order('name');

  if (LIMIT) query = query.limit(LIMIT);
  if (OFFSET) query = query.range(OFFSET, OFFSET + (LIMIT || 10000));

  const { data: allTeas, error: teaError } = await query;
  if (teaError) throw teaError;

  // Filter out teas that already have notes
  const { data: existingNotes } = await supabase
    .from('tasting_notes')
    .select('tea_id');
  
  const existingIds = new Set((existingNotes || []).map(n => n.tea_id));
  const teas = allTeas.filter(t => !existingIds.has(t.id));

  console.log(`Found ${allTeas.length} teas total, ${teas.length} need notes (${existingIds.size} already done)`);

  if (teas.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  // Split into batches
  const batches = [];
  for (let i = 0; i < teas.length; i += BATCH_SIZE) {
    batches.push(teas.slice(i, i + BATCH_SIZE));
  }
  console.log(`Processing ${batches.length} batches of ~${BATCH_SIZE} teas (concurrency: ${CONCURRENCY})`);

  let totalGenerated = 0;
  let totalErrors = 0;

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async (batch, idx) => {
        const batchNum = i + idx + 1;
        try {
          const notes = await generateNotesForBatch(batch);
          
          if (DRY_RUN) {
            console.log(`\n--- Batch ${batchNum}/${batches.length} (${notes.length} notes) ---`);
            notes.slice(0, 3).forEach(n => {
              const tea = batch.find(t => t.id === n.tea_id);
              console.log(`  ${tea?.name || n.tea_id}: ${n.note}`);
            });
            return notes.length;
          }

          // Match notes back to teas - fallback to name matching if UUID is mangled
          const rows = notes.map(n => {
            let teaId = n.tea_id;
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(teaId)) {
              // Try matching by name
              const match = batch.find(t => 
                t.name === n.name || t.name === n.tea_name || t.id.startsWith(teaId?.substring(0, 8))
              );
              if (match) {
                teaId = match.id;
              } else {
                return null; // skip this one
              }
            }
            return {
              tea_id: teaId,
              note_text: n.note,
              source_attribution: 'Resteeped editorial',
              created_at: new Date().toISOString(),
            };
          }).filter(Boolean);

          const { error: insertError } = await supabase
            .from('tasting_notes')
            .upsert(rows, { onConflict: 'tea_id' });

          if (insertError) throw insertError;

          console.log(`✅ Batch ${batchNum}/${batches.length}: ${notes.length} notes inserted`);
          return notes.length;
        } catch (err) {
          console.error(`❌ Batch ${batchNum}/${batches.length}: ${err.message}`);
          totalErrors++;
          return 0;
        }
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') totalGenerated += r.value;
    });

    // Rate limit pause between chunks
    if (i + CONCURRENCY < batches.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n🏁 Done! Generated ${totalGenerated} tasting notes. Errors: ${totalErrors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
