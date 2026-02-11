#!/usr/bin/env node
/**
 * Batch Tea Description Rewriter
 * 
 * Self-contained script that rewrites all tea descriptions using Claude Haiku.
 * Much more efficient than sub-agents - runs until complete.
 * 
 * Usage: ANTHROPIC_API_KEY=xxx SUPABASE_SERVICE_KEY=xxx node scripts/rewrite-all-descriptions.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pakfofausiltnkojafpd.supabase.co';
const PROGRESS_FILE = path.join(__dirname, 'rewrite-progress.json');
const BATCH_SIZE = 20; // Process 20 teas at a time
const CONCURRENT_REQUESTS = 5; // Parallel API calls

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    return { rewritten: [] };
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function rewriteDescription(tea) {
  const prompt = `Rewrite this tea product description in the Resteeped voice. 

STYLE GUIDE:
- Tone: Knowledgeable friend recommending tea, not a salesperson
- Length: 2-4 sentences max
- No em dashes, no marketing fluff, no "perfect for" or "whether you're"
- Be specific about flavor, not vague ("tastes like roasted barley" not "complex flavor")
- Warm and inviting but not over-the-top

TEA INFO:
Name: ${tea.name}
Type: ${tea.tea_type || 'Unknown'}
Brand: ${tea.companies?.name || 'Unknown'}
Original Description: ${tea.description}

Return ONLY the new description, nothing else.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function updateTea(teaId, newDescription) {
  const { error } = await supabase
    .from('teas')
    .update({ description: newDescription })
    .eq('id', teaId);
  
  if (error) throw error;
}

async function processBatch(teas, progress) {
  const results = await Promise.allSettled(
    teas.map(async (tea) => {
      try {
        const newDesc = await rewriteDescription(tea);
        await updateTea(tea.id, newDesc);
        return { id: tea.id, success: true };
      } catch (err) {
        console.error(`Failed to process ${tea.name}: ${err.message}`);
        return { id: tea.id, success: false, error: err.message };
      }
    })
  );

  // Track successful rewrites
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      if (!progress.rewritten.includes(result.value.id)) {
        progress.rewritten.push(result.value.id);
      }
    }
  }
  
  saveProgress(progress);
  return results.filter(r => r.status === 'fulfilled' && r.value.success).length;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const progress = loadProgress();
  console.log(`Starting with ${progress.rewritten.length} already rewritten`);

  // Get total count
  const { count: totalWithDesc } = await supabase
    .from('teas')
    .select('id', { count: 'exact', head: true })
    .not('description', 'is', null);

  console.log(`Total teas with descriptions: ${totalWithDesc}`);
  console.log(`Remaining: ~${totalWithDesc - progress.rewritten.length}`);

  let processed = 0;
  let offset = 0;

  while (true) {
    // Fetch next batch
    const { data: teas, error } = await supabase
      .from('teas')
      .select('id, name, description, tea_type, companies(name)')
      .not('description', 'is', null)
      .order('name')
      .range(offset, offset + 200 - 1); // Fetch 200, filter to unrewritten

    if (error) {
      console.error('Fetch error:', error);
      break;
    }

    if (!teas || teas.length === 0) {
      console.log('No more teas to fetch');
      break;
    }

    // Filter out already rewritten
    const needsRewrite = teas.filter(t => !progress.rewritten.includes(t.id));
    
    if (needsRewrite.length === 0) {
      offset += 200;
      continue;
    }

    // Process in smaller chunks with concurrency
    for (let i = 0; i < needsRewrite.length; i += CONCURRENT_REQUESTS) {
      const chunk = needsRewrite.slice(i, i + CONCURRENT_REQUESTS);
      const success = await processBatch(chunk, progress);
      processed += success;
      
      const total = progress.rewritten.length;
      const pct = ((total / totalWithDesc) * 100).toFixed(1);
      console.log(`Progress: ${total}/${totalWithDesc} (${pct}%) - just processed ${success}/${chunk.length}`);
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    offset += 200;
  }

  console.log(`\nDone! Total rewritten: ${progress.rewritten.length}`);
}

main().catch(console.error);
