-- Add more tea companies with their logos
-- Run this in Supabase SQL Editor

-- Harney & Sons
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle, twitter_handle
) VALUES (
  'Harney & Sons',
  'harney-and-sons',
  'Harney and Sons is a family-owned and operated tea company based in Millerton, New York. Founded in 1983 by John Harney, the company is now run by his sons Michael and Paul. They source teas from estates around the world and are known for their extensive variety of over 300 tea blends, including their famous Hot Cinnamon Spice and Paris teas.',
  'Family-owned tea company with 300+ premium blends since 1983',
  'https://cdn.shopify.com/s/files/1/0259/2168/0983/files/harney-logo.png',
  'https://www.harney.com',
  'Millerton', 'NY', 'USA',
  1983,
  ARRAY['Black Tea', 'Flavored Blends', 'Herbals', 'Green Tea'],
  ARRAY['Kosher'],
  true,
  'moderate',
  'harneytea',
  'harneytea'
) ON CONFLICT (slug) DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description;

-- Adagio Teas (update existing or insert)
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Adagio Teas',
  'adagio-teas',
  'Adagio Teas is an online tea retailer based in New Jersey, founded by a mother-and-son team. Known for their direct-trade model, they source teas directly from artisan farmers worldwide. Their extensive catalog includes everything from single-estate teas to creative blends, plus a unique custom blend program where customers can create their own tea recipes.',
  'Direct-trade teas with custom blending options',
  'https://www.adagio.com/images5/adagio_logo.png',
  'https://www.adagio.com',
  'Garfield', 'NJ', 'USA',
  1999,
  ARRAY['Single Estate', 'Custom Blends', 'Matcha', 'Oolong'],
  ARRAY['USDA Organic (select teas)'],
  true,
  'budget',
  'adagioteas'
) ON CONFLICT (slug) DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description;

-- Vahdam Teas
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Vahdam Teas',
  'vahdam-teas',
  'Vahdam Teas is India''s largest homegrown tea brand, founded in 2015 by Bala Sarda. They pioneered a direct-to-consumer model, sourcing fresh teas directly from 150+ gardens across India within days of harvest. Their mission is to deliver the freshest Indian teas while ensuring fair wages for tea farmers through their social initiative TEAch Me.',
  'India''s freshest teas, garden-to-cup in 72 hours',
  'https://www.vahdamteas.com/cdn/shop/files/vahdam-logo.svg',
  'https://www.vahdamteas.com',
  'New Delhi', NULL, 'India',
  2015,
  ARRAY['Darjeeling', 'Assam', 'Chai', 'Herbal'],
  ARRAY['USDA Organic', 'Rainforest Alliance', 'Plastic Neutral'],
  true,
  'moderate',
  'vahdamteas'
) ON CONFLICT (slug) DO NOTHING;

-- Art of Tea
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Art of Tea',
  'art-of-tea',
  'Art of Tea is a Los Angeles-based organic tea company founded by Steve Schwartz. They specialize in hand-crafted organic teas sourced from sustainable gardens around the world. Known for their creative blends and commitment to organic practices, they supply tea to top restaurants and hotels worldwide.',
  'Hand-crafted organic teas from sustainable gardens',
  'https://www.artoftea.com/cdn/shop/files/AoT-Logo.png',
  'https://www.artoftea.com',
  'Los Angeles', 'CA', 'USA',
  2003,
  ARRAY['Organic', 'Blends', 'Matcha', 'Wellness'],
  ARRAY['USDA Organic', 'Fair Trade'],
  true,
  'moderate',
  'artoftea'
) ON CONFLICT (slug) DO NOTHING;

-- The Tea Spot
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'The Tea Spot',
  'the-tea-spot',
  'The Tea Spot is a Colorado-based tea company founded in 2004 by Maria Uspenski, a cancer survivor who discovered the healing power of whole-leaf tea during her recovery. They donate 10% of all sales to cancer and community wellness programs. Known for their wellness-focused blends and innovative steepware.',
  'Wellness-focused teas with 10% donated to cancer programs',
  'https://www.theteaspot.com/cdn/shop/files/TTS_Logo.png',
  'https://www.theteaspot.com',
  'Boulder', 'CO', 'USA',
  2004,
  ARRAY['Wellness', 'Organic', 'Signature Blends', 'Steepware'],
  ARRAY['USDA Organic', 'B Corp'],
  true,
  'moderate',
  'theteaspot'
) ON CONFLICT (slug) DO NOTHING;

-- Steven Smith Teamaker
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Steven Smith Teamaker',
  'steven-smith-teamaker',
  'Steven Smith Teamaker was founded in Portland, Oregon by tea industry legend Steve Smith, who previously created Stash Tea and Tazo. His final venture focuses on small-batch, handcrafted teas with full traceability. Each tea is crafted with exceptional attention to origin, ingredients, and preparation.',
  'Handcrafted small-batch teas from a tea industry pioneer',
  'https://www.smithtea.com/cdn/shop/files/smith-teamaker-logo.svg',
  'https://www.smithtea.com',
  'Portland', 'OR', 'USA',
  2009,
  ARRAY['Craft Blends', 'Single Origin', 'Full-Leaf Sachets'],
  ARRAY['Non-GMO Project Verified'],
  true,
  'premium',
  'smithtea'
) ON CONFLICT (slug) DO NOTHING;

-- Teapigs
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Teapigs',
  'teapigs',
  'Teapigs is a UK-based tea company founded in 2006 by Nick Kilby and Louise Cheadle. They pioneered whole-leaf tea in biodegradable "tea temples" (pyramid bags). Known for their playful branding and commitment to quality, they source only the top 10% of teas worldwide.',
  'UK''s quality tea in biodegradable tea temples',
  'https://teapigs.com/cdn/shop/files/teapigs-logo.svg',
  'https://www.teapigs.com',
  'London', NULL, 'United Kingdom',
  2006,
  ARRAY['Whole Leaf', 'Matcha', 'Herbal', 'Chai'],
  ARRAY['B Corp', 'Plastic Free'],
  true,
  'moderate',
  'teapigs'
) ON CONFLICT (slug) DO NOTHING;

-- Mountain Rose Herbs
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Mountain Rose Herbs',
  'mountain-rose-herbs',
  'Mountain Rose Herbs is an Oregon-based company specializing in organic herbs, spices, and botanical products. Founded in 1987, they are committed to sustainability, fair trade, and supporting organic farmers. They offer an extensive selection of herbal teas and tisanes, perfect for those interested in herbalism and natural remedies.',
  'Organic herbs and botanicals with sustainability focus',
  'https://mountainroseherbs.com/media/logo/stores/1/MRH_Logo.svg',
  'https://www.mountainroseherbs.com',
  'Eugene', 'OR', 'USA',
  1987,
  ARRAY['Herbal', 'Tisanes', 'Botanicals', 'Organic'],
  ARRAY['USDA Organic', 'Fair Trade', 'Non-GMO'],
  true,
  'budget',
  'mountainroseherbs'
) ON CONFLICT (slug) DO NOTHING;

-- Spirit Tea
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Spirit Tea',
  'spirit-tea',
  'Spirit Tea is a Chicago-based tea company that curates a rotating, seasonal collection of specialty teas. They source directly from origin to find unique, ephemeral harvests. Their focus is on rare, high-quality teas from small producers in Asia, offering wholesale tea services and educational training.',
  'Seasonal collection of rare, direct-sourced specialty teas',
  'https://spirittea.co/cdn/shop/files/spirit-tea-logo.png',
  'https://spirittea.co',
  'Chicago', 'IL', 'USA',
  2015,
  ARRAY['Seasonal', 'Single Origin', 'Chinese', 'Japanese'],
  ARRAY[]::TEXT[],
  true,
  'premium',
  'spiritteaco'
) ON CONFLICT (slug) DO NOTHING;

-- Song Tea & Ceramics
INSERT INTO companies (
  name, slug, description, short_description,
  logo_url, website_url, headquarters_city, headquarters_state, headquarters_country,
  founded_year, specialty, certifications, ships_internationally,
  price_range, instagram_handle
) VALUES (
  'Song Tea & Ceramics',
  'song-tea',
  'Song Tea & Ceramics is a San Francisco-based tea company founded by Peter Luong. They specialize in traditional, rare, and experimental tea varieties from clean growing regions in China and Taiwan. Their tea studio offers tastings, classes, and a curated collection of handcrafted ceramics.',
  'Traditional and rare Chinese & Taiwanese teas with ceramics',
  'https://songtea.com/cdn/shop/files/song-tea-logo.svg',
  'https://songtea.com',
  'San Francisco', 'CA', 'USA',
  2012,
  ARRAY['Chinese', 'Taiwanese', 'Oolong', 'Pu-erh'],
  ARRAY[]::TEXT[],
  true,
  'premium',
  'songteaandceramics'
) ON CONFLICT (slug) DO NOTHING;
