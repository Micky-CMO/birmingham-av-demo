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
const CONDITION_GRADES = ['Like New', 'Excellent', 'Very Good', 'Good'] as const;

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
    const b = await prisma.builder.upsert({
      where: { builderCode: code },
      update: {},
      create: {
        builderCode: code,
        userId: user.userId,
        warehouseNodeId: node.warehouseNodeId,
        displayName: `${first} ${last}`,
        legalName: `${first} ${last}`,
        tier: tier as (typeof TIERS)[number],
        status: 'active',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(first + ' ' + last)}&backgroundColor=1EB53A`,
        bio: `Builder at Birmingham AV since ${2022 + Math.floor(r() * 4)}.`,
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
