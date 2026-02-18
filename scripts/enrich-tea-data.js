#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

require('fs').readFileSync('/Users/tars/projects/resteeped/.env', 'utf8')
  .split('\n').filter(l => l && !l.startsWith('#'))
  .forEach(l => { const [k, ...v] = l.split('='); process.env[k] = v.join('='); });

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DEFAULTS = {
  black:  { steep_temp_f: 212, steep_time_min: 3, steep_time_max: 5, origin: 'Various' },
  green:  { steep_temp_f: 175, steep_time_min: 2, steep_time_max: 3, origin: 'Various' },
  white:  { steep_temp_f: 175, steep_time_min: 4, steep_time_max: 5, origin: 'Various' },
  oolong: { steep_temp_f: 195, steep_time_min: 3, steep_time_max: 5, origin: 'Various' },
  puerh:  { steep_temp_f: 212, steep_time_min: 3, steep_time_max: 5, origin: 'Yunnan, China' },
  herbal: { steep_temp_f: 212, steep_time_min: 5, steep_time_max: 7, origin: 'Various' },
};

async function main() {
  console.log('Pre-enrichment:');
  for (const col of ['steep_temp_f', 'steep_time_min', 'steep_time_max', 'origin']) {
    const { count } = await sb.from('teas').select('*', { count: 'exact', head: true }).is(col, null);
    console.log(`  Missing ${col}: ${count}`);
  }

  console.log('\nEnriching...');
  for (const [type, defaults] of Object.entries(DEFAULTS)) {
    for (const [col, val] of Object.entries(defaults)) {
      const { error } = await sb.from('teas').update({ [col]: val }).eq('tea_type', type).is(col, null);
      if (error) console.error(`  ERROR ${type}.${col}:`, error.message);
    }
    console.log(`  ${type} ✓`);
  }

  console.log('\nPost-enrichment:');
  for (const col of ['steep_temp_f', 'steep_time_min', 'steep_time_max', 'origin']) {
    const { count } = await sb.from('teas').select('*', { count: 'exact', head: true }).is(col, null);
    console.log(`  Missing ${col}: ${count}`);
  }
  console.log('Done!');
}

main().catch(console.error);
