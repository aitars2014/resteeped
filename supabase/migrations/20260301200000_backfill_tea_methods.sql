-- Broader pattern matching for tea method
-- Pass 1: Product URL and description signals
UPDATE teas SET tea_method = 'teabag' WHERE tea_method IS NULL AND (
  product_url ILIKE '%sachet%' OR product_url ILIKE '%tea-bag%' OR product_url ILIKE '%teabag%'
  OR product_url ILIKE '%pyramid%' OR product_url ILIKE '%k-cup%'
  OR description ILIKE '%pyramid%sachet%' OR description ILIKE '%individually wrapped%'
  OR description ILIKE '%tea sachet%' OR description ILIKE '%count%tea bag%'
  OR description ILIKE '%bags per%' OR description ILIKE '%filter bag%'
  OR name ILIKE '%sachet%' OR name ILIKE '%pyramid%'
);

UPDATE teas SET tea_method = 'loose_leaf' WHERE tea_method IS NULL AND (
  product_url ILIKE '%loose%' OR product_url ILIKE '%bulk%'
  OR description ILIKE '%loose leaf%' OR description ILIKE '%steep in%infuser%'
  OR description ILIKE '%use 1 teaspoon%' OR description ILIKE '%use one teaspoon%'
  OR description ILIKE '%per 8 oz%' OR description ILIKE '%per cup%steep%'
  OR name ILIKE '%loose%'
);

-- Pass 2: Brand-level defaults for known brands
-- Predominantly teabag brands
UPDATE teas SET tea_method = 'teabag' WHERE tea_method IS NULL AND brand_name IN (
  'Celestial Seasonings', 'Bigelow Tea', 'Twinings', 'Stash Tea',
  'Republic of Tea', 'Tazo', 'Yogi Tea', 'Traditional Medicinals',
  'Numi Organic Tea', 'Pukka Herbs', 'Tealyra', 'Buddha Teas',
  'Big Heart Tea Co.', 'Kilogram Tea', 'Vahdam Teas',
  'CommodiTeas', 'Plum Deluxe'
);

-- Predominantly loose leaf brands
UPDATE teas SET tea_method = 'loose_leaf' WHERE tea_method IS NULL AND brand_name IN (
  'Adagio Teas', 'TeaSource', 'The Steeping Room', 'Old Town Spice & Tea Merchants',
  'Northeast Tea House', 'The Cultured Cup', 'TeaLula', 'Uptown Tea Shop',
  'Oregon Tea Traders', 'Yunnan Sourcing', 'Chado Tea', 'Crimson Lotus Tea',
  'Cuples Tea House', 'Happyness Tea & Spice Company', 'Just Add Honey Tea Company',
  'London Tea Merchant', 'Tea Drunk', 'One River Tea', 'Kettl',
  'Ippodo Tea', 'New Orleans Tea Company', 'Rishi Tea', 'Rishi Tea & Botanicals',
  'Metolius Tea', 'Hugo Tea', 'Full Leaf Tea Company',
  'Chicago Teahouse', 'Teas, etc', 'MEM Tea'
);

-- Harney & Sons: mostly teabag (sachet/tin format)
UPDATE teas SET tea_method = 'teabag' WHERE tea_method IS NULL AND brand_name = 'Harney & Sons';

-- DAVIDsTEA: mostly teabag (sachets)  
UPDATE teas SET tea_method = 'teabag' WHERE tea_method IS NULL AND brand_name = 'DAVIDsTEA';

-- Hemp & Tea Co: mixed, default loose leaf (tea shop)
UPDATE teas SET tea_method = 'loose_leaf' WHERE tea_method IS NULL AND brand_name = 'Hemp & Tea Co';

-- Elmwood Inn: mixed, default teabag
UPDATE teas SET tea_method = 'teabag' WHERE tea_method IS NULL AND brand_name = 'Elmwood Inn Fine Teas';

-- Pass 3: Remaining untagged - check for whole leaf signals
UPDATE teas SET tea_method = 'whole_leaf' WHERE tea_method IS NULL AND (
  description ILIKE '%whole leaf%' OR description ILIKE '%full leaf%'
  OR description ILIKE '%hand-rolled%' OR description ILIKE '%handrolled%'
  OR description ILIKE '%gongfu%' OR description ILIKE '%gaiwan%'
  OR name ILIKE '%cake%' OR name ILIKE '%brick%' OR name ILIKE '%tuo%'
);

-- Pass 4: Default remaining specialty/artisan tea shops to loose_leaf
-- (Most unbranded/small shop teas are loose leaf)
UPDATE teas SET tea_method = 'loose_leaf' WHERE tea_method IS NULL;
