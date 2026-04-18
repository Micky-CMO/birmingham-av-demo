/**
 * Birmingham AV — hardware knowledge base for the rule-based support responder.
 *
 * These rules answer real questions about PCs, GPUs, CPUs, RAM, storage,
 * monitors, projectors, networking, etc. without escalating. Kept as a big
 * ordered array so the matcher can pick the most specific rule first.
 */

export type KbRule = {
  match: RegExp;
  reply: string;
  escalate?: boolean;
  // Priority: higher = checked first. Default 0.
  priority?: number;
};

const BUILD_HELP = `
- **Budget £500-700** — entry 1080p gaming: Ryzen 5 or Core i5 + RTX 3060 or 4060 + 16GB DDR4/DDR5 + 500GB-1TB NVMe.
- **Mid £900-1400** — 1440p high settings: Ryzen 7 / Core i7 + RTX 4060 Ti or 4070 + 32GB DDR5 + 1TB NVMe.
- **High £1600-2400** — 1440p ultra / 4K high: Ryzen 7 / Core i7 + RTX 4070 Super or 4080 + 32GB DDR5 + 2TB NVMe.
- **Flagship £2600+** — 4K ultra + creator: Ryzen 9 / Core i9 + RTX 4080 Super or 4090 + 64GB DDR5 + 2TB NVMe Gen4.`.trim();

export const KB_RULES: KbRule[] = [
  // ──────── Greetings ────────
  {
    priority: 10,
    match: /^(hi|hello|hey|good (?:morning|afternoon|evening)|yo|hiya|howdy)[\s!.]*$/i,
    reply: 'Hi. I can help with specs, PC recommendations, orders, returns, warranty, or anything hardware. What are you looking for?',
  },

  // ──────── Build me a PC (high intent) ────────
  {
    priority: 100,
    match: /\b(build (?:me )?a (?:pc|rig|computer)|help me build|recommend a|what (?:pc|build|rig) should|which (?:pc|rig)|best pc for|pc for gaming|pc for (?:work|office|video editing|streaming|photoshop|cad))\b/i,
    reply: `Happy to narrow it down. Tell me three things and I'll point you at the right rig:\n1. Budget range (£500-£700 / £900-£1400 / £1600-£2400 / £2600+)\n2. Main use (gaming / work / video editing / streaming / general)\n3. Resolution if gaming (1080p / 1440p / 4K)\n\nAs a rough map:\n${BUILD_HELP}\n\nOr browse our gaming bundles at /shop/gaming-pc-bundles — every rig lists real frame rates per game.`,
  },

  // ──────── GPU comparisons ────────
  {
    priority: 95,
    match: /\b(rtx ?4090|4090)\b/i,
    reply: 'The RTX 4090 is the current flagship — roughly 50% faster than a 4080 Super and about 2x a 4070 Ti. Expect 80-120 fps at 4K Ultra with DLSS off in modern AAAs; 4K ultra + DLSS Frame Gen lands you at 150-240 fps territory. 24GB VRAM, ~450W draw, needs 850W+ PSU with native 12VHPWR. If you shoot 4K video or train local models, it earns its price. For pure gaming below 4K, a 4080 Super gives 90% of the performance at 60% of the cost.',
  },
  {
    priority: 94,
    match: /\b(rtx ?4080 ?super|4080)\b/i,
    reply: 'The RTX 4080 Super is the sweet spot for 4K gaming — 16GB VRAM, about 25% faster than a 4070 Ti Super, and runs cooler + pulls less power than a 4090 (~320W). You\'ll see 70-100 fps at 4K Ultra native and 120-200 fps with DLSS Quality + Frame Gen. Pairs best with a Ryzen 7 7800X3D or Core i7 14700K and 32GB DDR5-6000.',
  },
  {
    priority: 93,
    match: /\b(rtx ?407[05]|4070|4070 ?ti|4070 ?super)\b/i,
    reply: 'The RTX 4070 / 4070 Super / 4070 Ti Super range is the current value sweet spot. At 1440p Ultra: 4070 hits 70-100 fps, Super around 90-120 fps, Ti Super 100-140 fps. 12GB VRAM (16GB on the Ti Super) is enough for modern titles at 1440p. DLSS 3.5 Frame Gen keeps them future-proof. Great match with a Ryzen 7 7700X or Core i7 13700K.',
  },
  {
    priority: 92,
    match: /\b(rtx ?406[05]|4060|4060 ?ti)\b/i,
    reply: 'The RTX 4060 and 4060 Ti are solid 1080p / entry-1440p cards. 4060 Ti runs most titles at 1440p High 60-90 fps with DLSS. 8GB VRAM (16GB on the Ti 16GB variant) can bottleneck textures at 1440p Ultra in modern games — if you play Hogwarts Legacy, Alan Wake 2, or Indiana Jones on Ultra, grab the 16GB variant. Otherwise the 8GB is fine at 1080p.',
  },
  {
    priority: 90,
    match: /\b(rx ?7900|rx7900|radeon 7900|xtx)\b/i,
    reply: 'The RX 7900 XT and 7900 XTX are AMD\'s flagships. 7900 XTX trades blows with the RTX 4080 Super in raster — cheaper, 24GB VRAM, but weaker ray tracing (~75% of 4080). Best for 4K raster gaming or if you run Linux (better open-source drivers). 1440p at 150+ fps in most titles, 4K at 70-100 fps.',
  },
  {
    priority: 89,
    match: /\b(rx ?7800 ?xt|rx7800|7800 ?xt)\b/i,
    reply: 'RX 7800 XT is AMD\'s 1440p champion — 16GB VRAM, trades with the RTX 4070 in raster, cheaper than the 4070 Super, but weaker ray tracing. Pairs well with a Ryzen 7 5800X3D or 7700X. 1440p Ultra in Cyberpunk ~70 fps native, 90+ with FSR 3.',
  },
  {
    priority: 88,
    match: /\b(rtx ?308[05]|rtx 30[5-9]\d|gtx ?16\d\d|gpu comparison)\b/i,
    reply: 'Rough GPU tier as of 2026:\n- **Flagship:** RTX 4090 / 4080 Super / RX 7900 XTX\n- **High 1440p-4K:** RTX 4070 Ti Super / 4070 Super / RX 7900 XT\n- **1440p:** RTX 4070 / RX 7800 XT / RTX 4060 Ti 16GB\n- **1080p:** RTX 4060 / RX 7600 / RTX 3060 / GTX 1660 Super\n- **Budget:** GTX 1650 / RX 6400\nTell me the game + resolution you target and I can point at the right tier.',
  },
  {
    priority: 85,
    match: /\b(nvidia vs amd|amd vs nvidia|which brand gpu|nvidia or amd)\b/i,
    reply: 'Short version: **NVIDIA** wins on ray tracing, DLSS, and AI workloads. **AMD** gives more VRAM for the money and better Linux drivers. For pure 4K raster, a 7900 XTX matches a 4080 Super cheaper. For RT-heavy games (Cyberpunk, Alan Wake 2) or if you stream with NVENC, NVIDIA pulls ahead. FSR 3 has closed a lot of the DLSS gap but NVIDIA still leads on image quality.',
  },

  // ──────── CPU comparisons ────────
  {
    priority: 95,
    match: /\b(ryzen (?:7 )?7800x3d|7800x3d)\b/i,
    reply: 'The Ryzen 7 7800X3D is THE gaming CPU right now — 3D V-Cache gives it a huge edge in CPU-bound titles (MS Flight Sim, Factorio, MMOs). Often 10-20% faster than a 14700K in gaming at 1080p while pulling half the power (~90W peak). Weaker than 14700K for productivity / rendering because of fewer cores. If you game first, this is the pick.',
  },
  {
    priority: 94,
    match: /\b(core i9|i9 ?1[34]900|14900k?f?|13900k?f?)\b/i,
    reply: 'Core i9 14900K / 14900KF: 24 cores (8P+16E), best-in-class multi-threaded productivity. Runs hot — needs a 360mm AIO, and pulls 250W+ under all-core load. For gaming, a 7800X3D usually beats it; for rendering/encoding/compilation, the i9 wins. "KF" means no integrated graphics (£20 cheaper, needs a discrete GPU).',
  },
  {
    priority: 93,
    match: /\b(core i7|i7 ?1[34]700|14700k?f?|13700k?f?)\b/i,
    reply: 'Core i7 14700K: 20 cores (8P+12E), 25% more E-cores than the 13700K. Great all-rounder — within 5% of the i9 in gaming, within 15% in productivity, runs cooler (~200W peak). Pair with 32GB DDR5-6000, a 280mm AIO, and a Z790 board. Sweet spot for a £1200-£1800 build.',
  },
  {
    priority: 92,
    match: /\b(ryzen (?:7 )?7700x?|7700x)\b/i,
    reply: 'Ryzen 7 7700 / 7700X: 8 cores, 16 threads, ~105W. Excellent mid-range gaming + work CPU, slightly cheaper than the 7800X3D but 10-15% behind in CPU-bound games. Needs AM5 motherboard (B650/B650E/X670) and DDR5. Runs cool (~80°C peak under Noctua NH-U12A).',
  },
  {
    priority: 91,
    match: /\b(core i5|i5 ?1[234]600|14600k?|13600k?)\b/i,
    reply: 'Core i5 14600K: 14 cores (6P+8E), best budget gaming CPU under £300. Within 10% of a 14700K in games, 70% of the i9 in multi-thread. Pair with 32GB DDR5-6000, a 240mm AIO or a Noctua NH-D15, and a B760 or Z790 board. Great for £900-£1400 builds.',
  },
  {
    priority: 90,
    match: /\b(ryzen (?:5 )?7600x?|7600x|ryzen 5 5600)\b/i,
    reply: 'Ryzen 5 7600 / 7600X: 6 cores, 12 threads, entry-AM5. Excellent 1080p/1440p gaming chip, pairs well with RTX 4060 Ti or RX 7700 XT. DDR5 support means an easy upgrade path to a 7800X3D or Zen 5 later. 65W base, quiet and cool.',
  },
  {
    priority: 85,
    match: /\b(intel vs amd|amd vs intel|which cpu|cpu comparison|which brand cpu)\b/i,
    reply: 'Short version for late 2026:\n- **Pure gaming:** Ryzen 7 7800X3D > Core i7 14700K > Ryzen 5 7600X > Core i5 14600K\n- **Productivity / rendering:** Core i9 14900K > Ryzen 9 7950X > Core i7 14700K > Ryzen 7 7700X\n- **Power efficiency:** AMD wins across the board\n- **Upgrade path:** AMD AM5 is good through at least Zen 6; Intel LGA1700 is end-of-life\nTell me what you\'ll mostly do and I\'ll narrow it.',
  },

  // ──────── RAM ────────
  {
    priority: 90,
    match: /\b(ddr4 vs ddr5|ddr5 vs ddr4|which ram|ram speed|how much ram|16gb vs 32gb|32gb vs 64gb)\b/i,
    reply: `Quick RAM guide:\n- **Capacity:** 16GB covers office + light gaming. 32GB is the 2026 sweet spot for gaming + multitasking. 64GB only for video editing, 3D rendering, local LLMs, or heavy VMs.\n- **DDR4 vs DDR5:** DDR4 is end-of-life — cheaper now, but 0 upgrade path. DDR5 is standard on AM5 and Intel 12th gen+. DDR5-6000 CL30 is the AMD X3D sweet spot; DDR5-7200 CL34 for Intel.\n- **Dual vs quad channel:** Always install RAM as a matched dual kit. Mixing single sticks drops bandwidth ~40%.\n- **RGB:** Purely cosmetic, zero performance impact.`,
  },

  // ──────── Storage ────────
  {
    priority: 90,
    match: /\b(ssd vs hdd|nvme vs sata|which ssd|storage speed|m\.?2|gen4 ssd|pcie 4)\b/i,
    reply: `Storage quick guide:\n- **NVMe PCIe 4.0** is the 2026 default — 7000 MB/s read, 7x faster than SATA SSD. Great for OS + games.\n- **SATA SSD** is fine as secondary bulk storage — 550 MB/s, cheaper per GB.\n- **HDD** only makes sense for >4TB archive (cheap £/GB).\n- **Capacity to target:** 1TB NVMe minimum for any modern build, 2TB recommended (modern games are 100-200GB each). PCIe 5.0 exists but runs hot and isn\'t meaningfully faster for gaming.\n- **Reliable brands:** Samsung 990 Pro, WD Black SN850X, Crucial T500, Kingston KC3000.`,
  },

  // ──────── Monitors ────────
  {
    priority: 95,
    match: /\b(which monitor|best monitor|monitor recommend|refresh rate|120hz vs|144hz|240hz|oled vs|va vs ips|which panel)\b/i,
    reply: `Monitor quick guide:\n- **Panel:** IPS for colour + viewing angles (office + gaming). VA for contrast + blacks (movies). OLED for perfect blacks + instant response (premium gaming). TN is dead unless you\'re an esports pro on a budget.\n- **Refresh rate:** 120-144Hz is the 2026 baseline for gaming. 240Hz makes sense for competitive FPS. 360-500Hz is overkill unless you\'re a pro.\n- **Resolution:** 1080p@240Hz = esports. 1440p@144Hz+ = best balance. 4K@144Hz = premium, needs a serious GPU. Ultrawide 34" 1440p@165Hz is the productivity pick.\n- **HDR:** Only matters at HDR600+ (most cheap "HDR400" panels add nothing).\n- **G-Sync / FreeSync:** Both work with both brands now ("G-Sync Compatible" is just FreeSync with validation).\nBrowse /shop/monitors — full specs + real panel measurements per listing.`,
  },

  // ──────── Projectors ────────
  {
    priority: 90,
    match: /\b(projector|lumens|throw distance|home cinema|home theatre|ansi lumens)\b/i,
    reply: 'Projector quick guide:\n- **Lumens** is brightness. 2000+ for a dim living room, 3000+ for partial daylight, 4000+ for a bright room.\n- **Native 4K** projectors (JVC, Sony, Epson LS-series) cost £3K+. Pixel-shift "4K" (most sub-£2K) is 1080p shifted twice per frame.\n- **Throw ratio** matters a LOT: ultra-short-throw (UST) needs only 15cm for 100". Standard throw wants 3-4m for the same size.\n- **HDR** on projectors is nothing like HDR on OLED — they don\'t get bright enough. Don\'t pay extra for it.\n- **Lamp vs laser:** laser phosphor lasts 20,000+ hours. Lamp is 3000-4000 hrs and ~£150 to replace.\nBrowse /shop/projectors — we stock Epson, BenQ, Optoma, and JVC.',
  },

  // ──────── Networking ────────
  {
    priority: 90,
    match: /\b(wifi ?6|wifi ?6e|wifi ?7|802\.?11|router|access point|mesh wifi|ethernet|gigabit|multi ?gig|network switch)\b/i,
    reply: 'Networking quick guide:\n- **Wi-Fi 6 (ax)** is enough for 99% of UK homes — 1-1.5 Gbps throughput.\n- **Wi-Fi 6E** adds the 6GHz band, useful only if you\'ve got neighbours saturating 2.4/5GHz.\n- **Wi-Fi 7 (be)** adds MLO and 320MHz channels — real-world 2-3x 6E, but client devices need to support it. Overkill today unless you\'re future-proofing.\n- **Mesh** matters more than the standard — a two-node Wi-Fi 6 mesh beats a single Wi-Fi 7 router in most houses.\n- **Wired:** 2.5GbE is now standard on prosumer kit. Run Cat6a cable if you\'re pulling new runs.\n- We stock Ubiquiti UniFi, Netgear Nighthawk, Cisco enterprise gear — browse /shop/network-equipment.',
  },

  // ──────── Cooling / PSU / Case ────────
  {
    priority: 85,
    match: /\b(aio|liquid cool|air cool|cpu cooler|noctua|arctic|corsair cooler|psu|power supply|wattage|what size psu)\b/i,
    reply: 'Cooling + PSU rule of thumb:\n- **Cooling:** air coolers (Noctua NH-D15, Thermalright Peerless Assassin 120) handle everything up to a 14700K without issue. AIOs (240/280/360mm) look cleaner and are quieter on i9 / 13900K class chips. 120mm AIOs are pointless.\n- **PSU wattage:** add CPU TDP + GPU TGP + 150W headroom. Example: 7700X (105W) + RTX 4070 (200W) = 455W → 650W PSU. i9 + 4090? 1000W+. Always 80+ Gold minimum; stick to Corsair RMx, Seasonic Focus/Prime, or be quiet! Pure Power 12M.\n- **Cables:** fully modular is worth £20 extra for cleaner builds.',
  },

  // ──────── Generic question about spec comparison ────────
  {
    priority: 50,
    match: /\b(compare|difference between|vs\.?|better than|faster than)\b.*\b(gpu|cpu|ram|ssd|monitor)\b/i,
    reply: 'Tell me the exact two parts you want compared (e.g. "RTX 4070 vs RTX 4070 Super") and I\'ll break down performance, price, power draw, and what kind of build each fits. Or share what you\'ll mainly use the machine for and I\'ll pick the right tier.',
  },

  // ──────── Delivery / shipping ────────
  {
    priority: 80,
    match: /\b(delivery|shipping|post|courier|arrive|when will (?:my|the|it)|how long.*(?:deliver|ship|arrive)|dispatch)\b/i,
    reply: 'UK mainland orders placed before 3pm ship same day for next-working-day delivery (£0 on orders £50+). Highlands and Islands: 2 working days. EU: 3-5 working days from £29. International: quoted at checkout. Tracking arrives by email and SMS the moment your parcel leaves the hub.',
  },

  // ──────── Returns / refund ────────
  {
    priority: 80,
    match: /\b(return(?:s|ing)?|refund|send it back|cancel my order|change(?:d)? my mind|rma)\b/i,
    reply: 'You have 30 days from delivery for a no-questions return under UK Consumer Contracts Regulations. Beyond that, our 12-month warranty covers hardware faults. Start a return at /returns/new — we arrange courier collection, diagnose inside 48 hours, and refund within 5 working days end to end.',
  },

  // ──────── Warranty / faulty / broken ────────
  {
    priority: 82,
    match: /\b(warranty|guarantee|broken|faulty|stopped working|won'?t (?:turn on|boot|start)|dead on arrival|doa|not working)\b/i,
    reply: 'Every Birmingham AV machine is covered by a 12-month parts + labour warranty. If it\'s within 30 days, treat it as a normal return (full refund). Past that, raise a warranty claim — we courier both ways, diagnose in 48 hours, and repair or replace. Extended warranty to 24 months is £29 at checkout. If you need to raise a claim now, start at /returns/new and select "hardware fault".',
  },

  // ──────── Order status ────────
  {
    priority: 78,
    match: /\b(order (?:status|number|update)|track (?:my|the|this) order|where is my|my order|has my order)\b/i,
    reply: 'Sign in and visit /orders — you\'ll see live status (paid → queued → in build → QC → shipped → delivered), the exact builder assigned, and a tracking link once it ships. If you have the order number (BAV-XXXXXX-XXXXXX) share it and I can look it up.',
  },

  // ──────── Condition grades ────────
  {
    priority: 75,
    match: /\b(condition|grade|refurbished|like new|used|quality|tested|dead pixel|scuff|scratches)\b/i,
    reply: 'Our condition grades: **New** (sealed), **Like New** (indistinguishable from new, full warranty), **Excellent** (minor cosmetic marks), **Very Good** (visible wear, fully working), **Good** (noticeable marks, fully working), **Used** (honest second-hand, tested). All grades pass our 7-stage QC: POST, burn-in, thermal stress, memtest, GPU stress, disk read/write, peripherals. Warranty is 12 months on every grade — only cosmetic variation changes the price.',
  },

  // ──────── Builders ────────
  {
    priority: 75,
    match: /\b(builder|who (?:built|is making|makes)|hand.?built|assembled by|technician|who will build)\b/i,
    reply: 'Every machine is hand-built by one of 22 in-house builders — their name goes on the warranty card. Browse /builders to see the full roster with live quality scores, RMA rates, wait times, and queue depths. You can request a specific builder at checkout (think of it like picking your barber). Top-rated builders have longer waits; newer builders ship faster.',
  },

  // ──────── Upgrades / customisation ────────
  {
    priority: 75,
    match: /\b(upgrade|add more ram|add (?:an? )?ssd|change cpu|mod|customise|customize|bigger (?:psu|power)|watercool)\b/i,
    reply: 'Most machines can be spec\'d up post-purchase — RAM, storage, GPU, cooler, even the PSU. We quote parts + fitting inside one working day and most upgrades turn around in 3 working days at one of the Birmingham hubs. Email support@birmingham-av.com with your order number and what you want, or ask me once you have an order number and I\'ll raise it for you.',
  },

  // ──────── Payment / finance ────────
  {
    priority: 70,
    match: /\b(pay|payment|card|stripe|paypal|klarna|apple pay|google pay|finance|split payment|instalment)\b/i,
    reply: 'We accept all major cards (Visa/Mastercard/Amex), PayPal, and Klarna on orders over £100 (split across 3 interest-free payments). We never store your card — Stripe handles everything. Apple Pay and Google Pay work on supported devices at checkout.',
  },

  // ──────── Gaming generic ────────
  {
    priority: 65,
    match: /\b(gaming|fortnite|valorant|warzone|cod|call of duty|minecraft|elden ring|cyberpunk|fps|frame rate|benchmark|3dmark)\b/i,
    reply: 'Every gaming rig on our site lists real frame rates per game at 1080p and 1440p, plus Geekbench, Cinebench, and 3DMark Time Spy numbers. Browse /shop/gaming-pc-bundles — filter by RTX 4060/4070/4080 or RX 7700/7800/7900 to match your target. Want me to recommend a rig? Tell me the game, target resolution, and budget.',
  },

  // ──────── Discount / voucher ────────
  {
    priority: 60,
    match: /\b(discount|deal|voucher|promo ?code|cheaper|price match|bundle price|student discount|blue light)\b/i,
    reply: 'Use **WELCOME10** for 10% off your first order over £50. Bundle pricing on peripheral packs (monitor + keyboard + mouse) drops automatically at checkout. We also honour NHS Blue Light Card and student discounts — email trade@birmingham-av.com with a photo of your card and we\'ll issue a one-off code.',
  },

  // ──────── Trade / B2B ────────
  {
    priority: 68,
    match: /\b(trade|b2b|bulk|volume|quote|business|school|office|charity|procurement|nhs|govt|government|purchase order|po\b)\b/i,
    reply: 'We run a dedicated trade programme for businesses, schools, charities, and public sector. Volume pricing from 5 units, net-30 payment terms after two paid orders, and dedicated account manager from 20 units/month. Email trade@birmingham-av.com with rough volume, timeline, and budget and we\'ll quote inside one working day.',
    escalate: true,
  },

  // ──────── ACTUAL human escalation triggers — narrower than before ────────
  {
    priority: 150,
    match: /\b(refund over|large refund|legal action|lawyer|sue|ombudsman|trading standards|citizens advice|court|trustpilot|manager|complaint)\b/i,
    reply: 'Understood — I\'m raising this with the team right now. A human will follow up inside working hours at the email on your account. If it\'s urgent, call 0121 XXX XXXX or email support@birmingham-av.com directly.',
    escalate: true,
  },
  {
    priority: 145,
    match: /\b(smoke|burning smell|fire|sparks|electric shock|shocked me|scared)\b/i,
    reply: 'Stop using the machine and unplug it at the wall immediately. I\'m alerting our team now — a hardware specialist will call or email you as a priority. Never open or try to operate a unit that\'s smoked or sparked.',
    escalate: true,
  },

  // ──────── Generic "speak to human" ────────
  {
    priority: 50,
    match: /\b(human|real person|speak to (?:someone|a person|staff)|is this a bot|am i talking to)\b/i,
    reply: 'Yep — I\'m an AI assistant trained on Birmingham AV\'s catalogue, specs, and policies. I can answer 90% of questions right here. If you\'d rather chat to a human, say so and I\'ll raise a ticket — the team typically reply within two hours during UK working hours.',
  },
];
