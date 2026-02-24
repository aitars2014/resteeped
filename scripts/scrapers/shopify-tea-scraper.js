/**
 * Generic Shopify Tea Scraper
 * Works for any Shopify-powered tea store
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Brand configurations
const BRANDS = {
  bigelow: {
    name: 'Bigelow Tea',
    slug: 'bigelow-tea',
    url: 'https://www.bigelowtea.com',
    description: 'Family-owned American tea company since 1945, known for Constant Comment and a wide variety of specialty teas.',
    city: 'Fairfield',
    state: 'CT',
    country: 'United States',
    founded: 1945,
    specialty: ['Black tea', 'Herbal tea', 'Green tea'],
  },
  numi: {
    name: 'Numi Organic Tea',
    slug: 'numi-organic-tea',
    url: 'https://numitea.com',
    description: 'Premium organic tea company founded in Oakland in 1999. Known for ethically sourced, fair trade certified teas and unique blends like Aged Earl Grey and flowering teas.',
    city: 'Oakland',
    state: 'CA',
    country: 'United States',
    founded: 1999,
    specialty: ['Organic tea', 'Pu-erh', 'Flowering tea', 'Fair Trade'],
  },
  tradmed: {
    name: 'Traditional Medicinals',
    slug: 'traditional-medicinals',
    url: 'https://www.traditionalmedicinals.com',
    description: 'Herbal wellness tea company founded in 1974 in Sebastopol, California. Pioneers in pharmacopoeial-quality herbal teas for specific health benefits.',
    city: 'Sebastopol',
    state: 'CA',
    country: 'United States',
    founded: 1974,
    specialty: ['Herbal tea', 'Wellness blends', 'Medicinal herbs'],
  },
  teaforte: {
    name: 'Tea Forté',
    slug: 'tea-forte',
    url: 'https://www.teaforte.com',
    description: 'Premium tea brand known for signature pyramid infusers and elegant tea accessories. Founded in 2003, offers high-quality loose leaf teas in distinctive packaging.',
    city: 'Concord',
    state: 'MA',
    country: 'United States',
    founded: 2003,
    specialty: ['Pyramid infusers', 'Loose leaf tea', 'Gift sets'],
  },
  stash: {
    name: 'Stash Tea',
    slug: 'stash-tea',
    url: 'https://www.stashtea.com',
    description: 'Premium tea company based in Portland, Oregon, offering a wide range of teas and herbal blends since 1972.',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    founded: 1972,
    specialty: ['Specialty tea', 'Herbal blends', 'Chai'],
  },
  twinings: {
    name: 'Twinings',
    slug: 'twinings',
    url: 'https://www.twiningsusa.com',
    description: 'One of the oldest tea brands in the world, founded in 1706. Known for English Breakfast, Earl Grey, and a wide variety of classic and specialty teas.',
    city: 'London',
    state: null,
    country: 'United Kingdom',
    founded: 1706,
    specialty: ['English Breakfast', 'Earl Grey', 'Classic blends'],
  },
  celestial: {
    name: 'Celestial Seasonings',
    slug: 'celestial-seasonings',
    url: 'https://www.celestialseasonings.com',
    description: 'American herbal tea company founded in Boulder, Colorado in 1969. Known for Sleepytime and creative herbal blends.',
    city: 'Boulder',
    state: 'CO',
    country: 'United States',
    founded: 1969,
    specialty: ['Herbal tea', 'Wellness blends', 'Sleepytime'],
  },
  teapigs: {
    name: 'Teapigs',
    slug: 'teapigs',
    url: 'https://www.teapigs.com',
    description: 'UK tea brand founded in 2006, known for whole leaf tea in biodegradable tea temples. Focus on quality and sustainability.',
    city: 'London',
    state: null,
    country: 'United Kingdom',
    founded: 2006,
    specialty: ['Tea temples', 'Whole leaf tea', 'Matcha'],
  },
  smithtea: {
    name: 'Steven Smith Teamaker',
    slug: 'steven-smith-teamaker',
    url: 'https://www.smithtea.com',
    description: 'Portland-based artisan tea company founded by Steven Smith (creator of Stash and Tazo). Known for premium, handcrafted blends.',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    founded: 2009,
    specialty: ['Artisan blends', 'Premium sachets', 'Single origin'],
  },
  artoftea: {
    name: 'Art of Tea',
    slug: 'art-of-tea',
    url: 'https://www.artoftea.com',
    description: 'Los Angeles-based tea company founded in 2003, specializing in organic, hand-blended teas sourced from sustainable farms.',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    founded: 2003,
    specialty: ['Organic tea', 'Wellness blends', 'Custom blending'],
  },
  crimsonlotus: {
    name: 'Crimson Lotus Tea',
    slug: 'crimson-lotus-tea',
    url: 'https://crimsonlotustea.com',
    description: 'Seattle-based specialty tea company focused on authentic pu-erh and other Chinese teas sourced directly from Yunnan.',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    founded: 2013,
    specialty: ['Pu-erh', 'Sheng', 'Shou', 'Yunnan teas'],
  },
  yunnansourcing: {
    name: 'Yunnan Sourcing',
    slug: 'yunnan-sourcing',
    url: 'https://yunnansourcing.com',
    description: 'Premier source for Yunnan teas, specializing in pu-erh, offering hundreds of teas directly from Chinese farmers and factories.',
    city: 'Kunming',
    state: 'Yunnan',
    country: 'China',
    founded: 2004,
    specialty: ['Pu-erh', 'Yunnan teas', 'Aged teas', 'Factory productions'],
  },
  spirittea: {
    name: 'Spirit Tea',
    slug: 'spirit-tea',
    url: 'https://www.spirittea.co',
    description: 'Specialty tea company focused on rare and exceptional teas from East Asia, sourced directly from farmers.',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    founded: 2015,
    specialty: ['Rare teas', 'Vietnamese tea', 'Single origin'],
  },
  songtea: {
    name: 'Song Tea & Ceramics',
    slug: 'song-tea-ceramics',
    url: 'https://songtea.com',
    description: 'San Francisco-based tea company specializing in rare Chinese and Taiwanese teas, paired with artisan ceramics.',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    founded: 2009,
    specialty: ['Taiwanese oolong', 'Chinese tea', 'Artisan ceramics'],
  },
  teaspot: {
    name: 'The Tea Spot',
    slug: 'the-tea-spot',
    url: 'https://www.theteaspot.com',
    description: 'Boulder-based tea company founded in 2004, offering premium loose leaf teas and modern steepware.',
    city: 'Boulder',
    state: 'CO',
    country: 'United States',
    founded: 2004,
    specialty: ['Loose leaf tea', 'Steepware', 'Wellness teas'],
  },
  steepingroom: {
    name: 'The Steeping Room',
    slug: 'the-steeping-room',
    url: 'https://thesteepingroom.com',
    description: 'Austin-based specialty tea shop offering an extensive collection of loose leaf teas from around the world, with a focus on single-origin and artisan teas.',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    founded: 2007,
    specialty: ['Single-origin tea', 'Puerh', 'Oolong', 'Artisan teas'],
  },
  teadrunk: {
    name: 'Tea Drunk',
    slug: 'tea-drunk',
    url: 'https://www.teadrunk.com',
    description: 'Premium Chinese tea company founded by Shunan Teng in New York City. Specializes in top terroir Chinese teas with an educational, gongfu-style approach.',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    founded: 2013,
    specialty: ['Chinese tea', 'Gongfu', 'Pu-erh', 'Oolong'],
  },
  sullivanstreet: {
    name: 'Sullivan Street Tea & Spice Company',
    slug: 'sullivan-street-tea-spice',
    url: 'https://www.onsullivan.com',
    description: 'Greenwich Village tea and spice company offering organic loose leaf teas, specialty spices, and gourmet items.',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    founded: null,
    specialty: ['Organic tea', 'Loose leaf', 'Specialty blends'],
  },
  memtea: {
    name: 'MEM Tea',
    slug: 'mem-tea',
    url: 'https://memteaimports.com',
    description: 'Boston-based tea importer with 25+ years of experience, offering carefully sourced loose leaf teas and signature blends. Serves many high-end Boston restaurants.',
    city: 'Boston',
    state: 'MA',
    country: 'United States',
    founded: 2001,
    specialty: ['Loose leaf tea', 'Signature blends', 'Single origin'],
  },
  premiumsteap: {
    name: 'Premium Steap',
    slug: 'premium-steap',
    url: 'https://premiumsteap.com',
    description: 'Philadelphia tea shop specializing in premium loose leaf teas with a strong focus on Indian teas including first flush Darjeelings.',
    city: 'Philadelphia',
    state: 'PA',
    country: 'United States',
    founded: null,
    specialty: ['Indian tea', 'Darjeeling', 'Loose leaf'],
  },
  cuples: {
    name: 'Cuples Tea House',
    slug: 'cuples-tea-house',
    url: 'https://cuplesteahouse.com',
    description: 'Baltimore-based Black/Woman-owned tea house offering premium loose leaf teas with a focus on tea culture education and virtual tastings.',
    city: 'Baltimore',
    state: 'MD',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Tea education', 'Signature blends'],
  },
  justaddhoney: {
    name: 'Just Add Honey Tea Company',
    slug: 'just-add-honey-tea-company',
    url: 'https://justaddhoney.net',
    description: 'Atlanta-based tea company located on the BeltLine, known for original tea blends with Southern-inspired flavors. Woman-owned with a strong local presence.',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    founded: null,
    specialty: ['Original blends', 'Black tea', 'Green tea', 'Herbal', 'Southern-inspired'],
  },
  thistleandsprig: {
    name: 'Thistle & Sprig Tea Co.',
    slug: 'thistle-and-sprig-tea-co',
    url: 'https://thistleandsprig.com',
    description: 'Atlanta-based artisan tea company offering ethically-sourced, sustainably packaged teas with a focus on matcha and Japanese teaware.',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    founded: null,
    specialty: ['Artisan blends', 'Black tea', 'Green tea', 'Herbal', 'Matcha'],
  },
  uptownteashop: {
    name: 'Uptown Tea Shop',
    slug: 'uptown-tea-shop',
    url: 'https://uptownteashop.com',
    description: 'British-style tea shop in the Charlotte area offering premium loose leaf teas and High Tea experiences including London\'s Calling Cream Tea events.',
    city: 'Waxhaw',
    state: 'NC',
    country: 'United States',
    founded: null,
    specialty: ['British-style teas', 'Premium loose leaf', 'High Tea events'],
  },
  neworleanstea: {
    name: 'New Orleans Tea Company',
    slug: 'new-orleans-tea-company',
    url: 'https://neworleansteacompany.com',
    description: 'Woman-owned tea company in the French Quarter offering NOLA-inspired blends like Big Chief Chai and collaborations with Commander\'s Palace.',
    city: 'New Orleans',
    state: 'LA',
    country: 'United States',
    founded: null,
    specialty: ['NOLA-inspired blends', 'Flavored blacks', 'Chai'],
  },
  tandemtea: {
    name: 'Tandem Tea Company',
    slug: 'tandem-tea-company',
    url: 'https://tandemtea.com',
    description: 'New Orleans tea company focused on sourcing high-quality single-origin loose leaf teas from around the world, with specialization in Chinese and Indian teas.',
    city: 'New Orleans',
    state: 'LA',
    country: 'United States',
    founded: null,
    specialty: ['Single-origin teas', 'Chinese teas', 'Pu-erh', 'Oolong', 'Indian teas'],
  },
  nashvilletea: {
    name: 'Nashville Tea Co',
    slug: 'nashville-tea-co',
    url: 'https://nashvilletea.com',
    description: 'Nashville-based tea company offering wellness teas and herbal blends with Old World sophistication and Southern charm.',
    city: 'Nashville',
    state: 'TN',
    country: 'United States',
    founded: null,
    specialty: ['Wellness teas', 'Herbal blends', 'Green tea'],
  },
  milknhoney: {
    name: 'Milk-n-Honey Tea Company',
    slug: 'milk-n-honey-tea-company',
    url: 'https://milknhoneytea.com',
    description: 'Orlando-based tea company specializing in hand-blended gourmet loose leaf teas with a focus on gift samplers and curated tea collections.',
    city: 'Orlando',
    state: 'FL',
    country: 'United States',
    founded: null,
    specialty: ['Hand-blended teas', 'Black tea', 'Green tea', 'Herbal', 'Gift samplers'],
  },
  // Midwest tea shops
  chicagoteahouse: {
    name: 'Chicago Teahouse',
    slug: 'chicago-teahouse',
    url: 'https://chicagoteahouse.com',
    description: 'Woman-owned Chicago tea shop with 15+ years in business. Managed by a Certified Tea Sommelier, known for premium loose-leaf teas. Named Best Tea Shop in Chicago by Chicago Magazine.',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    founded: null,
    specialty: ['Black tea', 'Green tea', 'Oolong', 'Organic tea', 'Fair Trade'],
  },
  tealula: {
    name: 'TeaLula',
    slug: 'tealula',
    url: 'https://tealula.com',
    description: "Full-service tea shop near O'Hare offering white, green, oolong, black, Pu'er, matcha, herbal, and rooibos teas sourced from reputable gardens worldwide.",
    city: 'Park Ridge',
    state: 'IL',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Matcha', 'Pu-erh', 'Teaware'],
  },
  eliteabar: {
    name: 'Eli Tea Bar',
    slug: 'eli-tea-bar',
    url: 'https://www.eliteabar.com',
    description: 'Modern tea café and specialty shop in the Detroit metro area. Ethically sourced global loose leaf teas with no artificial ingredients, following a "Thoughtful Tea" philosophy.',
    city: 'Birmingham',
    state: 'MI',
    country: 'United States',
    founded: null,
    specialty: ['Global loose leaf', 'American-grown herbals', 'Ethical sourcing'],
  },
  commoditeas: {
    name: 'CommodiTeas',
    slug: 'commoditeas',
    url: 'https://commoditeas.com',
    description: 'Detroit-based premium tea company specializing in organic luxury loose leaf teas.',
    city: 'Detroit',
    state: 'MI',
    country: 'United States',
    founded: null,
    specialty: ['Organic tea', 'Luxury loose leaf'],
  },
  senchateabar: {
    name: 'Sencha Tea Bar',
    slug: 'sencha-tea-bar',
    url: 'https://senchateabar.com',
    description: "Minnesota's premier loose leaf tea retailer with locations in Minneapolis and Madison, WI. Wide variety of black, green, herbal, oolong, chai, white, and premium teas.",
    city: 'Minneapolis',
    state: 'MN',
    country: 'United States',
    founded: null,
    specialty: ['Black tea', 'Green tea', 'Herbal tea', 'Chai'],
  },
  northeastteahouse: {
    name: 'Northeast Tea House',
    slug: 'northeast-tea-house',
    url: 'https://northeastteahouse.com',
    description: "Minneapolis tea house specializing in Asian tea traditions including house-milled Japanese matcha, gongfu tea service, and Pu'er.",
    city: 'Minneapolis',
    state: 'MN',
    country: 'United States',
    founded: null,
    specialty: ['Japanese matcha', 'Gongfu', 'Pu-erh', 'Chinese tea'],
  },
  storehousetea: {
    name: 'Storehouse Tea',
    slug: 'storehouse-tea',
    url: 'https://storehousetea.com',
    description: 'Woman-owned Cleveland tea company since 2007. Certified organic and Fair Trade, small batch, hand-blended teas in biodegradable packaging.',
    city: 'Cleveland',
    state: 'OH',
    country: 'United States',
    founded: 2007,
    specialty: ['Organic tea', 'Fair Trade', 'Hand-blended'],
  },
  londonteamerchant: {
    name: 'London Tea Merchant',
    slug: 'london-tea-merchant',
    url: 'https://londonteamerchant.com',
    description: 'Family-owned since 1987 by UK expats. British-style teas expertly blended by a certified Tea Sommelier, supplying The London Tea Room in St. Louis.',
    city: 'St. Louis',
    state: 'MO',
    country: 'United States',
    founded: 1987,
    specialty: ['British tea', 'English Breakfast', 'Earl Grey', 'Classic blends'],
  },
  bighearttea: {
    name: 'Big Heart Tea Co.',
    slug: 'big-heart-tea',
    url: 'https://bighearttea.com',
    description: 'St. Louis organic herbal tea company on a covert mission to make people feel good. Focus on healing herbs and adaptogens, including caffeine alternatives like "Fake Coffee".',
    city: 'St. Louis',
    state: 'MO',
    country: 'United States',
    founded: null,
    specialty: ['Organic herbal', 'Wellness tea', 'Adaptogens'],
  },
  // West US Tea Shops
  chadotea: {
    name: 'Chado Tea',
    slug: 'chado-tea',
    url: 'https://www.chadotea.com',
    description: 'Multi-origin specialty tea company in Los Angeles for over 30 years, offering a wide variety of premium loose leaf teas.',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    founded: null,
    specialty: ['Pu-Erh', 'Oolong', 'Black tea', 'Green tea', 'Flavored blends'],
  },
  redblossom: {
    name: 'Red Blossom Tea',
    slug: 'red-blossom-tea',
    url: 'https://redblossomtea.com',
    description: 'Family-run Chinese and Taiwanese tea importer in San Francisco since 1985. Direct relationships with tea farms for premium selections.',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    founded: 1985,
    specialty: ['Oolong', 'Pu-erh', 'Green tea', 'Matcha', 'Chinese tea'],
  },
  vitaltealeaf: {
    name: 'Vital Tea Leaf',
    slug: 'vital-tea-leaf',
    url: 'https://vitaltealeaf.net',
    description: 'Chinatown institution in San Francisco known for tea tastings and education, with strong focus on traditional Chinese and Taiwanese teas.',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    founded: null,
    specialty: ['Oolong', 'Taiwanese high mountain', 'Chinese tea', 'Pu-erh'],
  },
  perennialtearoom: {
    name: 'Perennial Tea Room',
    slug: 'perennial-tea-room',
    url: 'https://perennialtearoom.com',
    description: 'Local Seattle institution near Pike Place for over 30 years, selling loose leaf tea by the ounce with bulk discounts.',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    founded: null,
    specialty: ['Black tea', 'Green tea', 'Herbal', 'Flavored blends', 'White tea'],
  },
  floatingleaves: {
    name: 'Floating Leaves Tea',
    slug: 'floating-leaves-tea',
    url: 'https://floatingleaves.com',
    description: 'Seattle-based Taiwanese oolong specialist with in-house roasting. Highly curated, focused selection for oolong enthusiasts.',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    founded: null,
    specialty: ['Taiwanese oolong', 'Roasted oolong', 'High mountain oolong', 'Aged oolong'],
  },
  oregonteatraders: {
    name: 'Oregon Tea Traders',
    slug: 'oregon-tea-traders',
    url: 'https://oregonteatraders.com',
    description: 'Portland-based artisanal loose leaf tea company with American-made blends, health and wellness focused with gongfu accessories.',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    founded: null,
    specialty: ['Multi-origin', 'House blends', 'Gongfu', 'Wellness teas'],
  },
  pointlomatea: {
    name: 'Point Loma Tea',
    slug: 'point-loma-tea',
    url: 'https://pointlomatea.com',
    description: 'Local San Diego tea shop with tearoom, offering premium loose leaf and whimsical dessert-inspired teas.',
    city: 'San Diego',
    state: 'CA',
    country: 'United States',
    founded: null,
    specialty: ['Black tea', 'Green tea', 'Oolong', 'Herbal', 'Dessert teas'],
  },
  parutea: {
    name: 'PARU Tea',
    slug: 'paru-tea',
    url: 'https://paruteabar.com',
    description: 'Modern tea bar in La Jolla with Japanese-influenced aesthetic, offering single-origin teas and original blends.',
    city: 'San Diego',
    state: 'CA',
    country: 'United States',
    founded: null,
    specialty: ['Matcha', 'Japanese tea', 'Loose leaf', 'Tisanes'],
  },
  teaandwhisk: {
    name: 'Tea & Whisk',
    slug: 'tea-and-whisk',
    url: 'https://teaandwhisk.com',
    description: 'Family business in Las Vegas with serious tea focus, notable aged pu-erh collection and direct sourcing from China and Taiwan.',
    city: 'Las Vegas',
    state: 'NV',
    country: 'United States',
    founded: null,
    specialty: ['Aged Pu-erh', 'Oolong', 'Green tea', 'Japanese tea', 'Matcha'],
  },
  // Texas tea shops
  trueleaftea: {
    name: 'True Leaf Tea Co.',
    slug: 'true-leaf-tea',
    url: 'https://trueleaftea.com',
    description: 'Woman-owned Houston tea company founded by Certified Tea Blending Master Kim McHugh. Specializes in organic loose leaf teas with a strong matcha focus.',
    city: 'Houston',
    state: 'TX',
    country: 'United States',
    founded: 2010,
    specialty: ['Organic tea', 'Matcha', 'Loose leaf'],
  },
  teaintexas: {
    name: 'TEAinTEXAS',
    slug: 'teaintexas',
    url: 'https://teaintexas.com',
    description: 'Family-owned artisan tea company based in Cypress, Texas. Creates award-winning small-batch blends with Texas themes, partnering with local farms.',
    city: 'Cypress',
    state: 'TX',
    country: 'United States',
    founded: 2010,
    specialty: ['Texas-themed blends', 'Artisan blends', 'Small-batch'],
  },
  culturedcup: {
    name: 'The Cultured Cup',
    slug: 'the-cultured-cup',
    url: 'https://www.theculturedcup.com',
    description: 'Premier Dallas-area tea destination with 30 years in business. Features the largest US selection of Mariage Frères teas alongside premium global offerings.',
    city: 'Farmers Branch',
    state: 'TX',
    country: 'United States',
    founded: 1995,
    specialty: ['Premium tea', 'Mariage Frères', 'Global teas'],
  },
  rakkasantea: {
    name: 'Rakkasan Tea Company',
    slug: 'rakkasan-tea',
    url: 'https://www.rakkasantea.com',
    description: 'Dallas-based tea company with a unique social mission, sourcing teas from post-conflict countries to promote peace through trade.',
    city: 'Dallas',
    state: 'TX',
    country: 'United States',
    founded: null,
    specialty: ['Ethical sourcing', 'Post-conflict origins', 'Social mission'],
  },
  happynesstea: {
    name: 'Happyness Tea & Spice Company',
    slug: 'happyness-tea-spice',
    url: 'https://happynesstea.co',
    description: 'San Antonio tea shop offering custom blends and unique tea-spice combinations with personalized consultation services.',
    city: 'San Antonio',
    state: 'TX',
    country: 'United States',
    founded: null,
    specialty: ['Custom blends', 'Tea & spice', 'Consultations'],
  },
  zhitea: {
    name: 'Zhi Tea',
    slug: 'zhi-tea',
    url: 'https://zhitea.com',
    description: 'Award-winning Austin tea house focused on premium loose leaf teas with a strong commitment to sustainable agriculture practices.',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    founded: null,
    specialty: ['Sustainable tea', 'Premium loose leaf', 'Artisan'],
  },
  teaembassy: {
    name: 'Tea Embassy',
    slug: 'tea-embassy',
    url: 'https://teaembassy.com',
    description: 'Austin tea company in business since 2004, offering over 100 loose leaf varieties with wholesale programs and a personal touch.',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    founded: 2004,
    specialty: ['Loose leaf tea', 'Wholesale', 'Global varieties'],
  },
  buddhateas: {
    name: 'Buddha Teas',
    slug: 'buddha-teas',
    url: 'https://www.buddhateas.com',
    description: 'Organic tea company offering over 100 varieties of herbal, green, black, and specialty teas in eco-friendly bleach-free tea bags.',
    city: 'Carlsbad',
    state: 'CA',
    country: 'United States',
    founded: 2006,
    specialty: ['Organic tea', 'CBD tea', 'Mushroom tea', 'Chakra blends'],
    collection: 'all-teas',
  },
  fullleaf: {
    name: 'Full Leaf Tea Company',
    slug: 'full-leaf-tea-company',
    url: 'https://fullleafteacompany.com',
    description: 'Premium organic loose leaf tea company founded in 2014, specializing in wellness teas, matcha, and handcrafted blends.',
    city: null,
    state: null,
    country: 'United States',
    founded: 2014,
    specialty: ['Organic tea', 'Wellness blends', 'Matcha', 'Loose leaf'],
  },
  boulderteaco: {
    name: 'The Boulder Tea Company',
    slug: 'boulder-tea-company',
    url: 'https://boulderteaco.com',
    description: 'Boulder-based tea company connected to the Boulder Dushanbe Teahouse, offering premium loose leaf teas and tea accessories with a focus on quality and tradition.',
    city: 'Boulder',
    state: 'CO',
    country: 'United States',
    founded: null,
    specialty: ['Premium loose leaf', 'Tea accessories', 'Teahouse experience'],
  },
  onerivertea: {
    name: 'One River Tea',
    slug: 'one-river-tea',
    url: 'https://onerivertea.com',
    description: 'Tea cooperative focused on direct trade, visiting every farm from bush to brew. Specializes in authentic Chinese teas including pu-erh, Liubao, and rare varieties.',
    city: null,
    state: null,
    country: 'China',
    founded: null,
    specialty: ['Direct trade', 'Pu-erh', 'Liubao', 'Chinese tea'],
  },
  jessesteahouse: {
    name: "Jesse's Teahouse",
    slug: 'jesses-teahouse',
    url: 'https://jessesteahouse.com',
    description: 'Online teahouse focused on sharing Gongfu tea culture with tea friends worldwide. Offers Chinese whole leaf teas including pu-erh, white, red, and black teas, plus tea pets and equipment.',
    city: null,
    state: null,
    country: 'United States',
    founded: null,
    specialty: ['Gongfu tea', 'Pu-erh', 'Chinese tea', 'Tea pets', 'Tea equipment'],
  },
  kettl: {
    name: 'Kettl',
    slug: 'kettl',
    url: 'https://kettl.co',
    description: 'Fine Japanese tea company offering the highest quality Japanese green teas, many rarely found outside Japan. Features sencha, matcha, gyokuro, and artisan Japanese teaware.',
    city: 'Brooklyn',
    state: 'NY',
    country: 'United States',
    founded: null,
    specialty: ['Japanese tea', 'Matcha', 'Sencha', 'Gyokuro', 'Premium Japanese'],
  },
  rishi: {
    name: 'Rishi Tea & Botanicals',
    slug: 'rishi-tea-botanicals',
    url: 'https://rishi-tea.com',
    description: 'Direct-trade organic loose leaf tea company. Huge catalog of single-origin teas and botanicals.',
    city: 'Milwaukee',
    state: 'WI',
    country: 'United States',
    founded: 1997,
    specialty: ['Organic tea', 'Loose leaf', 'Botanicals', 'Single origin'],
  },
  churchills: {
    name: "Churchill's Fine Teas",
    slug: 'churchills-fine-teas',
    url: 'https://churchillsteas.com',
    description: "Cincinnati's premier loose leaf tea shop. Wide selection of loose leaf teas and teaware.",
    city: 'Cincinnati',
    state: 'OH',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Teaware'],
  },
  fragrantleaf: {
    name: 'The Fragrant Leaf',
    slug: 'the-fragrant-leaf',
    url: 'https://thefragrantleaf.com',
    description: 'Specialty loose leaf tea shop with Asian-style teaware. Unique Southwest tea destination.',
    city: 'Albuquerque',
    state: 'NM',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Asian teaware'],
  },
  goldenmoon: {
    name: 'Golden Moon Tea',
    slug: 'golden-moon-tea',
    url: 'https://goldenmoontea.com',
    description: 'Artisan loose leaf tea, hand-blended with chemical-free processing.',
    city: 'Golden',
    state: 'CO',
    country: 'United States',
    founded: 2005,
    specialty: ['Artisan tea', 'Hand-blended', 'Loose leaf'],
  },
  oldtownspice: {
    name: 'Old Town Spice & Tea Merchants',
    slug: 'old-town-spice-tea-merchants',
    url: 'https://spiceandteamerchants.com',
    description: 'Over 150 loose leaf teas sourced from 12+ specialty vendors worldwide.',
    city: 'Temecula',
    state: 'CA',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Spices', 'Specialty blends'],
  },
  elmwoodinn: {
    name: 'Elmwood Inn Fine Teas',
    slug: 'elmwood-inn-fine-teas',
    url: 'https://store.elmwoodinn.com',
    description: 'Kentucky-based premium loose leaf tea and tea foods.',
    city: 'Danville',
    state: 'KY',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Tea foods'],
  },
  transpacific: {
    name: 'Transpacific Tea',
    slug: 'transpacific-tea',
    url: 'https://transpacifictea.com',
    description: 'Specializes in Taiwanese oolong teas. Small but expertly curated selection.',
    city: null,
    state: 'CA',
    country: 'United States',
    founded: null,
    specialty: ['Taiwanese oolong', 'Specialty oolong'],
  },
  teahaus: {
    name: 'TeaHaus',
    slug: 'teahaus',
    url: 'https://teahaus.com',
    description: 'Over 170 loose leaf teas with a strong local following in Ann Arbor.',
    city: 'Ann Arbor',
    state: 'MI',
    country: 'United States',
    founded: null,
    specialty: ['Loose leaf tea', 'Local tea shop'],
  },
  plumdeluxe: {
    name: 'Plum Deluxe',
    slug: 'plum-deluxe',
    url: 'https://plumdeluxe.com',
    description: 'Hand-blended loose leaf tea with popular subscription model.',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    founded: 2012,
    specialty: ['Hand-blended', 'Loose leaf', 'Tea subscriptions'],
  },
};

// Map tags to tea types
function getTeaType(tags, title) {
  const str = [...tags, title].join(' ').toLowerCase();
  if (str.includes('pu-erh') || str.includes('puerh')) return 'puerh';
  if (str.includes('oolong')) return 'oolong';
  if (str.includes('white tea')) return 'white';
  if (str.includes('green tea') || str.includes('matcha')) return 'green';
  if (str.includes('black tea') || str.includes('chai') || str.includes('earl grey') || str.includes('english breakfast')) return 'black';
  if (str.includes('herbal') || str.includes('rooibos') || str.includes('chamomile') || str.includes('peppermint') || str.includes('tisane')) return 'herbal';
  // Default based on keywords
  if (str.includes('green')) return 'green';
  if (str.includes('black')) return 'black';
  return 'herbal';
}

// Clean HTML description
function cleanDescription(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

// Filter for actual tea products
function isTeaProduct(product) {
  const title = product.title.toLowerCase();
  const tags = (product.tags || []).map(t => t.toLowerCase());
  const type = product.product_type?.toLowerCase() || '';
  
  // Exclude non-tea items
  const excludePatterns = [
    'gift', 'sampler', 'variety pack', 'assortment', 'discovery box',
    'mug', 'cup', 'teapot', 'infuser', 'accessory', 'accessories',
    'honey', 'sweetener', 'cookie', 'biscuit',
    'lozenge', 'capsule', 'supplement', 'carbon offset', 'carbon neutral',
    'latte powder', 'drinking chocolate',
    'teaware', 'gift card', 'membership', 'bundle', 'custom gift', 'tea gift',
    'combo', 'set of',
  ];
  
  if (excludePatterns.some(p => title.includes(p) || type.includes(p))) return false;
  
  // Include if product_type explicitly mentions tea type
  if (/^(black|green|white|herbal|oolong)\s*tea$/i.test(type)) return true;
  if (type === 'assorted') return true; // Tea Forté uses this
  
  const includePatterns = ['tea', 'chai', 'matcha', 'tisane', 'herbal', 'infusion'];
  return includePatterns.some(p => title.includes(p) || tags.some(t => t.includes(p)));
}

async function ensureCompany(brandKey) {
  const brand = BRANDS[brandKey];
  
  // Check if exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', brand.slug)
    .single();
  
  if (existing) {
    console.log(`  Company exists: ${brand.name} (${existing.id})`);
    return existing.id;
  }
  
  // Create
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      website_url: brand.url,
      headquarters_city: brand.city,
      headquarters_state: brand.state,
      headquarters_country: brand.country,
      founded_year: brand.founded,
      specialty: brand.specialty,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`  Failed to create company:`, error.message);
    return null;
  }
  
  console.log(`  Created company: ${brand.name} (${data.id})`);
  return data.id;
}

async function scrapeBrand(brandKey) {
  const brand = BRANDS[brandKey];
  console.log(`\nScraping ${brand.name}...`);
  
  const companyId = await ensureCompany(brandKey);
  if (!companyId) return { imported: 0, skipped: 0 };
  
  // Fetch products
  const response = await fetch(`${brand.url}/products.json?limit=250`);
  const data = await response.json();
  
  const teas = data.products.filter(isTeaProduct);
  console.log(`  Found ${teas.length} tea products`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const product of teas) {
    // Check for duplicate
    const { data: existing } = await supabase
      .from('teas')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', product.title)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    const teaData = {
      name: product.title,
      company_id: companyId,
      brand_name: brand.name,
      tea_type: getTeaType(product.tags || [], product.title),
      description: cleanDescription(product.body_html),
      image_url: product.images?.[0]?.src || null,
      product_url: product.handle ? `${brand.url}/products/${product.handle}` : null,
    };
    
    const { error } = await supabase.from('teas').insert(teaData);
    
    if (error) {
      console.error(`  Failed: ${product.title} - ${error.message}`);
    } else {
      imported++;
    }
  }
  
  console.log(`  Imported: ${imported}, Skipped: ${skipped}`);
  return { imported, skipped };
}

async function main() {
  const brands = process.argv.slice(2);
  
  if (brands.length === 0) {
    console.log('Scraping all brands:', Object.keys(BRANDS).join(', '));
    for (const brand of Object.keys(BRANDS)) {
      await scrapeBrand(brand);
    }
  } else {
    for (const brand of brands) {
      if (BRANDS[brand]) {
        await scrapeBrand(brand);
      } else {
        console.error(`Unknown brand: ${brand}`);
      }
    }
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
