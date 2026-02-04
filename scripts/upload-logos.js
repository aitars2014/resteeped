#!/usr/bin/env node
/**
 * Upload company logos to Supabase Storage and update company records
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'logos';
const LOGOS_DIR = path.join(__dirname, '../assets/logos');

// Map filename (without extension) to company slug
const LOGO_MAP = {
  'adagio': 'adagio-teas',
  'artoftea': 'art-of-tea',
  'crimson-lotus': 'crimson-lotus-tea',
  'harney': 'harney-and-sons',
  'meileaf': 'mei-leaf',
  'mountainrose': 'mountain-rose-herbs',
  'republicoftea': 'republic-of-tea',
  'rishi': 'rishi-tea',
  'smithtea': 'steven-smith-teamaker',
  'songtea': 'song-tea',
  'steepingroom': 'the-steeping-room',
  'teapigs': 'teapigs',
  'teasenz': 'teasenz',
  'teaspot': 'the-tea-spot',
  'vahdam': 'vahdam-teas',
  'yunnan-sourcing': 'yunnan-sourcing',
};

async function ensureBucket() {
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  
  if (!exists) {
    console.log(`📦 Creating bucket: ${BUCKET}`);
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
    });
    if (error) throw error;
  } else {
    console.log(`📦 Bucket exists: ${BUCKET}`);
  }
}

async function uploadLogo(filename) {
  const filePath = path.join(LOGOS_DIR, filename);
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  
  const slug = LOGO_MAP[basename];
  if (!slug) {
    console.log(`  ⚠️  No mapping for: ${filename}`);
    return null;
  }
  
  const file = fs.readFileSync(filePath);
  const contentType = ext === '.svg' ? 'image/svg+xml' : 'image/png';
  const storagePath = `companies/${slug}${ext}`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType,
      upsert: true,
    });
  
  if (uploadError) {
    console.log(`  ✗ Upload failed for ${filename}: ${uploadError.message}`);
    return null;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);
  
  // Update company record
  const { error: updateError } = await supabase
    .from('companies')
    .update({ logo_url: publicUrl })
    .eq('slug', slug);
  
  if (updateError) {
    console.log(`  ✗ Update failed for ${slug}: ${updateError.message}`);
    return null;
  }
  
  console.log(`  ✓ ${slug}: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  console.log('🚀 Uploading Company Logos to Supabase Storage\n');
  
  await ensureBucket();
  
  const files = fs.readdirSync(LOGOS_DIR)
    .filter(f => ['.png', '.jpg', '.svg', '.webp'].includes(path.extname(f)));
  
  console.log(`\n📤 Uploading ${files.length} logos...\n`);
  
  let uploaded = 0;
  for (const file of files) {
    const result = await uploadLogo(file);
    if (result) uploaded++;
  }
  
  console.log(`\n✅ Uploaded ${uploaded}/${files.length} logos`);
  
  // Show final URLs
  const { data: companies } = await supabase
    .from('companies')
    .select('name, logo_url')
    .order('name');
  
  console.log('\n📊 Company Logo Status:');
  for (const c of companies) {
    const status = c.logo_url?.includes('supabase') ? '✓' : '✗';
    console.log(`  ${status} ${c.name}`);
  }
}

main().catch(console.error);
