---
title: Buying Guides — What Should I Actually Get
category: buying-guides
updated: 2026-04-19
tags: [gaming-pc, workstation, laptop, business-pc, refurbished, build-vs-buy, monitor-setup]
---

This file answers the question customers actually ask: "I have £X, for Y use case — what do I get?" Every recommendation below is a spec shape, not a fixed product list. The live catalogue has the current pricing and stock; this file gives the chat the framework for matching a question to a sensible answer.

## Gaming PC by budget

Gaming is the single biggest category in the catalogue. Budget sets the resolution ceiling, the refresh-rate target, and how long the machine stays current before it needs a GPU upgrade.

### £800 — entry 1080p

The floor. Targets 1080p 60–144fps on medium-to-high settings in current AAA games.

- **GPU:** RTX 5060 (8GB) or RX 7700 XT refurbished. The 5060 is the safer default for drivers and DLSS support.
- **CPU:** Ryzen 5 9600X or Core Ultra 5 225F. Six cores is enough for 1080p gaming.
- **RAM:** 16GB DDR5-6000 CL30. Two sticks, not four.
- **Storage:** 1TB PCIe 4.0 NVMe. No secondary drive at this tier.
- **PSU:** 650W Gold semi-modular.
- **Case:** Mesh-front mid-tower.
- **Cooling:** Tower air cooler — Peerless Assassin 120 SE or equivalent.

Where the money goes: GPU (40%), CPU (15%), motherboard + RAM + storage (25%), case + PSU + cooling (20%).

### £1,500 — 1440p sweet spot

The most popular build tier at BAV. Targets 1440p 144fps high-settings in current games, 4K 60fps in older or less demanding titles.

- **GPU:** RTX 5070 (12GB) or RX 9070. The 5070 is the default for DLSS 4; the 9070 has slightly more raster for the money.
- **CPU:** Ryzen 7 9700X or 7800X3D (refurbished). The 7800X3D beats the 9700X in games; the 9700X beats it outside games.
- **RAM:** 32GB DDR5-6000 CL30.
- **Storage:** 2TB PCIe 4.0 NVMe primary. Optional 2TB secondary.
- **PSU:** 750W Gold modular.
- **Case:** Mid-tower with glass side and dust filters.
- **Cooling:** 240mm AIO or high-end air (Noctua NH-U12A, Dark Rock Pro 5).

This tier is where builds start to feel cohesive. The GPU matches the CPU, the cooling matches the CPU, and the PSU has headroom for a future GPU upgrade.

### £2,500 — high-refresh 1440p or entry 4K

Targets 1440p 240fps or 4K 100–144fps with DLSS on. The tier where OLED monitors start to make sense.

- **GPU:** RTX 5070 Ti or RTX 5080. The Ti is the better price-per-frame; the 5080 is the step up for 4K.
- **CPU:** Ryzen 7 9800X3D. Currently the gaming CPU of the generation.
- **RAM:** 32GB DDR5-6000 CL30 (64GB if any video or ML work is planned).
- **Storage:** 2TB PCIe 5.0 NVMe primary, 4TB PCIe 4.0 secondary.
- **PSU:** 850W Gold modular, ATX 3.1.
- **Case:** Premium mid-tower (Fractal Torrent, Lian Li Lancool III, be quiet! Pure Base 501).
- **Cooling:** 360mm AIO (Arctic Liquid Freezer III, Corsair iCUE Link H150i) or dual-tower air for silence.

### £5,000+ — 4K everything / workstation gaming

4K 120Hz path-traced gaming, 8K where content supports it, serious productivity alongside games.

- **GPU:** RTX 5090 (32GB). The only GPU at this tier for gaming; a 4090 refurbished is the alternative for ML priorities.
- **CPU:** Ryzen 9 9950X3D. 16 cores with X3D for games and productivity.
- **RAM:** 64GB DDR5-6000 CL30. 128GB for creators with heavy timelines.
- **Storage:** 4TB PCIe 5.0 NVMe primary, 8TB PCIe 4.0 secondary.
- **PSU:** 1200W Platinum modular, ATX 3.1.
- **Case:** Full-tower or premium mid-tower with excellent airflow. E-ATX support useful for some boards.
- **Cooling:** 420mm AIO or a serious dual-tower air cooler. Custom loop on request.

At this tier, match the monitor to the GPU: a 5090 paired with a 1440p monitor is money left on the table. 4K 240Hz OLED or 4K 160Hz mini-LED is the intended pairing.

## Workstation PC by use case

Workstations are defined by the workload, not the budget. A £6,000 video-editing workstation and a £6,000 CAD workstation have different components from different vendors.

### Video editing (Premiere, DaVinci Resolve, Final Cut)

- **GPU:** RTX 5080 minimum for most work; RTX 5090 if timelines include heavy colour grading or 8K. For Resolve specifically, VRAM matters more than raw speed — the 5090's 32GB pays off.
- **CPU:** Ryzen 9 9950X or 9950X3D for multi-core export; Threadripper Pro 7000/9000 for large productions with multi-stream capture.
- **RAM:** 64GB minimum, 128GB for heavy timelines.
- **Storage:** Fast primary (NVMe PCIe 4 or 5) for cache, scratch, and current projects. Large secondary (SATA SSD or enterprise HDD) for media libraries. Three-drive setup is typical.
- **Display:** 4K 27"–32" IPS or mini-LED, factory-calibrated to Rec. 709 or DCI-P3. Ideally a reference monitor (Flanders, Eizo CG series) if grading is commercial.
- **Network:** 10GbE to the NAS where there is one.

### CAD and 3D (SolidWorks, AutoCAD, Revit, Rhino)

- **GPU:** The case for a workstation GPU (RTX Pro 4500 / 5000 / RTX Pro 6000) over a consumer card is strongest here — certified drivers, ISV support, better viewport performance in complex assemblies. Consumer cards work but may show visual artifacts in CAD software they're not certified for.
- **CPU:** Fast single-thread wins in CAD. 9800X3D or 9950X3D are the right picks — same silicon as gaming builds.
- **RAM:** 64GB minimum, 128GB for large assemblies.
- **Storage:** NVMe primary, secondary for reference libraries.
- **Display:** 4K 27"+ IPS with good colour accuracy. Dual-monitor setups are standard in this field.

### 3D rendering (Blender, Maya, 3ds Max, Houdini)

- **GPU:** Multiple GPUs scale linearly in Cycles, Redshift, Octane, Arnold GPU. Two 4090s or one 5090 plus an older card for secondary rendering is common.
- **CPU:** High core count for CPU renderers (V-Ray CPU, Arnold CPU, Corona). Threadripper Pro for serious work; 9950X for mid-range.
- **RAM:** 64GB minimum. 128GB for scenes with heavy texture sets.
- **Storage:** Fast primary, large asset library storage.
- **Display:** Colour-accurate, but less critical than in compositing — you calibrate against the final output.

### Machine learning and LLM work

- **GPU:** VRAM is the single most important spec. 24GB (4090) runs 13B parameter models quantised. 32GB (5090) runs 30B quantised or 13B unquantised. 96GB (RTX Pro 6000 Blackwell) runs 70B+ in a single card. Dual 5090s are a common compromise — 64GB split across two cards handles most production work.
- **CPU:** Threadripper Pro or 9950X. PCIe lanes matter if running multiple GPUs.
- **RAM:** Match or exceed total GPU VRAM for dataset staging — 128GB for a 32GB GPU, 256GB for a multi-GPU setup.
- **Storage:** Fast NVMe for datasets, large secondary for checkpoint storage.
- **PSU:** Size for the GPUs — 1200W for one 5090, 1600W for two.
- **Cooling:** Blower-style GPUs for multi-GPU setups (airflow into the case quickly saturates with open-air coolers stacked).

## Office and business PC

Business machines are bought in volume, on warranty, with longevity in mind. Specification at this tier is about avoiding regret in year three.

### Baseline office PC (£500–£800)

- **CPU:** Ryzen 5 8600G or Core Ultra 5 225 with iGPU. No dedicated GPU needed for office work.
- **RAM:** 16GB DDR5. 32GB if the user runs Excel workbooks with 100k+ rows or multiple browser tabs heavily.
- **Storage:** 500GB–1TB NVMe. Single drive fine at this tier.
- **Chassis:** Small form factor or SFF desktop. HP EliteDesk, Dell OptiPlex, Lenovo ThinkCentre — these are the three safe bets for business procurement.
- **Warranty:** 36-month next-business-day on-site is worth the supplement for business-critical machines.

### Content-creator's laptop (£1,200–£2,500)

- **CPU:** AMD Ryzen AI 9 HX 370 or Intel Core Ultra 9 285H. The AI-capable variants matter if any work touches on-device ML.
- **GPU:** RTX 5060 mobile (45–75W TGP) at the low end, RTX 5080 mobile (140W+) at the top.
- **RAM:** 32GB soldered or 32GB SO-DIMM. LPDDR5X-7500 is the current spec.
- **Storage:** 1TB PCIe 4.0 NVMe minimum.
- **Display:** 14" or 16" OLED 3K 120Hz, or 16" mini-LED.
- **Battery:** 70Wh+ for an eight-hour day of mixed work.

### First gaming laptop (£1,000–£1,800)

The gaming laptop market is a minefield — thin-and-light designs often throttle, chunky designs sacrifice portability. At BAV we steer first-time buyers to the 15–16" category as the sensible shape.

- **CPU:** Ryzen 7 9700H or Core Ultra 7 255H. Eight cores with the right thermal envelope.
- **GPU:** RTX 5060 mobile (100W+ TGP) minimum. RTX 5070 mobile for 1440p gaming.
- **RAM:** 16GB SO-DIMM minimum, 32GB preferable.
- **Storage:** 1TB NVMe.
- **Display:** 15.6"–16" 1440p 165Hz IPS or OLED. 1080p panels are fine for an esports-first buyer; 1440p is the balanced choice.
- **Cooling capacity:** Check reviews specifically for thermals under sustained load. A 140W RTX 5070 mobile in a chassis that can't cool it is slower than a 100W one in a chassis that can.

## Refurbished laptop for university

A well-built recommendation; easily the best value in the catalogue.

- **Target:** ThinkPad T14 / T14s / X1 Carbon (2022–2024), Dell Latitude 7440/7450, HP EliteBook 840 G10/G11. Ex-corporate fleet leases, refurbished on the bench.
- **CPU:** Core i5-1340P or 1345U, or AMD Ryzen 5 Pro 7540U. Plenty for essay-writing, browsing, video calls, and most non-gaming student work.
- **RAM:** 16GB minimum, 32GB if budget permits.
- **Storage:** 512GB NVMe minimum.
- **Display:** 14" FHD IPS. Touchscreen variants sometimes work out cheaper but drain battery faster.
- **Battery:** Replaced under our process if below 85% design capacity. Customers should expect 7–9 hours on a refurbished ThinkPad battery.
- **Warranty:** 12-month as standard.

A £450 refurbished T14 with 16GB and a new battery is a better buy than a £600 new budget laptop in almost every respect — proper keyboard, full-metal chassis, accessible repair, and parts availability for five more years minimum.

## Build your own vs buy pre-built

### When building wins

- You have a specific component preference (case aesthetic, specific cooler, unusual GPU choice).
- You value the learning and the process.
- You already have parts you want to reuse (case, monitor, peripherals).
- You want something unusual — an ITX build in a specific case, a two-GPU ML rig, a custom loop.

### When buying pre-built wins

- You want it working this week, with warranty on the whole machine rather than on individual parts.
- You're not interested in parts compatibility research or troubleshooting first-boot issues.
- You want the build done by someone who has done it 500 times and knows which BIOS versions work with which RAM kits on which boards.
- You want the machine to be covered as one unit under AV Care, not a collection of part warranties.

The pre-built premium at BAV is typically £100–£250 on a mid-range build, which covers labour, burn-in, Windows install and activation, driver setup, and warranty on the whole machine. That's the equivalent of a couple of days' work for someone doing it themselves, and the warranty side is genuinely valuable — when one component fails in a DIY build you sort the RMA; when it happens in a BAV build we sort it.

## Upgrading an existing machine vs buying new

The right answer depends on the age of the platform and what's bottlenecking the experience.

### Worth upgrading

- **GPU on a 3–5 year old build.** A 2021 machine with a Ryzen 5 5600X or Core i5-11600K still pairs usefully with an RTX 5070. Gains are real and the labour is straightforward.
- **RAM and SSD.** On almost any platform going back ten years, doubling RAM or adding an NVMe drive is cheap and visible. 8GB to 16GB is the biggest single quality-of-life uplift for an older machine; a SATA SSD swap to NVMe is the second.
- **Monitor.** A 2019 build still runs perfectly well with a 2026 monitor. Display upgrades never "expire" with the rest of the machine.

### Not worth upgrading

- **CPU on a 6+ year old platform.** An Intel 8th gen or AMD first-gen Ryzen system needs a new motherboard, new RAM, and new CPU to move forward — at which point you're building a new machine and salvaging case, PSU, and GPU.
- **Motherboards just for features.** If the board POSTs and runs your RAM at XMP, the case for swapping it alone is weak.
- **PSUs below 10 years old that test clean.** Unless you're moving to a 5080/5090 that needs more wattage and ATX 3.1, a good Gold PSU from 2018 is still fine.

### The £150 rule

If the upgrade (parts + labour) costs more than 40% of the value of the finished machine in its current state, replacement usually wins. Past that line, the money is better spent on a complete build that gives you a fresh 12-month warranty on everything rather than on the one new component.

### When to trade in

The trade-in value of an older machine often covers 25–40% of a mid-range replacement. Calculate both: parts for an in-place upgrade, versus the trade-in value against a new build on the configurator. We're happy to quote both paths from the chat.

## Dual monitor vs ultrawide

A question that comes up almost daily in chat.

### Two monitors wins when

- You work across two applications that each want full-screen attention (a trading terminal plus a browser; code plus a browser; reference document plus writing).
- You want different refresh rates for different contexts (a 144Hz gaming monitor plus a 60Hz reference display).
- You want to physically separate work by monitor — emails on the left, active task on the right.
- You want to keep the option to rotate one to portrait for reading.

### Ultrawide wins when

- You work in a single application that uses the width — video editing timelines, DAW tracks, spreadsheets with many columns, sim racing, strategy games.
- You find the bezel between monitors visually distracting.
- You value the single-cable tidiness of one display.
- You already have good window-management habits and don't need the "natural" boundary between screens.

Super-ultrawide (32:9) combines the productivity argument with the immersive-gaming argument, at the cost of desk space and the awareness that some applications still don't handle the aspect ratio well. The right pick for a small set of users with the right use case; the wrong default for most people.
