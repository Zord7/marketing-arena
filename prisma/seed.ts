import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const products = [
  // ── AD_COPY (15) ──────────────────────────────────────────────
  {
    name: "NovaBrew Single-Origin Coffee",
    description: "Monthly subscription delivering freshly roasted single-origin beans from 12 rotating farms worldwide, ground to order.",
    targetAudience: "Home-brewing coffee enthusiasts aged 25–45 who care about provenance",
    keySellingPoint: "Farm-to-cup in under 48 hours after roasting — flavour you can taste",
    category: "AD_COPY",
  },
  {
    name: "ClearMind Focus Capsules",
    description: "Science-backed nootropic supplement combining lion's mane, bacopa, and L-theanine for sustained mental clarity.",
    targetAudience: "Knowledge workers, students, and entrepreneurs seeking a clean cognitive edge",
    keySellingPoint: "No crash, no jitters — clinically studied ingredients at therapeutic doses",
    category: "AD_COPY",
  },
  {
    name: "SafeNest Pet Insurance",
    description: "Comprehensive pet health insurance covering accidents, illness, surgery, and routine wellness with same-day claim approval.",
    targetAudience: "Millennial dog and cat owners who treat pets as family members",
    keySellingPoint: "Claims approved in under 2 hours via the app — zero paperwork",
    category: "AD_COPY",
  },
  {
    name: "TastyBox Meal Kit",
    description: "Weekly box of pre-portioned restaurant-quality ingredients with 20-minute chef-designed recipes delivered to your door.",
    targetAudience: "Busy couples and young families who want home-cooked meals without the planning",
    keySellingPoint: "Dinner on the table in 20 minutes — with zero food waste",
    category: "AD_COPY",
  },
  {
    name: "SkyDesk Project Manager",
    description: "AI-assisted project management SaaS that auto-prioritises tasks, flags bottlenecks, and writes status updates for you.",
    targetAudience: "Remote-first tech teams and freelance agencies managing multiple client projects",
    keySellingPoint: "Save 5 hours of admin per week — the AI handles the busywork",
    category: "AD_COPY",
  },
  {
    name: "ZenSleep Smart Ring",
    description: "Lightweight sleep tracker worn on the finger that monitors sleep stages, HRV, and blood oxygen with medical-grade sensors.",
    targetAudience: "Health-optimising adults aged 30–55 who struggle with poor sleep quality",
    keySellingPoint: "Identifies your exact sleep debt and tells you precisely when to go to bed",
    category: "AD_COPY",
  },
  {
    name: "SwiftSave Budgeting App",
    description: "Personal finance app that connects to all UK banks, auto-categorises spending, and sets visual savings goals with micro-automations.",
    targetAudience: "25–35 year olds trying to save for a first home or emergency fund",
    keySellingPoint: "Users save an average of £340 extra per month without feeling restricted",
    category: "AD_COPY",
  },
  {
    name: "GrowthPulse Email Marketing",
    description: "AI-powered email marketing platform that writes, tests, and sends high-converting sequences tailored to individual subscriber behaviour.",
    targetAudience: "E-commerce founders and indie hackers with 1k–100k subscriber lists",
    keySellingPoint: "Average open rate boost of 31% in the first 30 days — or your money back",
    category: "AD_COPY",
  },
  {
    name: "BrightSmile Sonic Toothbrush",
    description: "Professional-grade sonic toothbrush with 31,000 strokes per minute, UV sanitiser lid, and a 3-month subscription brush head plan.",
    targetAudience: "Adults who want dentist-level clean at home and hate dealing with plaque build-up",
    keySellingPoint: "Removes 10× more plaque than manual brushing — dentists recommend it",
    category: "AD_COPY",
  },
  {
    name: "EcoDrive Car Insurance",
    description: "Usage-based car insurance that prices premiums on actual driving behaviour captured via a discreet OBD dongle — not age or postcode.",
    targetAudience: "Careful low-mileage drivers and young drivers penalised by traditional insurers",
    keySellingPoint: "Good drivers pay up to 40% less — your premium reflects YOU, not the average",
    category: "AD_COPY",
  },
  {
    name: "MindfulMoves Yoga App",
    description: "Streaming yoga and meditation app with 800+ classes, personalised 4-week programmes, and a live instructor Q&A community.",
    targetAudience: "Women aged 28–45 managing stress and wanting flexible at-home fitness",
    keySellingPoint: "First results in 7 days — our guided 10-minute morning flow is scientifically proven to lower cortisol",
    category: "AD_COPY",
  },
  {
    name: "LearnLaunch Coding Bootcamp",
    description: "12-week online coding bootcamp in full-stack JavaScript with live mentorship, portfolio projects, and a job-guarantee clause.",
    targetAudience: "Career-changers aged 22–40 aiming for a developer role without a CS degree",
    keySellingPoint: "Get hired or get a full refund — 94% of graduates land a job within 6 months",
    category: "AD_COPY",
  },
  {
    name: "ClearSkin Vitamin C Serum",
    description: "20% stabilised vitamin C serum with hyaluronic acid and niacinamide, formulated for all skin tones and dermatologist tested.",
    targetAudience: "Women and men aged 25–40 battling hyperpigmentation and dull, uneven skin tone",
    keySellingPoint: "Visible brightening in 14 days — the highest vitamin C concentration available without a prescription",
    category: "AD_COPY",
  },
  {
    name: "SparkClean Home Services",
    description: "On-demand professional home cleaning service bookable in 60 seconds, using eco-certified products with vetted and insured cleaners.",
    targetAudience: "Dual-income households and busy professionals who hate spending weekends cleaning",
    keySellingPoint: "Eco-friendly, background-checked, and bookable for today — happiness guarantee on every clean",
    category: "AD_COPY",
  },
  {
    name: "AquaPure Filtered Water Bottle",
    description: "Stainless steel insulated bottle with a built-in 3-stage carbon filter that removes chlorine, heavy metals, and microplastics from tap water.",
    targetAudience: "Health-conscious millennials and hikers who want clean water anywhere without single-use plastic",
    keySellingPoint: "Eliminates 99.9% of contaminants — tastes better than bottled water at a fraction of the cost",
    category: "AD_COPY",
  },

  // ── VISUAL_AD (15) ────────────────────────────────────────────
  {
    name: "Chrono Luxe Mechanical Watch",
    description: "Swiss-movement automatic watch in 316L stainless steel with a sapphire crystal dial, 100m water resistance, and 72-hour power reserve.",
    targetAudience: "Aspirational professionals aged 30–55 who see a watch as a statement of success",
    keySellingPoint: "Handcrafted Swiss movement at a fraction of luxury brand prices — precision that lasts a lifetime",
    category: "VISUAL_AD",
  },
  {
    name: "UrbanEdge Selvedge Denim",
    description: "Japanese selvedge denim jeans cut slim-straight, sanforised and stonewashed, built to fade beautifully over years of wear.",
    targetAudience: "Style-conscious men aged 22–38 who value craftsmanship over fast fashion",
    keySellingPoint: "Jeans that improve with age — the more you wear them, the more uniquely yours they become",
    category: "VISUAL_AD",
  },
  {
    name: "SpaceWise Interior Design",
    description: "Online interior design service that transforms any room into a curated space using a 3D visualisation tool and access to trade-only furniture.",
    targetAudience: "New homeowners and renters aged 28–45 who want a stylish home but feel overwhelmed",
    keySellingPoint: "See your redesigned room in 3D before spending a penny on furniture",
    category: "VISUAL_AD",
  },
  {
    name: "Voyager Boutique Travel",
    description: "Bespoke travel agency crafting hand-curated itineraries to underrated destinations, with private guides and off-the-beaten-path experiences.",
    targetAudience: "Affluent couples and solo travellers aged 35–60 bored of tourist traps",
    keySellingPoint: "Places 97% of tourists never find — completely personalised, never repeated",
    category: "VISUAL_AD",
  },
  {
    name: "SpeedKick Pro Running Shoes",
    description: "Performance running shoes with a carbon-fibre plate, nitrogen-infused foam midsole, and a breathable engineered knit upper.",
    targetAudience: "Recreational runners and triathletes chasing a personal best",
    keySellingPoint: "Shave 4% off your race time — the same technology elite marathon runners use",
    category: "VISUAL_AD",
  },
  {
    name: "Radiance Clean Beauty Line",
    description: "Full-coverage foundation range with 40 inclusive shades, SPF 30, and a 100% clean formula free of parabens, sulphates, and silicones.",
    targetAudience: "Makeup-wearing adults aged 18–45 who refuse to compromise skin health for coverage",
    keySellingPoint: "Looks like a filter — feels like skincare — zero toxic ingredients, ever",
    category: "VISUAL_AD",
  },
  {
    name: "CraftHaus Session IPA",
    description: "Small-batch session IPA brewed with Citra and Mosaic hops, 4.2% ABV, unfiltered and naturally hazy with tropical fruit aromatics.",
    targetAudience: "Craft beer drinkers aged 25–40 who want full flavour without high alcohol",
    keySellingPoint: "Tropical, hazy, and sessionable — all the craft, none of the morning regret",
    category: "VISUAL_AD",
  },
  {
    name: "GlideX Electric Scooter",
    description: "Foldable electric scooter with a 35km range, 25km/h top speed, regenerative braking, and an IP65 waterproof rating.",
    targetAudience: "Urban commuters aged 20–40 who want a faster, greener alternative to public transport",
    keySellingPoint: "Door-to-door in half the time — fold it, carry it, never look for parking again",
    category: "VISUAL_AD",
  },
  {
    name: "NestIQ Smart Thermostat",
    description: "AI learning thermostat that maps your household's schedule and adjusts temperature automatically, controllable via app or voice.",
    targetAudience: "Tech-savvy homeowners concerned about energy bills and environmental impact",
    keySellingPoint: "Learns your routine in 7 days and cuts heating bills by an average of 23%",
    category: "VISUAL_AD",
  },
  {
    name: "PowerForge Home Gym System",
    description: "Modular cable-and-pulley home gym system that packs into a wall-mounted unit and replicates 200+ gym exercises using adjustable resistance.",
    targetAudience: "Fitness-focused adults who cancelled their gym membership and train at home",
    keySellingPoint: "200 exercises in 1 square metre — the full gym, redesigned for your spare room",
    category: "VISUAL_AD",
  },
  {
    name: "ArtNova Limited Print Shop",
    description: "E-commerce platform selling limited-edition art prints from emerging illustrators, printed on museum-grade archival paper with COA.",
    targetAudience: "Art-loving millennials aged 25–40 decorating their homes on a non-gallery budget",
    keySellingPoint: "Collect art that appreciates — every print is numbered, signed, and limited to 50 copies",
    category: "VISUAL_AD",
  },
  {
    name: "ThreadSustain Slow Fashion",
    description: "Sustainable clothing brand producing capsule-wardrobe staples from GOTS-certified organic cotton and recycled ocean plastic fibres.",
    targetAudience: "Eco-conscious consumers aged 22–38 who are done with fast fashion's environmental cost",
    keySellingPoint: "Every item is made from ocean plastic — your wardrobe literally cleans the sea",
    category: "VISUAL_AD",
  },
  {
    name: "GameThrone Ergonomic Chair",
    description: "4D-adjustable gaming and work chair with lumbar support, a headrest pillow, cold-foam seat cushion, and a recline up to 165°.",
    targetAudience: "Gamers and remote workers aged 18–35 spending 6+ hours a day seated",
    keySellingPoint: "Engineered to eliminate lower back pain — notice the difference within the first session",
    category: "VISUAL_AD",
  },
  {
    name: "SnapStudio Photography Workshop",
    description: "Weekend immersive photography workshops in iconic city locations, taught by published photographers with max 6 students per session.",
    targetAudience: "Amateur photographers aged 25–50 who own a camera but feel stuck at a beginner level",
    keySellingPoint: "Leave with a portfolio-ready set of 20 shots after one weekend — guaranteed",
    category: "VISUAL_AD",
  },
  {
    name: "Petal & Bloom Same-Day Florist",
    description: "Online florist offering hand-tied bouquets and subscription arrangements sourced from sustainable UK farms, delivered same day before 1pm.",
    targetAudience: "Gift-givers and event planners who want fresh, seasonal flowers without visiting a shop",
    keySellingPoint: "Seasonal, sustainable, and on your doorstep by lunch — or the next bouquet is free",
    category: "VISUAL_AD",
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding products...");

  // Clear existing products first (safe for dev)
  await prisma.product.deleteMany();

  for (const p of products) {
    await prisma.product.create({ data: p as any });
  }

  console.log(`✅ Seeded ${products.length} products (${products.filter(p => p.category === "AD_COPY").length} AD_COPY, ${products.filter(p => p.category === "VISUAL_AD").length} VISUAL_AD)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); });
