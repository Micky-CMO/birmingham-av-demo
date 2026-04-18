import dotenv from 'dotenv';
import path from 'node:path';
// Load .env.local from monorepo root (where Vercel CLI writes it) plus local .env fallbacks
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();
import crypto from 'node:crypto';
import { prisma } from './prisma';
import { connectMongo, disconnectMongo } from './mongo';
import { ProductCatalog } from './mongo/product-catalog';

// --- helpers ---

const BUILDER_FIRST_NAMES = [
  'Alfie','Bea','Callum','Dev','Eira','Finn','Gail','Harvey','Iris','Jared',
  'Kira','Luca','Maeve','Nikhil','Owen','Priya','Quinn','Ravi','Saoirse','Theo','Una','Vik',
];
const BUILDER_SURNAMES = [
  'Ashworth','Brennan','Crowe','Deol','Elford','Flint','Granger','Holt','Ingram','Jarvis',
  'Kavanagh','Lomax','Merriweather','Norris','Olmos','Pritchard','Quayle','Ramsay','Sallow','Taft','Usher','Vickers',
];
const TIERS = ['probation', 'standard', 'preferred', 'elite'] as const;
const CONDITION_GRADES = ['New', 'Like New', 'Excellent', 'Very Good', 'Good'] as const;

// --- builder profiles: bios, specialities, yearsBuilding, favouriteBuild ---
// Order matches BUILDER_FIRST_NAMES / BUILDER_SURNAMES. Index 0-2 = elite (6-8y),
// 3-9 = preferred (3-6y), 10-17 = standard (1-4y), 18-21 = probation (1y).

type BuilderProfile = {
  bio: string;
  specialities: string[];
  yearsBuilding: number;
  favouriteBuild: string;
};

const BUILDER_PROFILES: BuilderProfile[] = [
  // --- elite (6-8 years) ---
  {
    // 0: Alfie Ashworth
    bio: 'Eight years at BAV, running the Hub A bench since 2019. Specialises in quiet builds, silent PSUs, and 0-decibel fan curves. Runs Arch at home and denies it any chance he gets.',
    specialities: ['Silent builds', 'Workstations', 'Gaming PCs'],
    yearsBuilding: 8,
    favouriteBuild: 'Ryzen 9 7950X in a Fractal Define 7 with a Noctua NH-U12A and three Phanteks T30s on a silent curve.',
  },
  {
    // 1: Bea Brennan
    bio: 'Seven years on the bench. Known for cable routing so clean customers ask if it is AI generated. Will argue the case for Intel on a Tuesday and AMD on a Thursday.',
    specialities: ['Gaming PCs', 'Water cooling'],
    yearsBuilding: 7,
    favouriteBuild: 'i7-14700K with an EK Quantum 360mm loop in a Lian Li O11 Dynamic Evo, soft tubing, clear coolant.',
  },
  {
    // 2: Callum Crowe
    bio: 'Six years at BAV, came over from a Leeds custom shop. Does most of our custom-loop work and a lot of the rack-mount AV installs. Refuses to touch pump screws without a torque driver.',
    specialities: ['Water cooling', 'Rack-mount AV', 'Server builds'],
    yearsBuilding: 6,
    favouriteBuild: 'Threadripper 7970X in a Phanteks Enthoo Pro 2 Server with dual 420mm rads and EK Vector GPU blocks.',
  },

  // --- preferred (3-6 years) ---
  {
    // 3: Dev Deol
    bio: 'Five years on the team, started as a part-time tester. Reputation for zero-cable-seen rigs and aggressive aesthetic choices. Favours AMD, tolerates Intel.',
    specialities: ['Gaming PCs', 'ITX small form factor'],
    yearsBuilding: 5,
    favouriteBuild: 'Ryzen 7 7800X3D in a Hyte Y60 with a 4070 Ti Super and a 280mm AIO on the top.',
  },
  {
    // 4: Eira Elford
    bio: 'Five years at BAV. Does most of the workstation and CAD-oriented builds, talks shop with the architects. Keeps a spreadsheet of every build ever shipped and has strong opinions about it.',
    specialities: ['Workstations', 'Server builds'],
    yearsBuilding: 5,
    favouriteBuild: 'Xeon W-2495X in a Fractal Meshify 2 XL with a Quadro RTX A5000 and 256GB ECC DDR5.',
  },
  {
    // 5: Finn Flint
    bio: 'Four years at BAV after two years at a Manchester repair shop. Lives in ITX cases and has shipped more Sliger SM580s than anyone on the team. Has opinions about riser cables.',
    specialities: ['ITX small form factor', 'Gaming PCs'],
    yearsBuilding: 4,
    favouriteBuild: 'Ryzen 7 5800X3D in a Sliger SM580 with a 240mm AIO and a 4070 on a short PCIe 4.0 riser.',
  },
  {
    // 6: Gail Granger
    bio: 'Four years on the bench, came up through our Hub B apprentice programme. Does the heavy-metal gaming rigs and the occasional streaming setup. Reliably beats every ETA we give her.',
    specialities: ['Gaming PCs', 'Workstations'],
    yearsBuilding: 4,
    favouriteBuild: 'i9-14900K with an RTX 4080 Super in a Lian Li Lancool III, push-pull on a 360mm AIO.',
  },
  {
    // 7: Harvey Holt
    bio: 'Four years at BAV. Handles almost all the Apple refurb and MacBook work at Hub C. Carries a pentalobe set everywhere and has been known to fix Touch Bar laptops on trains.',
    specialities: ['Apple refurb', 'Laptop repair'],
    yearsBuilding: 4,
    favouriteBuild: 'Rebuilt 2019 Mac Pro with a W-3275M, a W6800X Duo, and a fresh set of DIMMs after a customer spilled coffee into it.',
  },
  {
    // 8: Iris Ingram
    bio: 'Three years at BAV, started off doing QC and moved to the build bench last year. Takes every silent build that comes through the door. Keeps a noise meter in her tool tray.',
    specialities: ['Silent builds', 'Workstations'],
    yearsBuilding: 3,
    favouriteBuild: 'Ryzen 9 7900 non-X in a Be Quiet Silent Base 802 with a Dark Rock Pro 5 and undervolted memory.',
  },
  {
    // 9: Jared Jarvis
    bio: 'Three years at BAV. Mostly gaming bundles and the occasional crypto-wallet workstation for paranoid customers. Carries a retro Game Boy in his back pocket and will show you.',
    specialities: ['Gaming PCs', 'Vintage restorations'],
    yearsBuilding: 3,
    favouriteBuild: 'i5-13600KF with an RX 7800 XT in a NZXT H5 Flow, tuned in Afterburner for a 60W undervolt.',
  },

  // --- standard (1-4 years) ---
  {
    // 10: Kira Kavanagh
    bio: 'Three years at BAV. Came in to help on laptop repairs, now runs most of the board-level diagnostic work out of Hub B. Owns more microscope lenses than she probably needs.',
    specialities: ['Laptop repair', 'Apple refurb'],
    yearsBuilding: 3,
    favouriteBuild: 'Recovered a ThinkPad X1 Carbon Gen 9 after a liquid spill: reballed the DDR and swapped the palmrest in a weekend.',
  },
  {
    // 11: Luca Lomax
    bio: 'Two years on the bench. Started on monitors and side gear, now ships about fifteen gaming PCs a month. Listens to the same three Radiohead albums on loop at the bench.',
    specialities: ['Gaming PCs'],
    yearsBuilding: 2,
    favouriteBuild: 'Ryzen 5 7600 with an RX 7700 XT in a Phanteks Eclipse G360A, RGB kept deliberately boring.',
  },
  {
    // 12: Maeve Merriweather
    bio: 'Two years at BAV after an apprenticeship with a Coventry system integrator. Does most of our rack-mount and AV switcher wiring. Labels every cable on both ends, every time.',
    specialities: ['Rack-mount AV', 'Server builds', 'Workstations'],
    yearsBuilding: 2,
    favouriteBuild: 'A 12U studio rack: ATEM Mini Extreme, a Behringer patchbay, and a tidy fan-out to three mixing monitors.',
  },
  {
    // 13: Nikhil Norris
    bio: 'Two years at BAV, moved from a corporate IT role in Solihull for an actual hands-on job. Takes the tower workstation builds and runs Prime95 for longer than strictly necessary.',
    specialities: ['Workstations', 'Gaming PCs'],
    yearsBuilding: 2,
    favouriteBuild: 'i7-14700 with an RTX 4070 Ti in a Fractal North, paired with a 4TB 990 Pro and a 10TB WD Gold for scratch.',
  },
  {
    // 14: Owen Olmos
    bio: 'Two years on the bench. Vintage gear is his thing: Amigas, Power Mac G4s, the occasional BBC Micro. If a customer wants a working CRT match, it goes to Owen.',
    specialities: ['Vintage restorations', 'Apple refurb'],
    yearsBuilding: 2,
    favouriteBuild: 'A recapped Amiga 1200 with a TerribleFire 1260, PiStorm32, and a Gotek floppy emulator.',
  },
  {
    // 15: Priya Pritchard
    bio: 'Two years at BAV. Does steady work on mid-range gaming bundles and starter office PCs. Known for taping a small cactus to her monitor every January and refusing to explain.',
    specialities: ['Gaming PCs'],
    yearsBuilding: 2,
    favouriteBuild: 'Ryzen 5 5600 with an RTX 4060 in a Cooler Master MasterBox NR200P, tuned for quiet over raw framerates.',
  },
  {
    // 16: Quinn Quayle
    bio: 'One year on the build bench after eighteen months in logistics. Takes the ITX gaming builds nobody else wants and somehow finishes them faster. Drinks only oat flat whites.',
    specialities: ['ITX small form factor', 'Gaming PCs'],
    yearsBuilding: 1,
    favouriteBuild: 'Ryzen 7 7700X with an RTX 4070 in a Formd T1, custom 12VHPWR cable, 2x140mm intake.',
  },
  {
    // 17: Ravi Ramsay
    bio: 'One year at BAV, through our Hub C apprentice scheme. Focuses on laptop repair and the occasional refurb. Obsessive about thermal paste spread patterns.',
    specialities: ['Laptop repair', 'Apple refurb'],
    yearsBuilding: 1,
    favouriteBuild: 'A 2020 MacBook Pro 13" logic board revived after a failed liquid metal repaste, plus a new top case.',
  },

  // --- probation (1 year) ---
  {
    // 18: Saoirse Sallow
    bio: 'Joined BAV late last year from a repair shop in the Jewellery Quarter. Currently on probation builds: starter gaming PCs and office towers. Writes QC notes in a Moleskine.',
    specialities: ['Gaming PCs', 'Workstations'],
    yearsBuilding: 1,
    favouriteBuild: 'Ryzen 5 5600 with a Gigabyte B550 Aorus Elite and a Peerless Assassin 120, her first unassisted build.',
  },
  {
    // 19: Theo Taft
    bio: 'Joined this year, mostly doing QC shadowing and basic desktop builds. Was a vintage synth repair guy in a previous life and still solders through a magnifier lamp.',
    specialities: ['Vintage restorations', 'Laptop repair'],
    yearsBuilding: 1,
    favouriteBuild: 'A bench-tested Juno-60 voice card that doubled as his BAV probation demo piece.',
  },
  {
    // 20: Una Usher
    bio: 'Joined BAV six months ago from a Birmingham college programme. On probation doing small form factor and office builds. Brings in homemade sourdough every Friday for the bench.',
    specialities: ['ITX small form factor'],
    yearsBuilding: 1,
    favouriteBuild: 'i3-14100 in an ASRock DeskMini X600, tuned for low idle wattage and quiet operation.',
  },
  {
    // 21: Vik Vickers
    bio: 'Brand new this year after two years freelancing. Probation roster covers starter gaming rigs and refurb intake. Insists on mechanical keyboards at the bench, Cherry browns only.',
    specialities: ['Gaming PCs'],
    yearsBuilding: 1,
    favouriteBuild: 'Ryzen 5 7600 with an RX 7600 XT in a Lian Li LANCOOL 216, on a budget but still tidy.',
  },
];

function pick<T>(arr: readonly T[], i: number): T {
  const v = arr[i % arr.length];
  if (v === undefined) throw new Error('empty array');
  return v;
}

function rngSeeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

async function sha(pw: string): Promise<string> {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

// --- demo catalog data ---

type SeedProduct = {
  category: string;
  title: string;
  subtitle: string;
  price: number;
  compareAt?: number;
  condition: (typeof CONDITION_GRADES)[number];
  stock: number;
  image: string; // seed number for picsum
  specs: {
    cpu?: { brand: string; family: string; model: string; cores: number; threads: number };
    gpu?: { brand: string; model: string; vramGb: number; rtx?: boolean };
    memory?: { sizeGb: number; type: string; speedMhz: number };
    storage?: Array<{ kind: string; capacityGb: number }>;
    os?: { name: string; edition: string };
  };
};

const DEMO_PRODUCTS: SeedProduct[] = [
  // --- Gaming PC Bundles ---
  {
    category: 'gaming-pc-bundles', title: 'Aegis Ultra RTX 4070 Gaming PC', subtitle: 'Ryzen 7 5800X · 32GB · 1TB NVMe',
    price: 1299, compareAt: 1499, condition: 'Like New', stock: 4, image: 'pc-aegis',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 7', model: '5800X', cores: 8, threads: 16 }, gpu: { brand: 'NVIDIA', model: 'RTX 4070', vramGb: 12, rtx: true }, memory: { sizeGb: 32, type: 'DDR4', speedMhz: 3600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Home' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Titan RTX 4060 Ti Streaming Rig', subtitle: 'i5-13600K · 32GB · 1TB NVMe',
    price: 1099, compareAt: 1249, condition: 'Excellent', stock: 6, image: 'pc-titan',
    specs: { cpu: { brand: 'Intel', family: 'Core i5', model: '13600K', cores: 14, threads: 20 }, gpu: { brand: 'NVIDIA', model: 'RTX 4060 Ti', vramGb: 8, rtx: true }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Home' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Spectre RTX 4080 Super Creator PC', subtitle: 'Ryzen 9 7900X · 64GB · 2TB NVMe',
    price: 2199, compareAt: 2499, condition: 'Like New', stock: 2, image: 'pc-spectre',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '7900X', cores: 12, threads: 24 }, gpu: { brand: 'NVIDIA', model: 'RTX 4080 Super', vramGb: 16, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 6000 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Vanguard RTX 3070 Ti Esports PC', subtitle: 'i7-12700K · 16GB · 500GB NVMe',
    price: 849, compareAt: 999, condition: 'Very Good', stock: 8, image: 'pc-vanguard',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '12700K', cores: 12, threads: 20 }, gpu: { brand: 'NVIDIA', model: 'RTX 3070 Ti', vramGb: 8, rtx: true }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 3200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 500 }], os: { name: 'Windows 11', edition: 'Home' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Cyclone RX 7800 XT Gaming PC', subtitle: 'Ryzen 7 7700X · 32GB · 1TB NVMe',
    price: 1399, condition: 'Excellent', stock: 3, image: 'pc-cyclone',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 7', model: '7700X', cores: 8, threads: 16 }, gpu: { brand: 'AMD', model: 'RX 7800 XT', vramGb: 16 }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Home' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Starter RTX 3060 Bundle', subtitle: 'Ryzen 5 5600 · 16GB · 500GB NVMe',
    price: 649, compareAt: 749, condition: 'Good', stock: 12, image: 'pc-starter',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 5', model: '5600', cores: 6, threads: 12 }, gpu: { brand: 'NVIDIA', model: 'RTX 3060', vramGb: 12, rtx: true }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 3200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 500 }], os: { name: 'Windows 11', edition: 'Home' } },
  },

  // --- Computers (office/workstation) ---
  {
    category: 'computers', title: 'Dell OptiPlex 7090 SFF', subtitle: 'i7-11700 · 16GB · 512GB NVMe',
    price: 389, condition: 'Excellent', stock: 20, image: 'pc-optiplex',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '11700', cores: 8, threads: 16 }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 3200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 512 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'computers', title: 'HP EliteDesk 800 G8 Mini', subtitle: 'i5-11500 · 16GB · 256GB NVMe',
    price: 299, condition: 'Very Good', stock: 35, image: 'pc-elitedesk',
    specs: { cpu: { brand: 'Intel', family: 'Core i5', model: '11500', cores: 6, threads: 12 }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 3200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 256 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'computers', title: 'Lenovo ThinkCentre M720q Tiny', subtitle: 'i7-9700T · 32GB · 1TB SSD',
    price: 349, condition: 'Very Good', stock: 18, image: 'pc-thinkcentre',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '9700T', cores: 8, threads: 8 }, memory: { sizeGb: 32, type: 'DDR4', speedMhz: 2666 }, storage: [{ kind: 'ssd_sata', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },

  // --- All-in-One ---
  {
    category: 'all-in-one-pc', title: 'HP EliteOne 800 G6 24" AIO', subtitle: 'i7-10700 · 16GB · 512GB NVMe · 24" FHD',
    price: 549, condition: 'Like New', stock: 6, image: 'aio-elite',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '10700', cores: 8, threads: 16 }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 2933 }, storage: [{ kind: 'ssd_nvme', capacityGb: 512 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'all-in-one-pc', title: 'Apple iMac 27" 5K (2020)', subtitle: 'i7-10700K · 32GB · 1TB SSD · Radeon Pro 5500 XT',
    price: 999, compareAt: 1299, condition: 'Excellent', stock: 2, image: 'aio-imac',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '10700K', cores: 8, threads: 16 }, memory: { sizeGb: 32, type: 'DDR4', speedMhz: 2666 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], gpu: { brand: 'AMD', model: 'Radeon Pro 5500 XT', vramGb: 8 } },
  },

  // --- Laptops ---
  {
    category: 'laptops', title: 'Dell Latitude 7420 14"', subtitle: 'i7-1185G7 · 16GB · 512GB NVMe · FHD',
    price: 429, condition: 'Excellent', stock: 14, image: 'lt-latitude',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '1185G7', cores: 4, threads: 8 }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 3200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 512 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'laptops', title: 'Lenovo ThinkPad X1 Carbon Gen 9', subtitle: 'i7-1165G7 · 16GB · 1TB NVMe · WQHD',
    price: 599, compareAt: 699, condition: 'Like New', stock: 8, image: 'lt-x1',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '1165G7', cores: 4, threads: 8 }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 4266 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'laptops', title: 'HP EliteBook 840 G8 14"', subtitle: 'i5-1145G7 · 16GB · 512GB NVMe · FHD',
    price: 369, condition: 'Very Good', stock: 22, image: 'lt-elitebook',
    specs: { cpu: { brand: 'Intel', family: 'Core i5', model: '1145G7', cores: 4, threads: 8 }, memory: { sizeGb: 16, type: 'DDR4', speedMhz: 3200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 512 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'laptops', title: 'MacBook Pro 14" M1 Pro (2021)', subtitle: 'M1 Pro · 16GB · 512GB SSD · Liquid Retina XDR',
    price: 1199, compareAt: 1499, condition: 'Excellent', stock: 4, image: 'lt-mbp',
    specs: { cpu: { brand: 'Apple', family: 'M1', model: 'M1 Pro', cores: 10, threads: 10 }, memory: { sizeGb: 16, type: 'LPDDR5', speedMhz: 6400 }, storage: [{ kind: 'ssd_nvme', capacityGb: 512 }] },
  },
  {
    category: 'laptops', title: 'ASUS ROG Zephyrus G14 Gaming Laptop', subtitle: 'Ryzen 9 6900HS · RTX 3060 · 32GB · 1TB NVMe',
    price: 999, condition: 'Very Good', stock: 3, image: 'lt-zephyrus',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '6900HS', cores: 8, threads: 16 }, gpu: { brand: 'NVIDIA', model: 'RTX 3060 Laptop', vramGb: 6, rtx: true }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 4800 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Home' } },
  },
  {
    category: 'laptops', title: 'Dell XPS 13 9310', subtitle: 'i5-1135G7 · 8GB · 256GB NVMe · FHD+',
    price: 329, condition: 'Good', stock: 11, image: 'lt-xps',
    specs: { cpu: { brand: 'Intel', family: 'Core i5', model: '1135G7', cores: 4, threads: 8 }, memory: { sizeGb: 8, type: 'LPDDR4X', speedMhz: 4267 }, storage: [{ kind: 'ssd_nvme', capacityGb: 256 }], os: { name: 'Windows 11', edition: 'Home' } },
  },

  // --- Monitors ---
  {
    category: 'monitors', title: 'Dell UltraSharp U2723QE 27" 4K', subtitle: 'IPS Black · 95% DCI-P3 · USB-C 90W',
    price: 349, condition: 'Like New', stock: 10, image: 'mon-dell',
  specs: {},
  },
  {
    category: 'monitors', title: 'LG 27GP850-B 27" 1440p 165Hz Gaming', subtitle: 'Nano IPS · 1ms GtG · FreeSync Premium',
    price: 249, condition: 'Excellent', stock: 16, image: 'mon-lg',
  specs: {},
  },
  {
    category: 'monitors', title: 'Samsung Odyssey G7 32" 1440p 240Hz', subtitle: 'VA 1000R curve · G-Sync Compatible',
    price: 379, condition: 'Very Good', stock: 5, image: 'mon-samsung',
  specs: {},
  },
  {
    category: 'monitors', title: 'BenQ PD2725U 27" 4K Designer', subtitle: 'IPS · 99% sRGB · Thunderbolt 3',
    price: 429, condition: 'Excellent', stock: 3, image: 'mon-benq',
  specs: {},
  },

  // --- Projectors ---
  {
    category: 'projectors', title: 'Epson EH-TW7100 4K PRO-UHD Projector', subtitle: '3000 lumens · HDR10 · Long-throw',
    price: 899, condition: 'Excellent', stock: 2, image: 'pj-epson',
  specs: {},
  },
  {
    category: 'projectors', title: 'BenQ TK850i 4K HDR Sports Projector', subtitle: '3000 lumens · Android TV',
    price: 1099, condition: 'Like New', stock: 1, image: 'pj-benq',
  specs: {},
  },

  // --- Printers ---
  {
    category: 'printers', title: 'HP LaserJet Pro M404dn Mono Laser', subtitle: '38 ppm · Duplex · Network',
    price: 129, condition: 'Very Good', stock: 25, image: 'pr-hp',
  specs: {},
  },
  {
    category: 'printers', title: 'Brother MFC-L3770CDW Colour Laser MFP', subtitle: 'Print · Scan · Copy · Fax · Wi-Fi',
    price: 289, condition: 'Excellent', stock: 8, image: 'pr-brother',
  specs: {},
  },

  // --- AV Switches ---
  {
    category: 'av-switches', title: 'Blackmagic ATEM Mini Pro HDMI Switcher', subtitle: '4 HDMI inputs · USB-C webcam out',
    price: 299, condition: 'Excellent', stock: 4, image: 'av-atem',
  specs: {},
  },
  {
    category: 'av-switches', title: 'Roland V-1HD 4-Channel HD Video Switcher', subtitle: 'Live production · T-bar fader',
    price: 449, condition: 'Very Good', stock: 2, image: 'av-roland',
  specs: {},
  },

  // --- Hard Drives ---
  {
    category: 'hard-drive', title: 'Samsung 990 Pro 2TB NVMe SSD', subtitle: 'PCIe 4.0 · 7450 MB/s read',
    price: 159, condition: 'Like New', stock: 30, image: 'hd-990',
  specs: {},
  },
  {
    category: 'hard-drive', title: 'Seagate IronWolf 8TB NAS HDD', subtitle: '7200 rpm · NAS rated · CMR',
    price: 179, condition: 'Excellent', stock: 18, image: 'hd-ironwolf',
  specs: {},
  },
  {
    category: 'hard-drive', title: 'WD Black SN850X 1TB NVMe SSD', subtitle: 'PCIe 4.0 · Gaming · 7300 MB/s',
    price: 99, condition: 'Like New', stock: 40, image: 'hd-sn850',
  specs: {},
  },

  // --- Power supply ---
  {
    category: 'power-supply-chargers', title: 'Corsair RM850x 80+ Gold PSU', subtitle: 'Fully modular · 10-year warranty',
    price: 119, condition: 'Very Good', stock: 22, image: 'ps-corsair',
  specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'Apple 96W USB-C Power Adapter', subtitle: 'MacBook Pro 16" compatible',
    price: 49, condition: 'Good', stock: 60, image: 'ps-apple',
  specs: {},
  },

  // --- Network ---
  {
    category: 'network-equipment', title: 'Ubiquiti UniFi Dream Machine Pro', subtitle: 'All-in-one router + switch',
    price: 379, condition: 'Excellent', stock: 5, image: 'nw-udm',
  specs: {},
  },
  {
    category: 'network-equipment', title: 'Netgear Nighthawk RAX200 Wi-Fi 6 Tri-band', subtitle: 'AX11000 · 8 streams · 2.5G WAN',
    price: 229, condition: 'Very Good', stock: 9, image: 'nw-nighthawk',
  specs: {},
  },
  {
    category: 'network-equipment', title: 'Cisco Catalyst 9200L 24-port PoE+ Switch', subtitle: 'L3 · 10G uplinks',
    price: 549, condition: 'Good', stock: 3, image: 'nw-cisco',
  specs: {},
  },

  // --- Flagship Gaming PC Bundles ---
  {
    category: 'gaming-pc-bundles', title: 'Apex Prime RTX 5090 Gaming PC', subtitle: 'Ryzen 9 9950X3D · RTX 5090 32GB · 64GB DDR5-6400 · 2TB NVMe Gen5',
    price: 4499, compareAt: 4899, condition: 'New', stock: 3, image: 'apex-prime-rtx5090-hero',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '9950X3D', cores: 16, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 5090', vramGb: 32, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 6400 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Aegis Infinity RTX 4090 Workstation', subtitle: 'Threadripper 7970X · RTX 4090 · 128GB ECC · 4TB NVMe Gen5',
    price: 6999, compareAt: 7499, condition: 'New', stock: 2, image: 'aegis-infinity-tr7970x-hero',
    specs: { cpu: { brand: 'AMD', family: 'Threadripper', model: '7970X', cores: 32, threads: 64 }, gpu: { brand: 'NVIDIA', model: 'RTX 4090', vramGb: 24, rtx: true }, memory: { sizeGb: 128, type: 'DDR5 ECC', speedMhz: 5200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 4000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Titan Halo i9 14900KS', subtitle: 'i9-14900KS · RTX 4080 Super · 64GB DDR5-6000 · 2TB NVMe',
    price: 2799, compareAt: 3099, condition: 'New', stock: 5, image: 'titan-halo-14900ks-hero',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '14900KS', cores: 24, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 4080 Super', vramGb: 16, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 6000 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Helios RTX 5080 Creator Rig', subtitle: 'Ryzen 9 9900X · RTX 5080 16GB · 64GB DDR5-6000 · 2TB NVMe',
    price: 2499, compareAt: 2699, condition: 'New', stock: 6, image: 'helios-rtx5080-front',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '9900X', cores: 12, threads: 24 }, gpu: { brand: 'NVIDIA', model: 'RTX 5080', vramGb: 16, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 6000 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'gaming-pc-bundles', title: 'Phantom RTX 4070 Ti Super Gaming PC', subtitle: 'Ryzen 7 9700X · RTX 4070 Ti Super · 32GB DDR5-6000 · 1TB NVMe',
    price: 1699, compareAt: 1899, condition: 'New', stock: 9, image: 'phantom-4070tis-front',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 7', model: '9700X', cores: 8, threads: 16 }, gpu: { brand: 'NVIDIA', model: 'RTX 4070 Ti Super', vramGb: 16, rtx: true }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 6000 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Home' } },
  },

  // --- Workstations / enterprise Computers ---
  {
    category: 'computers', title: 'HP Z8 G5 Fury Workstation', subtitle: 'Xeon W7-3465X · RTX 6000 Ada 48GB · 256GB ECC · 8TB NVMe',
    price: 12999, compareAt: 15499, condition: 'Excellent', stock: 1, image: 'hp-z8-g5-fury-3q',
    specs: { cpu: { brand: 'Intel', family: 'Xeon W', model: 'W7-3465X', cores: 28, threads: 56 }, gpu: { brand: 'NVIDIA', model: 'RTX 6000 Ada', vramGb: 48, rtx: true }, memory: { sizeGb: 256, type: 'DDR5 ECC', speedMhz: 4800 }, storage: [{ kind: 'ssd_nvme', capacityGb: 8000 }], os: { name: 'Windows 11', edition: 'Pro for Workstations' } },
  },
  {
    category: 'computers', title: 'Dell Precision 7960 Tower', subtitle: 'Xeon W9-3495X · RTX A6000 48GB · 192GB ECC · 4TB NVMe',
    price: 9499, compareAt: 11999, condition: 'Very Good', stock: 2, image: 'dell-precision-7960-front',
    specs: { cpu: { brand: 'Intel', family: 'Xeon W', model: 'W9-3495X', cores: 56, threads: 112 }, gpu: { brand: 'NVIDIA', model: 'RTX A6000', vramGb: 48, rtx: true }, memory: { sizeGb: 192, type: 'DDR5 ECC', speedMhz: 4800 }, storage: [{ kind: 'ssd_nvme', capacityGb: 4000 }], os: { name: 'Windows 11', edition: 'Pro for Workstations' } },
  },
  {
    category: 'computers', title: 'Lenovo ThinkStation P8 Threadripper Pro', subtitle: 'Threadripper Pro 7995WX · RTX 6000 Ada 48GB · 512GB ECC · 8TB NVMe',
    price: 18999, compareAt: 21499, condition: 'New', stock: 1, image: 'lenovo-thinkstation-p8-hero',
    specs: { cpu: { brand: 'AMD', family: 'Threadripper Pro', model: '7995WX', cores: 96, threads: 192 }, gpu: { brand: 'NVIDIA', model: 'RTX 6000 Ada', vramGb: 48, rtx: true }, memory: { sizeGb: 512, type: 'DDR5 ECC', speedMhz: 5200 }, storage: [{ kind: 'ssd_nvme', capacityGb: 8000 }], os: { name: 'Windows 11', edition: 'Pro for Workstations' } },
  },
  {
    category: 'computers', title: 'Supermicro SuperServer 1U Rack (Epyc)', subtitle: 'EPYC 9654 96-core · 512GB DDR5 ECC · 4x 7.68TB NVMe U.2',
    price: 15999, condition: 'Excellent', stock: 2, image: 'supermicro-1u-epyc-rack',
    specs: { cpu: { brand: 'AMD', family: 'EPYC', model: '9654', cores: 96, threads: 192 }, memory: { sizeGb: 512, type: 'DDR5 ECC', speedMhz: 4800 }, storage: [{ kind: 'ssd_nvme', capacityGb: 7680 }, { kind: 'ssd_nvme', capacityGb: 7680 }, { kind: 'ssd_nvme', capacityGb: 7680 }, { kind: 'ssd_nvme', capacityGb: 7680 }], os: { name: 'Ubuntu', edition: 'Server 24.04 LTS' } },
  },
  {
    category: 'computers', title: 'Mac Studio M2 Ultra', subtitle: 'M2 Ultra 24-core · 128GB Unified · 4TB SSD',
    price: 4799, compareAt: 5599, condition: 'Like New', stock: 3, image: 'mac-studio-m2-ultra-front',
    specs: { cpu: { brand: 'Apple', family: 'M2', model: 'M2 Ultra', cores: 24, threads: 24 }, gpu: { brand: 'Apple', model: 'M2 Ultra 60-core', vramGb: 128 }, memory: { sizeGb: 128, type: 'Unified LPDDR5', speedMhz: 6400 }, storage: [{ kind: 'ssd_nvme', capacityGb: 4000 }], os: { name: 'macOS', edition: 'Sonoma' } },
  },
  {
    category: 'computers', title: 'Intel NUC 13 Extreme Raptor Canyon', subtitle: 'i9-13900K · RTX 4070 Ti · 64GB DDR5 · 2TB NVMe',
    price: 2199, condition: 'Like New', stock: 4, image: 'nuc-13-extreme-raptor',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '13900K', cores: 24, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 4070 Ti', vramGb: 12, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },

  // --- All-in-One PC ---
  {
    category: 'all-in-one-pc', title: 'Apple iMac 24" M3 (2024)', subtitle: 'M3 8-core · 32GB Unified · 1TB SSD · 4.5K Retina',
    price: 2499, compareAt: 2699, condition: 'New', stock: 5, image: 'imac-24-m3-2024-front',
    specs: { cpu: { brand: 'Apple', family: 'M3', model: 'M3', cores: 8, threads: 8 }, gpu: { brand: 'Apple', model: 'M3 10-core', vramGb: 32 }, memory: { sizeGb: 32, type: 'Unified LPDDR5', speedMhz: 6400 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'macOS', edition: 'Sonoma' } },
  },
  {
    category: 'all-in-one-pc', title: 'HP EliteOne 870 G9 34" Curved AIO', subtitle: 'i7-13700 · 32GB · 1TB NVMe · 34" UWQHD Curved',
    price: 2899, compareAt: 3199, condition: 'New', stock: 2, image: 'hp-eliteone-870-g9-front',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '13700', cores: 16, threads: 24 }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 4800 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'all-in-one-pc', title: 'Lenovo ThinkCentre M90a Pro Gen 4', subtitle: 'i7-13700 · 32GB · 1TB NVMe · 27" QHD',
    price: 2299, condition: 'Excellent', stock: 4, image: 'thinkcentre-m90a-gen4-front',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '13700', cores: 16, threads: 24 }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 4800 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'all-in-one-pc', title: 'Dell OptiPlex All-in-One 7420 Plus', subtitle: 'i7-14700 · 16GB · 512GB NVMe · 23.8" FHD',
    price: 1799, condition: 'New', stock: 8, image: 'dell-optiplex-7420-plus-aio',
    specs: { cpu: { brand: 'Intel', family: 'Core i7', model: '14700', cores: 20, threads: 28 }, memory: { sizeGb: 16, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 512 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },

  // --- Premium Laptops ---
  {
    category: 'laptops', title: 'Razer Blade 18 (2026) RTX 5090', subtitle: 'i9-14900HX · RTX 5090 Laptop 24GB · 64GB DDR5 · 2TB NVMe · 18" QHD+ 300Hz',
    price: 4499, compareAt: 4899, condition: 'New', stock: 3, image: 'razer-blade-18-2026-rtx5090',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '14900HX', cores: 24, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 5090 Laptop', vramGb: 24, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'laptops', title: 'Apple MacBook Pro 16" M3 Max', subtitle: 'M3 Max 16-core · 64GB Unified · 4TB SSD · Liquid Retina XDR',
    price: 3999, compareAt: 4499, condition: 'Excellent', stock: 4, image: 'mbp-16-m3-max-top',
    specs: { cpu: { brand: 'Apple', family: 'M3', model: 'M3 Max', cores: 16, threads: 16 }, gpu: { brand: 'Apple', model: 'M3 Max 40-core', vramGb: 64 }, memory: { sizeGb: 64, type: 'Unified LPDDR5', speedMhz: 6400 }, storage: [{ kind: 'ssd_nvme', capacityGb: 4000 }], os: { name: 'macOS', edition: 'Sonoma' } },
  },
  {
    category: 'laptops', title: 'ASUS ROG Strix Scar 18', subtitle: 'i9-14900HX · RTX 4090 Laptop 16GB · 32GB DDR5 · 2TB NVMe · 18" QHD+ 240Hz',
    price: 3299, compareAt: 3599, condition: 'New', stock: 4, image: 'rog-strix-scar-18-open',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '14900HX', cores: 24, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 4090 Laptop', vramGb: 16, rtx: true }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Home' } },
  },
  {
    category: 'laptops', title: 'Lenovo ThinkPad P16 Gen 3 Workstation', subtitle: 'i9-14900HX · RTX 5000 Ada Laptop · 64GB DDR5 ECC · 2TB NVMe',
    price: 3799, compareAt: 4199, condition: 'New', stock: 2, image: 'thinkpad-p16-gen3-open',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '14900HX', cores: 24, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 5000 Ada Laptop', vramGb: 16, rtx: true }, memory: { sizeGb: 64, type: 'DDR5 ECC', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro for Workstations' } },
  },
  {
    category: 'laptops', title: 'HP ZBook Fury 16 G11', subtitle: 'i9-14900HX · RTX 3500 Ada · 64GB DDR5 · 2TB NVMe · 16" 4K OLED',
    price: 3499, compareAt: 3999, condition: 'Very Good', stock: 3, image: 'hp-zbook-fury-16-g11',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '14900HX', cores: 24, threads: 32 }, gpu: { brand: 'NVIDIA', model: 'RTX 3500 Ada', vramGb: 12, rtx: true }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro for Workstations' } },
  },
  {
    category: 'laptops', title: 'Dell XPS 16 9640 OLED', subtitle: 'Core Ultra 9 185H · RTX 4070 Laptop · 64GB LPDDR5 · 2TB NVMe · 16" 4K OLED Touch',
    price: 2799, compareAt: 3099, condition: 'New', stock: 5, image: 'dell-xps-16-9640-oled',
    specs: { cpu: { brand: 'Intel', family: 'Core Ultra 9', model: '185H', cores: 16, threads: 22 }, gpu: { brand: 'NVIDIA', model: 'RTX 4070 Laptop', vramGb: 8, rtx: true }, memory: { sizeGb: 64, type: 'LPDDR5x', speedMhz: 7467 }, storage: [{ kind: 'ssd_nvme', capacityGb: 2000 }], os: { name: 'Windows 11', edition: 'Pro' } },
  },
  {
    category: 'laptops', title: 'Framework Laptop 16 (2025)', subtitle: 'Ryzen 9 7940HS · RX 7700S · 32GB DDR5 · 1TB NVMe · Modular',
    price: 1999, condition: 'New', stock: 6, image: 'framework-laptop-16-2025',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '7940HS', cores: 8, threads: 16 }, gpu: { brand: 'AMD', model: 'RX 7700S', vramGb: 8 }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 5600 }, storage: [{ kind: 'ssd_nvme', capacityGb: 1000 }], os: { name: 'Linux', edition: 'Ubuntu 24.04' } },
  },

  // --- Monitors ---
  {
    category: 'monitors', title: 'Samsung Odyssey Neo G9 57"', subtitle: '7680x2160 Dual 4K · 240Hz · Mini-LED · Quantum HDR 1000',
    price: 2199, compareAt: 2499, condition: 'New', stock: 3, image: 'odyssey-neo-g9-57-front',
    specs: {},
  },
  {
    category: 'monitors', title: 'LG 32GS95UE-B 32" 4K OLED 240Hz', subtitle: 'WOLED · Dual Mode 1080p 480Hz · 0.03ms · G-Sync + FreeSync Premium Pro',
    price: 1199, compareAt: 1399, condition: 'New', stock: 6, image: 'lg-32gs95ue-front',
    specs: {},
  },
  {
    category: 'monitors', title: 'Dell UP3221Q 32" 4K Reference Colour', subtitle: 'IPS Black · CalMAN Ready · 100% Adobe RGB · 99.8% DCI-P3',
    price: 2899, compareAt: 3199, condition: 'Excellent', stock: 2, image: 'dell-up3221q-front',
    specs: {},
  },
  {
    category: 'monitors', title: 'Apple Studio Display 5K', subtitle: '27" 5K Retina · P3 wide colour · 600 nits · Centre Stage camera',
    price: 1499, compareAt: 1749, condition: 'Like New', stock: 4, image: 'apple-studio-display-5k',
    specs: {},
  },
  {
    category: 'monitors', title: 'ASUS ProArt PA32UCR-K 32" 4K HDR1000', subtitle: 'IPS · HDR1000 · 98% DCI-P3 · Hardware calibration',
    price: 2299, compareAt: 2599, condition: 'New', stock: 3, image: 'asus-proart-pa32ucr-k',
    specs: {},
  },
  {
    category: 'monitors', title: 'Eizo ColorEdge CG319X 31.1" 4K', subtitle: 'DCI-4K · 98% DCI-P3 · Built-in calibration sensor',
    price: 5499, compareAt: 5999, condition: 'Excellent', stock: 1, image: 'eizo-cg319x-front',
    specs: {},
  },

  // --- Projectors ---
  {
    category: 'projectors', title: 'Sony VPL-XW7000ES 4K Laser Home Cinema', subtitle: 'Native 4K SXRD · 3200 lumens · Dynamic HDR · 2.1x zoom',
    price: 17999, compareAt: 19499, condition: 'New', stock: 1, image: 'sony-vpl-xw7000es-front',
    specs: {},
  },
  {
    category: 'projectors', title: 'Epson EH-LS12000B 4K Laser', subtitle: 'Native 4K · 2700 lumens · HDR10+ · 120Hz gaming',
    price: 4999, compareAt: 5499, condition: 'New', stock: 2, image: 'epson-eh-ls12000b-3q',
    specs: {},
  },
  {
    category: 'projectors', title: 'Samsung The Premiere LSP9T 4K UST', subtitle: 'Triple Laser UST · 2800 lumens · 130" projection · 40W 2.2ch',
    price: 5499, compareAt: 5999, condition: 'Excellent', stock: 2, image: 'samsung-lsp9t-ust',
    specs: {},
  },
  {
    category: 'projectors', title: 'BenQ HT4550i 4K DLP', subtitle: '4K DLP · 3200 lumens · 100% DCI-P3 · Android TV',
    price: 1999, compareAt: 2299, condition: 'New', stock: 5, image: 'benq-ht4550i-front',
    specs: {},
  },
  {
    category: 'projectors', title: 'Optoma UHZ65UST 4K Laser UST', subtitle: '4K UHD UST · 3500 lumens · Laser · 25,000 hours',
    price: 3299, compareAt: 3699, condition: 'New', stock: 3, image: 'optoma-uhz65ust-top',
    specs: {},
  },
  {
    category: 'projectors', title: 'JVC DLA-NZ7 D-ILA 4K Laser', subtitle: 'Native 4K D-ILA · 2200 lumens · BLU-Escent laser · HDR10+',
    price: 8999, compareAt: 9999, condition: 'Excellent', stock: 1, image: 'jvc-dla-nz7-front',
    specs: {},
  },

  // --- Projector Lenses ---
  {
    category: 'projector-lenses', title: 'Panasonic ET-D75LE30 Long-Throw Zoom Lens', subtitle: '2.4-4.7:1 throw · Motorised focus & zoom · For PT-RQ/PT-DZ series',
    price: 5999, condition: 'New', stock: 2, image: 'panasonic-et-d75le30',
    specs: {},
  },
  {
    category: 'projector-lenses', title: 'Christie 0.9-1.1 CTM Zoom Lens', subtitle: '0.9-1.1:1 short-throw · Motorised shift · Crimson/Boxer series',
    price: 8499, condition: 'New', stock: 1, image: 'christie-ctm-09-11-zoom',
    specs: {},
  },
  {
    category: 'projector-lenses', title: 'Sony VPLL-Z7013 Mid-Throw Zoom', subtitle: '1.3-2.34:1 · Powered zoom/focus · VPL-FHZ/FH series',
    price: 3999, condition: 'New', stock: 2, image: 'sony-vpll-z7013',
    specs: {},
  },
  {
    category: 'projector-lenses', title: 'Barco TLD+ 5.0-8.0 Long-Throw', subtitle: '5.0-8.0:1 · Rental-grade bayonet · HDX/HDF series',
    price: 6999, condition: 'Excellent', stock: 1, image: 'barco-tld-plus-5080',
    specs: {},
  },
  {
    category: 'projector-lenses', title: 'Epson ELPLM15 Middle-Throw Zoom Lens', subtitle: '2.19-4.63:1 · Powered · EB-PU2010/PU2020 series',
    price: 2299, condition: 'New', stock: 3, image: 'epson-elplm15-zoom',
    specs: {},
  },

  // --- Printers ---
  {
    category: 'printers', title: 'HP LaserJet Enterprise M612dn', subtitle: 'Mono laser · 71 ppm · 1200 dpi · Duplex · Gigabit',
    price: 999, compareAt: 1199, condition: 'New', stock: 4, image: 'hp-m612dn-front',
    specs: {},
  },
  {
    category: 'printers', title: 'Canon imageRUNNER ADVANCE DX C3835i', subtitle: 'A3 colour MFP · 35 ppm · Print/Scan/Copy/Fax · 1200x1200 dpi',
    price: 3499, compareAt: 4199, condition: 'Very Good', stock: 2, image: 'canon-ir-adv-dx-c3835i',
    specs: {},
  },
  {
    category: 'printers', title: 'Xerox VersaLink C7130 A3 Colour MFP', subtitle: '30 ppm colour/mono · Tabloid A3 · Apps platform · 10.1" touch',
    price: 2799, compareAt: 3099, condition: 'New', stock: 2, image: 'xerox-versalink-c7130',
    specs: {},
  },
  {
    category: 'printers', title: 'Epson WorkForce Enterprise AM-C6000', subtitle: 'A3 colour inkjet · 60 ppm · PrecisionCore · Low power',
    price: 5499, compareAt: 5999, condition: 'New', stock: 1, image: 'epson-workforce-am-c6000',
    specs: {},
  },
  {
    category: 'printers', title: 'Brother HL-L9430CDN Colour Laser', subtitle: '40 ppm colour · A4 duplex · Gigabit · Enterprise security',
    price: 669, condition: 'Excellent', stock: 6, image: 'brother-hl-l9430cdn',
    specs: {},
  },

  // --- AV Switches ---
  {
    category: 'av-switches', title: 'Blackmagic ATEM 4 M/E Constellation 4K', subtitle: '4 M/E live production · 40 12G-SDI · 4 AUX · Streaming engine',
    price: 2795, compareAt: 3195, condition: 'New', stock: 2, image: 'atem-constellation-4k-4me',
    specs: {},
  },
  {
    category: 'av-switches', title: 'Roland V-600UHD 4K HDR Video Switcher', subtitle: '4 HDMI/12G-SDI inputs · Multiformat · HDR · Broadcast grade',
    price: 5999, compareAt: 6499, condition: 'Excellent', stock: 1, image: 'roland-v-600uhd-front',
    specs: {},
  },
  {
    category: 'av-switches', title: 'Extron DXP 84 HD 4K Plus Matrix Switcher', subtitle: '8x4 4K/60 HDMI · HDCP 2.3 · EDID Minder · IP control',
    price: 3499, compareAt: 3899, condition: 'New', stock: 2, image: 'extron-dxp-84-hd-4k-plus',
    specs: {},
  },
  {
    category: 'av-switches', title: 'Kramer VP-553xl Presentation Switcher', subtitle: 'Presentation scaler-switcher · 4K/60 4:4:4 · 18 inputs · Dante optional',
    price: 2299, compareAt: 2599, condition: 'New', stock: 2, image: 'kramer-vp-553xl',
    specs: {},
  },
  {
    category: 'av-switches', title: 'Atlona AT-OME-MS52W Multiformat Switcher', subtitle: '5x2 HDBaseT · 4K/60 · USB-C · Wi-Fi presentation · PoE',
    price: 1999, compareAt: 2299, condition: 'New', stock: 3, image: 'atlona-ome-ms52w',
    specs: {},
  },

  // --- Parts: GPUs ---
  {
    category: 'parts', title: 'NVIDIA H200 141GB HBM3e Tensor Core GPU', subtitle: 'SXM5 · 141GB HBM3e · 4.8 TB/s memory · AI training flagship',
    price: 31999, condition: 'New', stock: 1, image: 'nvidia-h200-sxm5-top',
    specs: { gpu: { brand: 'NVIDIA', model: 'H200 141GB HBM3e', vramGb: 141, rtx: false } },
  },
  {
    category: 'parts', title: 'NVIDIA H100 80GB SXM5 Tensor Core GPU', subtitle: 'SXM5 · 80GB HBM3 · Hopper · Decommissioned datacentre unit',
    price: 24999, compareAt: 29999, condition: 'Very Good', stock: 2, image: 'nvidia-h100-sxm-top',
    specs: { gpu: { brand: 'NVIDIA', model: 'H100 80GB SXM5', vramGb: 80, rtx: false } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 5090 Founders Edition 32GB', subtitle: 'Blackwell · 32GB GDDR7 · 575W · PCIe 5.0 · 12VHPWR',
    price: 1999, compareAt: 2199, condition: 'New', stock: 8, image: 'rtx5090-fe-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5090 Founders Edition', vramGb: 32, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 4090 Founders Edition 24GB', subtitle: 'Ada Lovelace · 24GB GDDR6X · 450W · PCIe 4.0',
    price: 1499, compareAt: 1699, condition: 'Like New', stock: 6, image: 'rtx4090-fe-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4090 Founders Edition', vramGb: 24, rtx: true } },
  },

  // --- RTX consumer Blackwell (50 series) ---
  {
    category: 'parts', title: 'NVIDIA RTX 5080 Founders Edition 16GB', subtitle: 'Blackwell · 16GB GDDR7 · 360W · PCIe 5.0 · 12V-2x6',
    price: 979, compareAt: 1099, condition: 'New', stock: 12, image: 'rtx5080-fe-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5080 Founders Edition', vramGb: 16, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 5070 Ti Founders Edition 16GB', subtitle: 'Blackwell · 16GB GDDR7 · 300W · PCIe 5.0',
    price: 729, compareAt: 799, condition: 'New', stock: 14, image: 'rtx5070ti-fe-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5070 Ti Founders Edition', vramGb: 16, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 5070 Founders Edition 12GB', subtitle: 'Blackwell · 12GB GDDR7 · 250W · PCIe 5.0',
    price: 539, compareAt: 599, condition: 'New', stock: 22, image: 'rtx5070-fe-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5070 Founders Edition', vramGb: 12, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 5060 Ti 16GB', subtitle: 'Blackwell · 16GB GDDR7 · 180W · PCIe 5.0',
    price: 429, compareAt: 469, condition: 'New', stock: 28, image: 'rtx5060ti-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5060 Ti', vramGb: 16, rtx: true } },
  },

  // --- RTX consumer Ada Super refresh (40 Super series) ---
  {
    category: 'parts', title: 'NVIDIA RTX 4080 SUPER Founders Edition 16GB', subtitle: 'Ada Lovelace · 16GB GDDR6X · 320W · PCIe 4.0',
    price: 979, compareAt: 1099, condition: 'New', stock: 9, image: 'rtx4080s-fe-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4080 SUPER Founders Edition', vramGb: 16, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 4070 Ti SUPER 16GB', subtitle: 'Ada Lovelace · 16GB GDDR6X · 285W · PCIe 4.0',
    price: 779, compareAt: 849, condition: 'New', stock: 15, image: 'rtx4070tis-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4070 Ti SUPER', vramGb: 16, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 4070 SUPER 12GB', subtitle: 'Ada Lovelace · 12GB GDDR6X · 220W · PCIe 4.0',
    price: 579, compareAt: 629, condition: 'New', stock: 20, image: 'rtx4070s-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4070 SUPER', vramGb: 12, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 4060 Ti 16GB', subtitle: 'Ada Lovelace · 16GB GDDR6 · 165W · PCIe 4.0',
    price: 399, compareAt: 449, condition: 'New', stock: 24, image: 'rtx4060ti-16gb-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4060 Ti', vramGb: 16, rtx: true } },
  },

  // --- AIB flagship variants (premium board partner editions) ---
  {
    category: 'parts', title: 'ASUS ROG Astral GeForce RTX 5090 OC Edition 32GB', subtitle: 'Quad-fan flagship · Overclocked · Liquid-metal TIM · 4-year warranty',
    price: 2399, compareAt: 2599, condition: 'New', stock: 3, image: 'rog-astral-5090-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5090 ROG Astral OC', vramGb: 32, rtx: true } },
  },
  {
    category: 'parts', title: 'MSI GeForce RTX 5090 SUPRIM LIQUID SOC 32GB', subtitle: '240mm AIO · SOC binned die · Whisper-quiet under load',
    price: 2499, compareAt: 2699, condition: 'New', stock: 2, image: 'msi-5090-suprim-liquid-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5090 SUPRIM LIQUID SOC', vramGb: 32, rtx: true } },
  },
  {
    category: 'parts', title: 'Gigabyte AORUS GeForce RTX 5090 XTREME WATERFORCE 32GB', subtitle: '360mm radiator · LCD display · Pre-filled loop',
    price: 2599, compareAt: 2799, condition: 'New', stock: 2, image: 'aorus-5090-waterforce-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5090 AORUS XTREME WATERFORCE', vramGb: 32, rtx: true } },
  },

  // --- RTX PRO workstation (Blackwell + Ada generation) ---
  {
    category: 'parts', title: 'NVIDIA RTX PRO 6000 Blackwell Workstation 96GB', subtitle: 'Blackwell · 96GB GDDR7 ECC · 600W · dual-slot · flagship pro',
    price: 8999, compareAt: 9499, condition: 'New', stock: 2, image: 'rtx-pro-6000-blackwell-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX PRO 6000 Blackwell', vramGb: 96, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 6000 Ada Generation 48GB', subtitle: 'Ada Lovelace · 48GB GDDR6 ECC · 300W · dual-slot workstation',
    price: 6999, compareAt: 7499, condition: 'New', stock: 3, image: 'rtx-6000-ada-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 6000 Ada', vramGb: 48, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 5000 Ada Generation 32GB', subtitle: 'Ada Lovelace · 32GB GDDR6 ECC · 250W · dual-slot workstation',
    price: 4299, compareAt: 4599, condition: 'New', stock: 4, image: 'rtx-5000-ada-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 5000 Ada', vramGb: 32, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 4500 Ada Generation 24GB', subtitle: 'Ada Lovelace · 24GB GDDR6 ECC · 210W · dual-slot',
    price: 2799, compareAt: 2999, condition: 'New', stock: 5, image: 'rtx-4500-ada-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4500 Ada', vramGb: 24, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX 4000 Ada SFF 20GB', subtitle: 'Ada Lovelace · 20GB GDDR6 ECC · 70W · single-slot · half-length',
    price: 1199, compareAt: 1299, condition: 'New', stock: 6, image: 'rtx-4000-ada-sff-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX 4000 Ada SFF', vramGb: 20, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX A6000 48GB (Ampere)', subtitle: 'Ampere · 48GB GDDR6 ECC · 300W · workstation · ex-studio',
    price: 3999, compareAt: 4399, condition: 'Excellent', stock: 3, image: 'rtx-a6000-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX A6000', vramGb: 48, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX A5000 24GB (Ampere)', subtitle: 'Ampere · 24GB GDDR6 ECC · 230W · workstation · refurbished',
    price: 1799, compareAt: 1999, condition: 'Very Good', stock: 4, image: 'rtx-a5000-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX A5000', vramGb: 24, rtx: true } },
  },
  {
    category: 'parts', title: 'NVIDIA RTX A4000 16GB (Ampere)', subtitle: 'Ampere · 16GB GDDR6 ECC · 140W · single-slot · refurbished',
    price: 899, compareAt: 999, condition: 'Excellent', stock: 6, image: 'rtx-a4000-hero',
    specs: { gpu: { brand: 'NVIDIA', model: 'RTX A4000', vramGb: 16, rtx: true } },
  },

  {
    category: 'parts', title: 'AMD Radeon PRO W7900 48GB', subtitle: 'RDNA 3 · 48GB GDDR6 · 295W · 3-slot workstation · DisplayPort 2.1',
    price: 3499, compareAt: 3799, condition: 'New', stock: 3, image: 'amd-radeon-pro-w7900',
    specs: { gpu: { brand: 'AMD', model: 'Radeon PRO W7900', vramGb: 48 } },
  },

  // --- Parts: CPUs ---
  {
    category: 'parts', title: 'AMD Threadripper PRO 7995WX (96-core)', subtitle: 'Zen 4 · 96C/192T · sTR5 · 350W TDP · 384MB cache',
    price: 9499, compareAt: 10499, condition: 'New', stock: 2, image: 'tr-pro-7995wx-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Threadripper Pro', model: '7995WX', cores: 96, threads: 192 } },
  },
  {
    category: 'parts', title: 'AMD Threadripper PRO 7985WX (64-core)', subtitle: 'Zen 4 · 64C/128T · sTR5 · 350W TDP · 256MB cache',
    price: 6299, compareAt: 6899, condition: 'New', stock: 2, image: 'tr-pro-7985wx-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Threadripper Pro', model: '7985WX', cores: 64, threads: 128 } },
  },
  {
    category: 'parts', title: 'Intel Xeon w9-3495X (56-core)', subtitle: 'Sapphire Rapids · 56C/112T · LGA 4677 · 350W TDP · 8-channel DDR5 ECC',
    price: 4999, compareAt: 5499, condition: 'New', stock: 3, image: 'intel-xeon-w9-3495x-boxed',
    specs: { cpu: { brand: 'Intel', family: 'Xeon W', model: 'W9-3495X', cores: 56, threads: 112 } },
  },
  {
    category: 'parts', title: 'Intel Core i9-14900KS Special Edition', subtitle: 'Raptor Lake Refresh · 24C/32T · 6.2GHz boost · LGA 1700',
    price: 699, compareAt: 799, condition: 'New', stock: 10, image: 'i9-14900ks-boxed',
    specs: { cpu: { brand: 'Intel', family: 'Core i9', model: '14900KS', cores: 24, threads: 32 } },
  },
  {
    category: 'parts', title: 'AMD Ryzen 9 9950X3D (16-core)', subtitle: 'Zen 5 · 16C/32T · 3D V-Cache · AM5 · 170W TDP',
    price: 749, compareAt: 799, condition: 'New', stock: 8, image: 'ryzen-9-9950x3d-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '9950X3D', cores: 16, threads: 32 } },
  },

  // --- Parts: RAM ---
  {
    category: 'parts', title: 'Kingston FURY Renegade Pro 256GB DDR5-6400 ECC', subtitle: '8x32GB RDIMM · CL32 · Threadripper Pro / Xeon W certified',
    price: 1299, compareAt: 1499, condition: 'New', stock: 4, image: 'kingston-fury-renegade-pro-256',
    specs: { memory: { sizeGb: 256, type: 'DDR5 ECC', speedMhz: 6400 } },
  },
  {
    category: 'parts', title: 'Crucial Pro DDR5 128GB Kit (4x32GB)', subtitle: 'DDR5-5600 · CL46 · Limited lifetime warranty',
    price: 449, compareAt: 499, condition: 'New', stock: 10, image: 'crucial-pro-ddr5-128gb',
    specs: { memory: { sizeGb: 128, type: 'DDR5', speedMhz: 5600 } },
  },

  // --- Hard Drives ---
  {
    category: 'hard-drive', title: 'Samsung 9100 Pro 4TB NVMe PCIe 5.0', subtitle: '14,800 MB/s read · 13,400 MB/s write · M.2 2280',
    price: 599, compareAt: 699, condition: 'New', stock: 12, image: 'samsung-9100-pro-4tb',
    specs: { storage: [{ kind: 'ssd_nvme', capacityGb: 4000 }] },
  },
  {
    category: 'hard-drive', title: 'WD Black SN850X 4TB NVMe SSD', subtitle: 'PCIe 4.0 · 7300 MB/s read · Gaming heatsink · 2400 TBW',
    price: 399, compareAt: 459, condition: 'New', stock: 18, image: 'wd-black-sn850x-4tb',
    specs: { storage: [{ kind: 'ssd_nvme', capacityGb: 4000 }] },
  },
  {
    category: 'hard-drive', title: 'Seagate Exos X24 24TB SATA CMR', subtitle: 'Enterprise HDD · 7200 rpm · 512MB cache · 2.5M MTBF',
    price: 499, compareAt: 569, condition: 'New', stock: 15, image: 'seagate-exos-x24-24tb',
    specs: { storage: [{ kind: 'hdd', capacityGb: 24000 }] },
  },
  {
    category: 'hard-drive', title: 'Samsung PM1743 15.36TB U.2 PCIe 5.0 Enterprise', subtitle: '13,000 MB/s read · 1 DWPD · Enterprise NVMe · U.2',
    price: 2799, compareAt: 3199, condition: 'New', stock: 3, image: 'samsung-pm1743-u2-15tb',
    specs: { storage: [{ kind: 'ssd_nvme', capacityGb: 15360 }] },
  },
  {
    category: 'hard-drive', title: 'Solidigm D5-P5336 30.72TB QLC U.2', subtitle: 'Enterprise QLC NVMe · 7000 MB/s read · 30.72TB · Read intensive',
    price: 4999, compareAt: 5599, condition: 'New', stock: 2, image: 'solidigm-d5-p5336-30tb',
    specs: { storage: [{ kind: 'ssd_nvme', capacityGb: 30720 }] },
  },

  // --- Power Supply / Chargers ---
  {
    category: 'power-supply-chargers', title: 'Corsair AX1600i Digital ATX 3.1 PSU', subtitle: '1600W · 80+ Titanium · Fully modular · Corsair Link',
    price: 599, compareAt: 649, condition: 'New', stock: 6, image: 'corsair-ax1600i-top',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'Seasonic PRIME TX-1600 Titanium', subtitle: '1600W · 80+ Titanium · Fully modular · Hybrid fan control',
    price: 549, compareAt: 599, condition: 'New', stock: 5, image: 'seasonic-prime-tx1600',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'be quiet! Dark Power Pro 13 1500W', subtitle: '1500W · 80+ Titanium · OverClocking Key · Silent Wings 3',
    price: 499, compareAt: 549, condition: 'New', stock: 6, image: 'bequiet-dpp13-1500w',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'Apple 140W USB-C MagSafe 3 Adapter', subtitle: 'MacBook Pro 16" M-series · USB-C PD · GaN',
    price: 99, compareAt: 109, condition: 'New', stock: 40, image: 'apple-140w-usbc-magsafe3',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'HP 330W ZBook Workstation Charger', subtitle: 'Slim tip · Mobile workstation · EU cable',
    price: 149, compareAt: 169, condition: 'New', stock: 20, image: 'hp-330w-zbook-charger',
    specs: {},
  },

  // --- Network Equipment ---
  {
    category: 'network-equipment', title: 'Cisco Nexus 9364C-H1 64-port 100G', subtitle: 'Datacentre top-of-rack · 64x QSFP28 100G · NX-OS · Decommissioned',
    price: 24999, compareAt: 29999, condition: 'Excellent', stock: 1, image: 'cisco-nexus-9364c-h1',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Ubiquiti UniFi Enterprise Fortress Gateway', subtitle: '10G WAN/LAN · 25 Gbps IPS · Multi-WAN · PoE++',
    price: 1999, compareAt: 2199, condition: 'New', stock: 3, image: 'unifi-enterprise-fortress-gw',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'MikroTik CCR2216-1G-12XS-2XQ', subtitle: 'Cloud Core Router · 12x 25G SFP28 · 2x 100G QSFP28 · RouterOS',
    price: 2999, compareAt: 3299, condition: 'New', stock: 2, image: 'mikrotik-ccr2216',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Ubiquiti UniFi Switch Pro Aggregation 28', subtitle: '28-port 10G SFP+ aggregation · L3 · UniFi managed',
    price: 1899, compareAt: 2099, condition: 'New', stock: 3, image: 'unifi-pro-aggregation-28',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Netgear M4350-36X4V', subtitle: '36x 10G Ethernet · 4x 25G SFP28 uplinks · L3 stackable',
    price: 3499, compareAt: 3899, condition: 'New', stock: 2, image: 'netgear-m4350-36x4v',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Cisco Meraki MS250-24X', subtitle: '24-port 10GBase-T · 4x SFP+ uplinks · Cloud-managed',
    price: 4499, compareAt: 5199, condition: 'Very Good', stock: 2, image: 'meraki-ms250-24x',
    specs: {},
  },

  // --- Other (accessories that defy category) ---
  {
    category: 'other', title: 'Logitech MX Master 4', subtitle: 'Ergonomic wireless mouse · 8K DPI · MagSpeed wheel · Flow',
    price: 129, condition: 'New', stock: 35, image: 'logitech-mx-master-4',
    specs: {},
  },
  {
    category: 'other', title: 'Elgato Stream Deck XL (32-key)', subtitle: '32 LCD keys · Customisable streaming control',
    price: 229, compareAt: 249, condition: 'New', stock: 18, image: 'elgato-streamdeck-xl',
    specs: {},
  },
  {
    category: 'other', title: 'Elgato 4K Pro Capture Card', subtitle: '4K60 HDR10 · PCIe internal · Zero-lag passthrough',
    price: 399, compareAt: 449, condition: 'New', stock: 10, image: 'elgato-4k-pro-capture',
    specs: {},
  },
  {
    category: 'other', title: 'Shure SM7dB Broadcast Microphone', subtitle: 'Dynamic XLR · Built-in active preamp · +28dB gain',
    price: 499, compareAt: 549, condition: 'New', stock: 8, image: 'shure-sm7db-front',
    specs: {},
  },
  {
    category: 'other', title: 'Keychron Q6 Max QMK Wireless Keyboard', subtitle: 'Full-size aluminium · Hot-swap · QMK/VIA · Bluetooth 5.1',
    price: 239, compareAt: 259, condition: 'New', stock: 14, image: 'keychron-q6-max',
    specs: {},
  },

  // ========================================================================
  // Flagship consumer CPUs (AM5 Zen 5 + Intel Arrow Lake)
  // ========================================================================
  {
    category: 'parts', title: 'AMD Ryzen 9 9950X3D', subtitle: 'Zen 5 · 16C/32T · 128MB L3 (3D V-Cache) · AM5 · 170W',
    price: 729, compareAt: 789, condition: 'New', stock: 12, image: 'ryzen-9950x3d-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '9950X3D', cores: 16, threads: 32 } },
  },
  {
    category: 'parts', title: 'AMD Ryzen 9 9950X', subtitle: 'Zen 5 · 16C/32T · 80MB cache · AM5 · 170W',
    price: 599, compareAt: 649, condition: 'New', stock: 16, image: 'ryzen-9950x-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '9950X', cores: 16, threads: 32 } },
  },
  {
    category: 'parts', title: 'AMD Ryzen 9 9900X3D', subtitle: 'Zen 5 · 12C/24T · 128MB L3 (3D V-Cache) · AM5 · 120W',
    price: 569, compareAt: 619, condition: 'New', stock: 14, image: 'ryzen-9900x3d-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '9900X3D', cores: 12, threads: 24 } },
  },
  {
    category: 'parts', title: 'AMD Ryzen 7 9800X3D', subtitle: 'Zen 5 · 8C/16T · 96MB L3 (2nd-gen 3D V-Cache) · AM5 · 120W',
    price: 479, compareAt: 529, condition: 'New', stock: 22, image: 'ryzen-9800x3d-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 7', model: '9800X3D', cores: 8, threads: 16 } },
  },
  {
    category: 'parts', title: 'AMD Ryzen 7 9700X', subtitle: 'Zen 5 · 8C/16T · 40MB cache · AM5 · 65W',
    price: 349, compareAt: 379, condition: 'New', stock: 28, image: 'ryzen-9700x-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 7', model: '9700X', cores: 8, threads: 16 } },
  },
  {
    category: 'parts', title: 'AMD Ryzen 5 9600X', subtitle: 'Zen 5 · 6C/12T · 38MB cache · AM5 · 65W',
    price: 249, condition: 'New', stock: 30, image: 'ryzen-9600x-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 5', model: '9600X', cores: 6, threads: 12 } },
  },
  {
    category: 'parts', title: 'Intel Core Ultra 9 285K', subtitle: 'Arrow Lake · 24C/24T · 5.7GHz boost · LGA 1851 · 125W',
    price: 599, compareAt: 649, condition: 'New', stock: 15, image: 'intel-ultra-9-285k-boxed',
    specs: { cpu: { brand: 'Intel', family: 'Core Ultra 9', model: '285K', cores: 24, threads: 24 } },
  },
  {
    category: 'parts', title: 'Intel Core Ultra 7 265K', subtitle: 'Arrow Lake · 20C/20T · 5.5GHz boost · LGA 1851 · 125W',
    price: 419, compareAt: 459, condition: 'New', stock: 20, image: 'intel-ultra-7-265k-boxed',
    specs: { cpu: { brand: 'Intel', family: 'Core Ultra 7', model: '265K', cores: 20, threads: 20 } },
  },
  {
    category: 'parts', title: 'Intel Core Ultra 5 245K', subtitle: 'Arrow Lake · 14C/14T · 5.2GHz boost · LGA 1851 · 125W',
    price: 329, condition: 'New', stock: 24, image: 'intel-ultra-5-245k-boxed',
    specs: { cpu: { brand: 'Intel', family: 'Core Ultra 5', model: '245K', cores: 14, threads: 14 } },
  },

  // --- Workstation CPUs (non-Pro Threadripper + EPYC flagship) ---
  {
    category: 'parts', title: 'AMD Threadripper 7970X (32-core)', subtitle: 'Zen 4 · 32C/64T · sTR5 · 350W TDP · quad-channel DDR5',
    price: 2899, compareAt: 3199, condition: 'New', stock: 3, image: 'tr-7970x-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Threadripper', model: '7970X', cores: 32, threads: 64 } },
  },
  {
    category: 'parts', title: 'AMD Threadripper 7960X (24-core)', subtitle: 'Zen 4 · 24C/48T · sTR5 · 350W TDP',
    price: 1899, compareAt: 2099, condition: 'New', stock: 4, image: 'tr-7960x-boxed',
    specs: { cpu: { brand: 'AMD', family: 'Threadripper', model: '7960X', cores: 24, threads: 48 } },
  },
  {
    category: 'parts', title: 'AMD EPYC 9755 (128-core)', subtitle: 'Zen 5 · 128C/256T · SP5 · 500W TDP · 12-channel DDR5 · server flagship',
    price: 11999, condition: 'New', stock: 2, image: 'epyc-9755-boxed',
    specs: { cpu: { brand: 'AMD', family: 'EPYC', model: '9755', cores: 128, threads: 256 } },
  },

  // ========================================================================
  // Flagship motherboards (AM5, LGA1851, sTR5, WRX90)
  // ========================================================================
  {
    category: 'parts', title: 'ASUS ROG Crosshair X870E Hero', subtitle: 'AM5 · X870E · PCIe 5.0 x16 + dual M.2 Gen5 · Wi-Fi 7 · AQtion 5G LAN',
    price: 749, condition: 'New', stock: 8, image: 'crosshair-x870e-hero',
    specs: {},
  },
  {
    category: 'parts', title: 'MSI MEG X870E GODLIKE', subtitle: 'AM5 · X870E · OLED dynamic dashboard · Thunderbolt 5 · triple M.2 Gen5',
    price: 1099, condition: 'New', stock: 4, image: 'meg-x870e-godlike',
    specs: {},
  },
  {
    category: 'parts', title: 'Gigabyte X870E AORUS MASTER', subtitle: 'AM5 · X870E · 18+2+2 phase · triple M.2 Gen5 · Wi-Fi 7 · 5G LAN',
    price: 649, condition: 'New', stock: 10, image: 'x870e-aorus-master',
    specs: {},
  },
  {
    category: 'parts', title: 'ASUS ROG Maximus Z890 Hero', subtitle: 'LGA 1851 · Z890 · Thunderbolt 4 · dual M.2 Gen5 · Wi-Fi 7 · 5G LAN',
    price: 699, condition: 'New', stock: 7, image: 'maximus-z890-hero',
    specs: {},
  },
  {
    category: 'parts', title: 'MSI MEG Z890 GODLIKE', subtitle: 'LGA 1851 · Z890 · 110A SPS · OLED dashboard · Wi-Fi 7 · dual 10GbE',
    price: 1199, condition: 'New', stock: 3, image: 'meg-z890-godlike',
    specs: {},
  },
  {
    category: 'parts', title: 'ASRock TRX50 WS', subtitle: 'sTR5 · TRX50 · 8x DIMM quad-channel DDR5 ECC · 10GbE · PCIe 5.0 x16',
    price: 899, condition: 'New', stock: 4, image: 'asrock-trx50-ws',
    specs: {},
  },
  {
    category: 'parts', title: 'ASUS Pro WS WRX90E-SAGE SE', subtitle: 'sWRX9 · WRX90 · 8x DIMM 8-channel DDR5 ECC · 7x PCIe 5.0 · Threadripper Pro flagship',
    price: 1599, condition: 'New', stock: 2, image: 'wrx90e-sage-se',
    specs: {},
  },

  // ========================================================================
  // Flagship RAM kits
  // ========================================================================
  {
    category: 'parts', title: 'G.Skill Trident Z5 RGB DDR5-8400 48GB (2x24GB)', subtitle: 'CL40 · Intel XMP 3.0 · overclocker flagship · dual-channel',
    price: 389, compareAt: 429, condition: 'New', stock: 12, image: 'trident-z5-8400',
    specs: { memory: { sizeGb: 48, type: 'DDR5', speedMhz: 8400 } },
  },
  {
    category: 'parts', title: 'Corsair Dominator Titanium RGB DDR5-7200 64GB (2x32GB)', subtitle: 'CL34 · iCUE RGB · hand-sorted · lifetime warranty',
    price: 479, compareAt: 529, condition: 'New', stock: 10, image: 'dominator-titanium-7200',
    specs: { memory: { sizeGb: 64, type: 'DDR5', speedMhz: 7200 } },
  },
  {
    category: 'parts', title: 'Kingston FURY Renegade DDR5-8000 32GB (2x16GB)', subtitle: 'CL38 · Intel XMP + AMD EXPO · aluminium heat spreader',
    price: 199, condition: 'New', stock: 18, image: 'fury-renegade-8000',
    specs: { memory: { sizeGb: 32, type: 'DDR5', speedMhz: 8000 } },
  },
  {
    category: 'parts', title: 'G.Skill Trident Z5 Neo RGB DDR5-6400 64GB (2x32GB)', subtitle: 'CL32 · AMD EXPO tuned · 9950X3D sweet-spot kit',
    price: 319, condition: 'New', stock: 14, image: 'trident-z5-neo-6400',
    specs: { memory: { sizeGb: 64, type: 'DDR5', speedMhz: 6400 } },
  },
  {
    category: 'parts', title: 'Corsair Vengeance DDR5-6000 128GB (4x32GB)', subtitle: 'CL30 · AMD EXPO · high-capacity AM5 kit',
    price: 549, condition: 'New', stock: 8, image: 'vengeance-6000-128gb',
    specs: { memory: { sizeGb: 128, type: 'DDR5', speedMhz: 6000 } },
  },
  {
    category: 'parts', title: 'Kingston Server Premier DDR5-5600 256GB (8x32GB) ECC RDIMM', subtitle: 'Registered ECC · Threadripper Pro / EPYC / Xeon W',
    price: 1899, condition: 'New', stock: 3, image: 'kingston-server-premier-ecc',
    specs: { memory: { sizeGb: 256, type: 'DDR5 ECC', speedMhz: 5600 } },
  },

  // ========================================================================
  // Flagship CPU coolers
  // ========================================================================
  {
    category: 'parts', title: 'Noctua NH-D15 G2', subtitle: 'Dual-tower air · 2x NF-A14 · 6-year warranty · best-in-class air cooling',
    price: 139, condition: 'New', stock: 22, image: 'nh-d15-g2',
    specs: {},
  },
  {
    category: 'parts', title: 'Thermalright Peerless Assassin 140 SE', subtitle: 'Dual-tower air · 2x 140mm TL-K14 · value flagship',
    price: 49, condition: 'New', stock: 40, image: 'peerless-assassin-140-se',
    specs: {},
  },
  {
    category: 'parts', title: 'Corsair iCUE H170i ELITE LCD XT (420mm AIO)', subtitle: '3x 140mm · 2.1" IPS LCD · MagLev pump',
    price: 329, compareAt: 379, condition: 'New', stock: 10, image: 'corsair-h170i-elite-lcd',
    specs: {},
  },
  {
    category: 'parts', title: 'ARCTIC Liquid Freezer III 420', subtitle: '3x 140mm P14 PWM · VRM fan · 6-year warranty · value king',
    price: 119, condition: 'New', stock: 25, image: 'liquid-freezer-iii-420',
    specs: {},
  },
  {
    category: 'parts', title: 'EK-AIO Elite 360 D-RGB', subtitle: '3x 120mm Vardar EVO · thick radiator · premium European build',
    price: 259, condition: 'New', stock: 8, image: 'ek-aio-elite-360',
    specs: {},
  },
  {
    category: 'parts', title: 'be quiet! Dark Rock Elite', subtitle: 'Dual-tower air · Silent Wings 4 · near-silent under load',
    price: 119, condition: 'New', stock: 18, image: 'dark-rock-elite',
    specs: {},
  },

  // ========================================================================
  // Flagship cases
  // ========================================================================
  {
    category: 'parts', title: 'Lian Li O11 Dynamic EVO XL', subtitle: 'Full tower · E-ATX · dual chamber · show-off glass',
    price: 289, condition: 'New', stock: 14, image: 'o11-dynamic-evo-xl',
    specs: {},
  },
  {
    category: 'parts', title: 'Fractal Design North XL', subtitle: 'Full tower · walnut wood front · mesh airflow · European design',
    price: 249, condition: 'New', stock: 16, image: 'fractal-north-xl',
    specs: {},
  },
  {
    category: 'parts', title: 'Phanteks NV9 Showcase', subtitle: 'Full tower · 3-sided glass · vertical PCIe 5.0 riser included',
    price: 349, compareAt: 399, condition: 'New', stock: 6, image: 'phanteks-nv9',
    specs: {},
  },
  {
    category: 'parts', title: 'Corsair 6500X Dual Chamber', subtitle: 'Mid-tower · Reverse Connect · 420mm top + side radiator support',
    price: 249, condition: 'New', stock: 12, image: 'corsair-6500x',
    specs: {},
  },
  {
    category: 'parts', title: 'HYTE Y70 Touch Infinite', subtitle: 'Mid-tower · built-in 14.1" 2560x720 touchscreen · customisable UI',
    price: 559, compareAt: 599, condition: 'New', stock: 5, image: 'hyte-y70-touch-infinite',
    specs: {},
  },
  {
    category: 'parts', title: 'Sliger SM580 SFF', subtitle: 'Small form factor · sandwich layout · aluminium · supports 4090',
    price: 229, condition: 'New', stock: 10, image: 'sliger-sm580',
    specs: {},
  },

  // ========================================================================
  // More flagship storage (NVMe Gen5 + enterprise U.2/U.3)
  // ========================================================================
  {
    category: 'hard-drive', title: 'Crucial T705 4TB NVMe Gen5', subtitle: 'PCIe 5.0 · 14,500 MB/s read · M.2 2280 · heatsink variant',
    price: 549, compareAt: 599, condition: 'New', stock: 14, image: 'crucial-t705-4tb',
    specs: {},
  },
  {
    category: 'hard-drive', title: 'WD Black SN8100 4TB NVMe Gen5', subtitle: 'PCIe 5.0 · 14,900 MB/s read · 5-year warranty · gaming flagship',
    price: 569, compareAt: 619, condition: 'New', stock: 10, image: 'wd-black-sn8100-4tb',
    specs: {},
  },
  {
    category: 'hard-drive', title: 'Samsung 990 PRO 4TB NVMe Gen4', subtitle: 'PCIe 4.0 · 7,450 MB/s read · 600 TBW · M.2 2280',
    price: 299, condition: 'New', stock: 24, image: 'samsung-990-pro-4tb',
    specs: {},
  },
  {
    category: 'hard-drive', title: 'Kioxia CM7-V 7.68TB Enterprise NVMe Gen5', subtitle: 'U.3 2.5" · PCIe 5.0 · mixed-use · 3 DWPD · data-centre grade',
    price: 3499, condition: 'New', stock: 3, image: 'kioxia-cm7-v-7tb',
    specs: {},
  },
  {
    category: 'hard-drive', title: 'Solidigm D7-PS1030 3.84TB Gen5', subtitle: 'U.2 · PCIe 5.0 · read-intensive · 1 DWPD',
    price: 1699, condition: 'New', stock: 5, image: 'solidigm-d7-ps1030',
    specs: {},
  },
  {
    category: 'hard-drive', title: 'Seagate Exos X26 30TB Enterprise HDD', subtitle: 'SATA 6Gb/s · 7200 rpm · CMR · 5-year warranty · data-centre grade',
    price: 599, condition: 'New', stock: 8, image: 'seagate-exos-x26-30tb',
    specs: {},
  },
  {
    category: 'hard-drive', title: 'Samsung PM1733a 30.72TB Enterprise NVMe', subtitle: 'U.2 · PCIe 4.0 · read-intensive · AI/ML storage tier',
    price: 4999, condition: 'New', stock: 2, image: 'samsung-pm1733a-30tb',
    specs: {},
  },

  // ========================================================================
  // More flagship PSUs (Titanium, digital, 1600W-class)
  // ========================================================================
  {
    category: 'power-supply-chargers', title: 'Super Flower Leadex VII PRO 1600W Titanium', subtitle: 'ATX 3.1 · 12V-2x6 · 135mm fan · Japanese caps · 12-year warranty',
    price: 469, condition: 'New', stock: 8, image: 'leadex-vii-pro-1600w',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'ASUS ROG Thor 1600W Titanium II', subtitle: 'ATX 3.1 · OLED wattage readout · 12V-2x6 · 10-year warranty',
    price: 599, condition: 'New', stock: 5, image: 'rog-thor-1600t-ii',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'MSI MEG Ai1600T PCIE5', subtitle: 'ATX 3.1 · 80+ Titanium · dual 12V-2x6 · 1600W',
    price: 549, condition: 'New', stock: 6, image: 'msi-meg-ai1600t',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'FSP Hydro PTM X PRO 1200W', subtitle: 'ATX 3.1 · 80+ Platinum · 12V-2x6 · 135mm FDB fan',
    price: 279, condition: 'New', stock: 12, image: 'fsp-hydro-ptm-x-pro-1200w',
    specs: {},
  },
  {
    category: 'power-supply-chargers', title: 'Cooler Master V Platinum V2 1600W', subtitle: 'ATX 3.1 · modular · zero-RPM mode · 10-year warranty',
    price: 459, condition: 'New', stock: 7, image: 'cm-v-platinum-v2-1600w',
    specs: {},
  },

  // ========================================================================
  // More flagship network (100G core + Wi-Fi 7 enterprise)
  // ========================================================================
  {
    category: 'network-equipment', title: 'Cisco Catalyst 9500-40X-2Q', subtitle: '40x 10G + 2x 40G uplinks · Stackwise-480 · enterprise core',
    price: 12999, condition: 'Excellent', stock: 2, image: 'cisco-c9500-40x',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Juniper QFX5120-48Y', subtitle: '48x 25G + 8x 100G · data-centre leaf · EVPN/VXLAN',
    price: 9499, condition: 'Excellent', stock: 2, image: 'juniper-qfx5120',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Arista 7280R3-40C6', subtitle: '40x 100G + 6x 400G · deep-buffer · service-provider grade',
    price: 18999, condition: 'Very Good', stock: 1, image: 'arista-7280r3',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Ubiquiti UniFi Switch Pro Max 48 PoE', subtitle: '48x 2.5G PoE++ · 4x 10G SFP+ · 720W budget · Etherlighting',
    price: 1299, condition: 'New', stock: 10, image: 'unifi-pro-max-48-poe',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Ubiquiti UniFi Dream Machine Pro Max', subtitle: 'Enterprise gateway · 2x SFP+ · dual-disk NVR · 400+ clients',
    price: 499, condition: 'New', stock: 15, image: 'udm-pro-max',
    specs: {},
  },
  {
    category: 'network-equipment', title: 'Ubiquiti UniFi U7 Pro Max Wi-Fi 7 AP', subtitle: 'Tri-band Wi-Fi 7 · 9.3 Gbps · 6 GHz · MLO · ceiling mount',
    price: 279, condition: 'New', stock: 22, image: 'unifi-u7-pro-max',
    specs: {},
  },

  // ========================================================================
  // Reference-tier monitors (flagship displays for colour-critical + gaming)
  // ========================================================================
  {
    category: 'monitors', title: 'Apple Pro Display XDR 32" 6K (nano-texture)', subtitle: '6016x3384 · 1600 nits peak HDR · P3 · colour reference',
    price: 4999, compareAt: 5499, condition: 'Like New', stock: 2, image: 'apple-pro-display-xdr-nano',
    specs: {},
  },
  {
    category: 'monitors', title: 'ASUS ROG Swift OLED PG32UCDM', subtitle: '32" 4K QD-OLED · 240Hz · 0.03ms · DisplayPort 2.1',
    price: 1299, compareAt: 1399, condition: 'New', stock: 8, image: 'asus-pg32ucdm',
    specs: {},
  },
  {
    category: 'monitors', title: 'LG UltraFine 32EP950 4K OLED', subtitle: '32" 4K OLED · DCI-P3 99% · pro reference · Thunderbolt 3',
    price: 2899, compareAt: 3199, condition: 'Excellent', stock: 3, image: 'lg-ultrafine-32ep950',
    specs: {},
  },
  {
    category: 'monitors', title: 'Dell UltraSharp U4924DW 49" 5K Curved', subtitle: 'IPS Black · 5120x1440 · USB-C 90W · KVM · colour-calibrated',
    price: 1399, compareAt: 1499, condition: 'New', stock: 5, image: 'dell-u4924dw',
    specs: {},
  },
  {
    category: 'monitors', title: 'BenQ PD3225U 32" 6K Thunderbolt 4 Mac Designer', subtitle: '6144x3456 · HDR10 · Pantone validated · 99% Display P3',
    price: 1699, condition: 'New', stock: 4, image: 'benq-pd3225u',
    specs: {},
  },
  {
    category: 'monitors', title: 'MSI MPG 321URX QD-OLED', subtitle: '32" 4K QD-OLED · 240Hz · 0.03ms · KVM · USB-C 90W',
    price: 1099, condition: 'New', stock: 9, image: 'msi-mpg-321urx',
    specs: {},
  },

  // ========================================================================
  // Reference-tier projectors (JVC, Sony flagship, UST laser)
  // ========================================================================
  {
    category: 'projectors', title: 'JVC DLA-NZ900 8K e-shift Reference Projector', subtitle: 'D-ILA · 8K e-shift · 3300 lumens · BT.2020 · THX-certified home cinema',
    price: 24999, condition: 'New', stock: 1, image: 'jvc-dla-nz900',
    specs: {},
  },
  {
    category: 'projectors', title: 'Sony VPL-GTZ380 8K Laser', subtitle: 'SXRD 8K · 10,000 lumens · BT.2020 · installation reference',
    price: 74999, condition: 'New', stock: 1, image: 'sony-vpl-gtz380',
    specs: {},
  },
  {
    category: 'projectors', title: 'Formovie Theater Premium 4K UST Laser', subtitle: 'ALPD 4.0 · 2800 ANSI lumens · Dolby Vision · UST 0.23:1',
    price: 2999, compareAt: 3299, condition: 'New', stock: 6, image: 'formovie-theater-premium',
    specs: {},
  },
  {
    category: 'projectors', title: 'Hisense PX3-PRO TriChroma Laser UST', subtitle: '3000 ANSI lumens · 107% BT.2020 · Google TV · Dolby Vision',
    price: 3299, condition: 'New', stock: 5, image: 'hisense-px3-pro',
    specs: {},
  },

  // ========================================================================
  // AI mini PCs — for local model inference + training
  // ========================================================================
  {
    category: 'computers', title: 'NVIDIA DGX Spark', subtitle: 'Personal AI supercomputer · GB10 Grace Blackwell · 128GB unified memory · 200B-param models',
    price: 2999, compareAt: 3299, condition: 'New', stock: 3, image: 'nvidia-dgx-spark',
    specs: { cpu: { brand: 'NVIDIA', family: 'Grace', model: 'GB10', cores: 20, threads: 20 }, gpu: { brand: 'NVIDIA', model: 'Blackwell GB10', vramGb: 128, rtx: false }, memory: { sizeGb: 128, type: 'LPDDR5X', speedMhz: 8533 } },
  },
  {
    category: 'computers', title: 'NVIDIA DGX Station (GB300)', subtitle: 'Desktop AI workstation · GB300 Grace Blackwell Ultra · 784GB coherent memory · 20 PFLOPS FP4',
    price: 69999, condition: 'New', stock: 1, image: 'nvidia-dgx-station-gb300',
    specs: { cpu: { brand: 'NVIDIA', family: 'Grace', model: 'GB300', cores: 72, threads: 72 }, gpu: { brand: 'NVIDIA', model: 'Blackwell Ultra GB300', vramGb: 288, rtx: false }, memory: { sizeGb: 784, type: 'LPDDR5X ECC', speedMhz: 8533 } },
  },
  {
    category: 'computers', title: 'NVIDIA Jetson AGX Thor Developer Kit', subtitle: 'Robotics + edge AI · Blackwell · 128GB · 2070 TFLOPS · 40W-130W',
    price: 3499, condition: 'New', stock: 4, image: 'jetson-agx-thor',
    specs: { gpu: { brand: 'NVIDIA', model: 'Jetson Blackwell', vramGb: 128, rtx: false }, memory: { sizeGb: 128, type: 'LPDDR5X', speedMhz: 7800 } },
  },
  {
    category: 'computers', title: 'NVIDIA Jetson Orin Nano Super Developer Kit', subtitle: 'Entry-level AI dev kit · Ampere · 8GB · 67 TOPS · edge inference',
    price: 249, condition: 'New', stock: 18, image: 'jetson-orin-nano-super',
    specs: { gpu: { brand: 'NVIDIA', model: 'Jetson Ampere', vramGb: 8, rtx: false }, memory: { sizeGb: 8, type: 'LPDDR5', speedMhz: 6400 } },
  },
  {
    category: 'computers', title: 'GMKtec EVO-X2 AI Mini PC (Ryzen AI MAX+ 395)', subtitle: 'Strix Halo · 16C/32T · Radeon 8060S · 128GB LPDDR5X · 70B-param local LLM',
    price: 1899, compareAt: 2099, condition: 'New', stock: 10, image: 'gmktec-evo-x2',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen AI MAX+', model: '395', cores: 16, threads: 32 }, gpu: { brand: 'AMD', model: 'Radeon 8060S', vramGb: 0, rtx: false }, memory: { sizeGb: 128, type: 'LPDDR5X', speedMhz: 8000 } },
  },
  {
    category: 'computers', title: 'Framework Desktop (AMD Strix Halo)', subtitle: 'Modular mini-ITX · Ryzen AI MAX+ 395 · 128GB LPDDR5X · open, repairable',
    price: 1699, condition: 'New', stock: 8, image: 'framework-desktop-strix-halo',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen AI MAX+', model: '395', cores: 16, threads: 32 }, memory: { sizeGb: 128, type: 'LPDDR5X', speedMhz: 8000 } },
  },
  {
    category: 'computers', title: 'Apple Mac Studio M3 Ultra (512GB)', subtitle: 'M3 Ultra · 32-core CPU · 80-core GPU · 512GB unified memory · run 70B+ locally',
    price: 9499, condition: 'New', stock: 3, image: 'mac-studio-m3-ultra-512',
    specs: { cpu: { brand: 'Apple', family: 'M3', model: 'M3 Ultra', cores: 32, threads: 32 }, memory: { sizeGb: 512, type: 'Unified', speedMhz: 0 } },
  },
  {
    category: 'computers', title: 'Apple Mac Mini M4 Pro (64GB)', subtitle: 'M4 Pro · 14-core CPU · 20-core GPU · 64GB unified · Thunderbolt 5',
    price: 2299, condition: 'New', stock: 6, image: 'mac-mini-m4-pro-64gb',
    specs: { cpu: { brand: 'Apple', family: 'M4', model: 'M4 Pro', cores: 14, threads: 14 }, memory: { sizeGb: 64, type: 'Unified', speedMhz: 0 } },
  },
  {
    category: 'computers', title: 'Minisforum MS-A2 Ryzen 9 7945HX AI Mini PC', subtitle: 'Zen 4 · 16C/32T · dual 2.5GbE + 10GbE · 96GB DDR5 SO-DIMM',
    price: 999, compareAt: 1099, condition: 'New', stock: 9, image: 'minisforum-ms-a2',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '7945HX', cores: 16, threads: 32 }, memory: { sizeGb: 96, type: 'DDR5', speedMhz: 5600 } },
  },
  {
    category: 'computers', title: 'ASUS NUC 14 Pro AI (Core Ultra 9 185H)', subtitle: 'Meteor Lake · 16C/22T · 32GB LPDDR5X · Intel AI Boost NPU · Wi-Fi 7',
    price: 1199, condition: 'New', stock: 12, image: 'asus-nuc-14-pro-ai',
    specs: { cpu: { brand: 'Intel', family: 'Core Ultra 9', model: '185H', cores: 16, threads: 22 }, memory: { sizeGb: 32, type: 'LPDDR5X', speedMhz: 7467 } },
  },
  {
    category: 'computers', title: 'Beelink GTR7 Pro Ryzen 9 8945HS Mini PC', subtitle: 'Zen 4 · 8C/16T · Radeon 780M · 64GB DDR5 · dual 2.5GbE',
    price: 799, condition: 'New', stock: 14, image: 'beelink-gtr7-pro',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '8945HS', cores: 8, threads: 16 }, memory: { sizeGb: 64, type: 'DDR5', speedMhz: 5600 } },
  },
  {
    category: 'computers', title: 'AOOSTAR GEM12 Pro Ryzen 9 8845HS AI PC', subtitle: 'Ryzen AI · 8C/16T · Radeon 780M · 32GB DDR5 · triple-screen 4K',
    price: 599, condition: 'New', stock: 16, image: 'aoostar-gem12-pro',
    specs: { cpu: { brand: 'AMD', family: 'Ryzen 9', model: '8845HS', cores: 8, threads: 16 }, memory: { sizeGb: 32, type: 'DDR5', speedMhz: 5600 } },
  },
];

function imageFor(seed: string, i = 0): string {
  // Deterministic placeholder photos. Seed + index keeps them stable across re-runs.
  return `https://picsum.photos/seed/${seed}-${i}/800/600`;
}

function orderNumber(d = new Date()) {
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `BAV-${y}${m}${day}-${rand}`;
}

// --- seed ---

async function main() {
  const started = Date.now();
  console.log('==> Connecting Mongo');
  await connectMongo();

  console.log('==> Seeding product categories');
  const categorySpec = [
    { slug: 'all-in-one-pc', name: 'All-in-One PCs' },
    { slug: 'computers', name: 'Computers' },
    { slug: 'gaming-pc-bundles', name: 'Gaming PC Bundles' },
    { slug: 'laptops', name: 'Laptops' },
    { slug: 'monitors', name: 'Monitors' },
    { slug: 'projectors', name: 'Projectors' },
    { slug: 'projector-lenses', name: 'Projector Lenses' },
    { slug: 'printers', name: 'Printers' },
    { slug: 'av-switches', name: 'AV Switches' },
    { slug: 'parts', name: 'Parts' },
    { slug: 'hard-drive', name: 'Hard Drives' },
    { slug: 'power-supply-chargers', name: 'Power Supply and Chargers' },
    { slug: 'network-equipment', name: 'Network Equipment' },
    { slug: 'other', name: 'Other' },
  ];
  for (const [i, c] of categorySpec.entries()) {
    await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: i },
      create: { slug: c.slug, name: c.name, sortOrder: i },
    });
  }
  const categories = await prisma.productCategory.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c.categoryId] as const));

  console.log('==> Seeding warehouse nodes');
  const warehouseSpec = [
    { nodeCode: 'BHM-HUB-A', locationName: 'Birmingham Hub A', postcode: 'B9 5JQ' },
    { nodeCode: 'BHM-HUB-B', locationName: 'Birmingham Hub B', postcode: 'B60 3AJ' },
    { nodeCode: 'BHM-HUB-C', locationName: 'Birmingham Hub C', postcode: 'B18 6NF' },
  ];
  const nodes: { warehouseNodeId: string }[] = [];
  for (const n of warehouseSpec) {
    const up = await prisma.warehouseNode.upsert({
      where: { nodeCode: n.nodeCode },
      update: {},
      create: {
        nodeCode: n.nodeCode,
        locationName: n.locationName,
        address: { line1: `${n.nodeCode} Unit`, city: 'Birmingham', postcode: n.postcode, countryIso2: 'GB' },
        maxConcurrentBuilds: 60,
      },
    });
    nodes.push({ warehouseNodeId: up.warehouseNodeId });
  }

  console.log('==> Seeding owner + staff');
  const tempPassword = process.env.SEED_OWNER_PASSWORD ?? crypto.randomBytes(9).toString('base64url');
  const ownerHash = await sha(tempPassword);
  await prisma.user.upsert({
    where: { email: 'owner@birmingham-av.com' },
    update: {},
    create: {
      email: 'owner@birmingham-av.com',
      passwordHash: ownerHash,
      role: 'super_admin',
      firstName: 'Micky',
      emailVerifiedAt: new Date(),
    },
  });
  for (const email of ['support-1@birmingham-av.com', 'support-2@birmingham-av.com', 'support-3@birmingham-av.com']) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await sha('changeme'),
        role: 'support_staff',
        firstName: 'Support',
        lastName: email.split('@')[0] ?? '',
        emailVerifiedAt: new Date(),
      },
    });
  }

  // Demo customers (for orders/tickets)
  const demoCustomers: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const email = `customer-${i + 1}@demo.birmingham-av.com`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await sha('demo'),
        role: 'customer',
        firstName: pick(['Oliver', 'Amelia', 'George', 'Isla', 'Jack', 'Lily', 'Noah', 'Emily', 'Henry', 'Charlotte'], i),
        lastName: pick(['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Evans', 'Thomas', 'Davies', 'Roberts'], i),
        emailVerifiedAt: new Date(),
      },
    });
    demoCustomers.push(u.userId);
  }

  console.log('==> Seeding 22 builders');
  const r = rngSeeded(7);
  const builderIds: string[] = [];
  for (let i = 0; i < 22; i += 1) {
    const first = pick(BUILDER_FIRST_NAMES, i);
    const last = pick(BUILDER_SURNAMES, i);
    const code = `BLD-${String(i + 1).padStart(3, '0')}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@builders.birmingham-av.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await sha('changeme'),
        role: 'builder',
        firstName: first,
        lastName: last,
        emailVerifiedAt: new Date(),
      },
    });
    const node = pick(nodes, i);
    const tier = i < 3 ? 'elite' : i < 10 ? 'preferred' : i < 18 ? 'standard' : 'probation';
    const profile = BUILDER_PROFILES[i]!;
    const portraitSeed = `${first}-${last}`.toLowerCase();
    const avatarUrl =
      `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(portraitSeed)}` +
      `&backgroundColor=e5f7ea,ffffff` +
      `&skinColor=f9e5c9,e4b68a,c68642,8d5524` +
      `&hair=bob,bun,short,pixie,buzz`;
    const builderCommonFields = {
      warehouseNodeId: node.warehouseNodeId,
      displayName: `${first} ${last}`,
      legalName: `${first} ${last}`,
      tier: tier as (typeof TIERS)[number],
      status: 'active' as const,
      avatarUrl,
      bio: profile.bio,
      specialities: profile.specialities,
      yearsBuilding: profile.yearsBuilding,
      favouriteBuild: profile.favouriteBuild,
    };
    const b = await prisma.builder.upsert({
      where: { builderCode: code },
      update: builderCommonFields,
      create: {
        builderCode: code,
        userId: user.userId,
        ...builderCommonFields,
        totalUnitsBuilt: 100 + Math.floor(r() * 600),
        totalUnitsSold: 90 + Math.floor(r() * 580),
        qualityScore: 3.8 + r() * 1.2,
        rmaRateRolling90d: r() * 0.06,
        avgBuildMinutes: 70 + Math.floor(r() * 60),
        avgResponseHours: 1.2 + r() * 4.2,
      },
    });
    builderIds.push(b.builderId);
  }

  console.log(`==> Seeding ${DEMO_PRODUCTS.length} demo products`);
  const productIds: Array<{ id: string; builderId: string; price: number; title: string; slug: string }> = [];
  for (let i = 0; i < DEMO_PRODUCTS.length; i += 1) {
    const p = DEMO_PRODUCTS[i];
    if (!p) continue;
    const categoryId = catBySlug.get(p.category);
    if (!categoryId) continue;
    const builderId = builderIds[i % builderIds.length];
    if (!builderId) continue;
    const slug = `${slugify(p.title)}-${i + 1}`;
    const sku = `BAV-DEMO-${String(i + 1).padStart(4, '0')}`;

    const product = await prisma.product.upsert({
      where: { sku },
      update: { priceGbp: p.price, isActive: true },
      create: {
        sku,
        slug,
        builderId,
        categoryId,
        title: p.title,
        subtitle: p.subtitle,
        conditionGrade: p.condition,
        priceGbp: p.price,
        costGbp: Math.round(p.price * 0.72),
        compareAtGbp: p.compareAt ?? null,
        warrantyMonths: 12,
        isActive: true,
        isFeatured: i < 8,
        inventory: { create: { stockQty: p.stock, reorderThreshold: 2 } },
      },
    });

    if (process.env.MONGO_URL) {
      await ProductCatalog.findOneAndUpdate(
        { postgresProductId: product.productId },
        {
          $set: {
            postgresProductId: product.productId,
            sku,
            slug,
            images: [0, 1, 2].map((n) => ({ url: imageFor(p.image, n), alt: p.title, isPrimary: n === 0 })),
            specs: p.specs,
            tags: [p.condition, ...(p.specs.cpu ? [p.specs.cpu.family] : []), ...(p.specs.gpu ? [p.specs.gpu.model] : [])],
            seo: { metaTitle: `${p.title} | Birmingham AV`, metaDescription: p.subtitle, keywords: [p.category] },
          },
        },
        { upsert: true, new: true },
      ).catch((err) => console.warn('[seed] mongo write skipped:', (err as Error).message));
    }

    productIds.push({ id: product.productId, builderId, price: p.price, title: p.title, slug });
  }

  // Demo transactional data (orders, returns, tickets) only seeded on a fresh DB.
  // Skip on re-runs so repeat seeding doesn't duplicate rows or hit unique collisions
  // on deterministic RMA / ticket numbers.
  const existingOrderCount = await prisma.order.count({ where: { status: { not: 'draft' } } });
  if (existingOrderCount >= 10) {
    console.log(`==> Demo orders already present (${existingOrderCount}), skipping demo transactional seed`);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log('');
    console.log('==> Seed complete in', elapsed, 's');
    console.log('==> Super-admin login:');
    console.log('      email:    owner@birmingham-av.com');
    console.log('      password:', tempPassword, '   <-- save this');
    console.log('');
    return;
  }

  console.log('==> Seeding demo orders (15)');
  const createdOrderIds: string[] = [];
  for (let i = 0; i < 15; i += 1) {
    const customer = pick(demoCustomers, i);
    const lineCount = 1 + (i % 3);
    const picks = Array.from({ length: lineCount }, (_, n) => productIds[(i * 7 + n) % productIds.length]!);
    const subtotal = picks.reduce((s, p) => s + p.price, 0);
    const total = Math.round(subtotal * 1.2 * 100) / 100;
    const daysAgo = Math.floor((i * 3) + 1);
    const placed = new Date(Date.now() - daysAgo * 86_400_000);
    const status = i < 3 ? 'delivered' : i < 6 ? 'shipped' : i < 9 ? 'in_build' : i < 12 ? 'paid' : 'queued';

    const ord = await prisma.order.create({
      data: {
        orderNumber: orderNumber(placed),
        userId: customer,
        status: status as 'paid',
        subtotalGbp: subtotal,
        shippingGbp: 0,
        taxGbp: Math.round(subtotal * 0.2 * 100) / 100,
        totalGbp: total,
        currency: 'GBP',
        paymentMethod: 'stripe_card',
        paymentCapturedAt: placed,
        shippingAddress: {
          line1: `${10 + i} Corporation Street`,
          city: 'Birmingham',
          postcode: 'B4 6AT',
          countryIso2: 'GB',
        },
        createdAt: placed,
        shippedAt: status === 'shipped' || status === 'delivered' ? new Date(placed.getTime() + 2 * 86_400_000) : null,
        deliveredAt: status === 'delivered' ? new Date(placed.getTime() + 4 * 86_400_000) : null,
        items: {
          create: picks.map((p) => ({
            productId: p.id,
            builderId: p.builderId,
            qty: 1,
            pricePerUnitGbp: p.price,
            costPerUnitGbp: Math.round(p.price * 0.72),
          })),
        },
      },
    });
    createdOrderIds.push(ord.orderId);
  }

  console.log('==> Seeding demo returns (4)');
  const deliveredOrders = await prisma.order.findMany({
    where: { status: 'delivered' },
    include: { items: { include: { product: true, builder: true } }, user: true },
    take: 4,
  });
  for (let i = 0; i < deliveredOrders.length; i += 1) {
    const o = deliveredOrders[i]!;
    const item = o.items[0]!;
    const reason = pick(['hardware_fault', 'not_as_described', 'changed_mind', 'damaged_in_transit'], i);
    await prisma.return.create({
      data: {
        returnNumber: `RMA-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(1000 + i).padStart(4, '0')}`,
        orderItemId: item.orderItemId,
        orderId: o.orderId,
        builderId: item.builderId,
        productId: item.productId,
        requestedByUserId: o.userId,
        reason: reason as 'hardware_fault',
        reasonDetails: pick([
          'System failed to POST after 48 hours of use. Tried reseating RAM, no change.',
          'Arrived with a scratch on the top panel. Otherwise fine but not as described.',
          'Changed my mind - preferred a smaller form factor after all.',
          'Packaging was damaged and the side panel has a dent. Requesting partial refund.',
        ], i),
        status: i === 0 ? 'approved' : 'requested',
        refundAmountGbp: Number(item.pricePerUnitGbp),
        aiSeverity: [0.82, 0.34, 0.12, 0.58][i] ?? 0.4,
        aiFlaggedPattern: i === 0 ? 'repeat_thermal_failure' : null,
      },
    });
  }

  console.log('==> Seeding demo support tickets (3)');
  for (let i = 0; i < 3; i += 1) {
    const customer = pick(demoCustomers, i);
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `TKT-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(50000 + i).padStart(5, '0')}`,
        userId: customer,
        subject: pick([
          'Will this run Baldurs Gate 3 at 1440p Ultra?',
          'Order update: when is my PC shipping?',
          'Warranty question on refurbished laptop',
        ], i),
        channel: 'web_widget',
        status: i === 0 ? 'ai_handling' : i === 1 ? 'escalated_human' : 'resolved',
      },
    });
    await prisma.supportMessage.createMany({
      data: [
        {
          ticketId: ticket.ticketId,
          senderType: 'user',
          senderUserId: customer,
          body: 'Hi - quick question before I order.',
        },
        {
          ticketId: ticket.ticketId,
          senderType: 'ai',
          body: 'Hello. I can help with specs, orders, and returns. What would you like to know?',
          modelId: 'claude-opus-4-7',
        },
      ],
    });
  }

  console.log('==> Seeding discount codes');
  await prisma.discountCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'percent', value: 10, minSpend: 50, isActive: true },
  });

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log('');
  console.log('==> Seed complete in', elapsed, 's');
  console.log('==> Super-admin login:');
  console.log('      email:    owner@birmingham-av.com');
  console.log('      password:', tempPassword, '   <-- save this');
  console.log('');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await disconnectMongo();
  });
