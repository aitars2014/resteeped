#!/usr/bin/env node
/**
 * Tea Description Rewriter
 * 
 * This script fetches teas that need description rewrites and updates them.
 * Progress is tracked via the description_rewritten_at column in the database.
 * 
 * Usage:
 *   node scripts/rewrite-descriptions.js fetch --batch=0 --size=50
 *   node scripts/rewrite-descriptions.js update --id=xxx --description="new desc"
 *   node scripts/rewrite-descriptions.js status
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pakfofausiltnkojafpd.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

async function fetchBatch(batchNum, batchSize = 50) {
  const offset = batchNum * batchSize;
  
  // Get total count of teas with descriptions
  const { count: totalWithDesc } = await supabase
    .from('teas')
    .select('id', { count: 'exact', head: true })
    .not('description', 'is', null);
  
  // Get count of already rewritten
  const { count: rewrittenCount } = await supabase
    .from('teas')
    .select('id', { count: 'exact', head: true })
    .not('description_rewritten_at', 'is', null);
  
  // Fetch teas that haven't been rewritten yet
  const { data, error } = await supabase
    .from('teas')
    .select('id, name, description, tea_type, companies(name)')
    .not('description', 'is', null)
    .is('description_rewritten_at', null)
    .order('name')
    .range(offset, offset + batchSize - 1);
  
  if (error) {
    console.error('Error fetching teas:', error);
    process.exit(1);
  }
  
  console.log(JSON.stringify({
    batch: batchNum,
    offset,
    totalWithDescriptions: totalWithDesc,
    alreadyRewritten: rewrittenCount,
    remaining: totalWithDesc - rewrittenCount,
    fetched: data.length,
    teas: data
  }, null, 2));
}

async function updateDescription(teaId, newDescription) {
  const { error } = await supabase
    .from('teas')
    .update({ 
      description: newDescription,
      description_rewritten_at: new Date().toISOString()
    })
    .eq('id', teaId);
  
  if (error) {
    console.error('Error updating tea:', error);
    process.exit(1);
  }
  
  console.log(`Updated tea ${teaId}`);
}

async function showStatus() {
  const { count: totalWithDesc } = await supabase
    .from('teas')
    .select('id', { count: 'exact', head: true })
    .not('description', 'is', null);
  
  const { count: rewrittenCount } = await supabase
    .from('teas')
    .select('id', { count: 'exact', head: true })
    .not('description_rewritten_at', 'is', null);
  
  const pct = ((rewrittenCount / totalWithDesc) * 100).toFixed(1);
  
  console.log(`Rewritten: ${rewrittenCount} / ${totalWithDesc} (${pct}%)`);
  console.log(`Remaining: ${totalWithDesc - rewrittenCount}`);
}

async function bulkUpdate(teas) {
  // teas is an array of {id, description}
  for (const tea of teas) {
    const { error } = await supabase
      .from('teas')
      .update({ 
        description: tea.description,
        description_rewritten_at: new Date().toISOString()
      })
      .eq('id', tea.id);
    
    if (error) {
      console.error(`Error updating tea ${tea.id}:`, error);
    }
  }
  
  console.log(`Updated ${teas.length} teas`);
}

// CLI
const [,, command, ...args] = process.argv;

switch (command) {
  case 'fetch':
    const batchArg = args.find(a => a.startsWith('--batch='));
    const sizeArg = args.find(a => a.startsWith('--size='));
    const batch = batchArg ? parseInt(batchArg.split('=')[1]) : 0;
    const size = sizeArg ? parseInt(sizeArg.split('=')[1]) : 50;
    fetchBatch(batch, size);
    break;
  
  case 'update':
    const idArg = args.find(a => a.startsWith('--id='));
    const descArg = args.find(a => a.startsWith('--description='));
    if (idArg && descArg) {
      updateDescription(idArg.split('=')[1], descArg.split('=')[1]);
    }
    break;
  
  case 'bulk-update':
    // Read from stdin
    let input = '';
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      const teas = JSON.parse(input);
      bulkUpdate(teas);
    });
    break;
  
  case 'status':
    showStatus();
    break;
  
  default:
    console.log('Usage: node rewrite-descriptions.js <fetch|update|bulk-update|status>');
}
