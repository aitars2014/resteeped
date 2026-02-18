#!/usr/bin/env node
/**
 * Fetch company logos from their websites and upload to Supabase Storage.
 * Strategy: Try multiple approaches per site:
 * 1. Fetch homepage HTML, look for og:image, logo in <img>, favicon
 * 2. Try common logo paths (/logo.png, /favicon.ico)
 * 3. Use Clearbit Logo API as fallback
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

// Load env
require('fs').readFileSync('/Users/tars/projects/resteeped/.env', 'utf8')
  .split('\n').filter(l => l && !l.startsWith('#'))
  .forEach(l => { const [k, ...v] = l.split('='); process.env[k] = v.join('='); });

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      timeout: 10000 
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) {
          const u = new URL(url);
          loc = u.origin + loc;
        }
        return fetchUrl(loc, maxRedirects - 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ 
        buffer: Buffer.concat(chunks), 
        contentType: res.headers['content-type'] || '',
        status: res.statusCode 
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractLogoUrl(html, baseUrl) {
  const base = new URL(baseUrl);
  
  // Try og:image first
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch) {
    const url = ogMatch[1];
    if (url.startsWith('http')) return url;
    return base.origin + (url.startsWith('/') ? '' : '/') + url;
  }
  
  // Try logo img tags
  const logoPatterns = [
    /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
    /<img[^>]*src=["']([^"']+logo[^"']*\.(?:png|jpg|svg|webp))["']/i,
    /<a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>.*?<img[^>]*src=["']([^"']+)["']/is,
  ];
  
  for (const pattern of logoPatterns) {
    const match = html.match(pattern);
    if (match) {
      const url = match[1];
      if (url.startsWith('http')) return url;
      if (url.startsWith('//')) return 'https:' + url;
      return base.origin + (url.startsWith('/') ? '' : '/') + url;
    }
  }
  
  // Try apple-touch-icon
  const touchIcon = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
  if (touchIcon) {
    const url = touchIcon[1];
    if (url.startsWith('http')) return url;
    return base.origin + (url.startsWith('/') ? '' : '/') + url;
  }
  
  return null;
}

async function getLogoForCompany(company) {
  const { name, slug, website_url } = company;
  if (!website_url) return null;
  
  try {
    // Strategy 1: Parse homepage for logo
    const { buffer, status } = await fetchUrl(website_url);
    if (status === 200) {
      const html = buffer.toString('utf8');
      const logoUrl = extractLogoUrl(html, website_url);
      if (logoUrl) {
        try {
          const logo = await fetchUrl(logoUrl);
          if (logo.status === 200 && logo.buffer.length > 500) {
            return { buffer: logo.buffer, contentType: logo.contentType, source: 'website' };
          }
        } catch (e) { /* try next */ }
      }
    }
  } catch (e) { /* try fallback */ }
  
  // Strategy 2: Clearbit Logo API (free, no key needed)
  try {
    const domain = new URL(website_url).hostname.replace('www.', '');
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const logo = await fetchUrl(clearbitUrl);
    if (logo.status === 200 && logo.buffer.length > 500) {
      return { buffer: logo.buffer, contentType: 'image/png', source: 'clearbit' };
    }
  } catch (e) { /* no logo available */ }
  
  // Strategy 3: Google Favicon API
  try {
    const domain = new URL(website_url).hostname;
    const gUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const logo = await fetchUrl(gUrl);
    if (logo.status === 200 && logo.buffer.length > 500) {
      return { buffer: logo.buffer, contentType: 'image/png', source: 'google-favicon' };
    }
  } catch (e) { /* give up */ }
  
  return null;
}

function getExtension(contentType) {
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'png';
}

async function main() {
  // Get companies missing logos
  const { data: companies } = await sb.from('companies')
    .select('id, name, slug, website_url')
    .is('logo_url', null)
    .order('name');
  
  console.log(`Found ${companies.length} companies missing logos\n`);
  
  let success = 0, failed = 0;
  
  for (const company of companies) {
    process.stdout.write(`${company.name}... `);
    
    const result = await getLogoForCompany(company);
    if (!result) {
      console.log('❌ no logo found');
      failed++;
      continue;
    }
    
    const ext = getExtension(result.contentType);
    const path = `companies/${company.slug}.${ext}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await sb.storage
      .from('logos')
      .upload(path, result.buffer, {
        contentType: result.contentType.split(';')[0] || 'image/png',
        upsert: true,
      });
    
    if (uploadError) {
      console.log(`❌ upload failed: ${uploadError.message}`);
      failed++;
      continue;
    }
    
    // Get public URL
    const { data: urlData } = sb.storage.from('logos').getPublicUrl(path);
    
    // Update company record
    const { error: updateError } = await sb.from('companies')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', company.id);
    
    if (updateError) {
      console.log(`❌ db update failed: ${updateError.message}`);
      failed++;
      continue;
    }
    
    console.log(`✅ (${result.source}, ${ext})`);
    success++;
  }
  
  console.log(`\nDone! ✅ ${success} logos added, ❌ ${failed} failed`);
  
  // Final count
  const { count: remaining } = await sb.from('companies')
    .select('*', { count: 'exact', head: true })
    .is('logo_url', null);
  console.log(`Remaining without logos: ${remaining}`);
}

main().catch(console.error);
