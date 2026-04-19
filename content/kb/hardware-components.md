---
title: Hardware Components — The Full Reference
category: hardware
updated: 2026-04-19
tags: [gpu, cpu, motherboard, ram, storage, psu, cooling, cases]
---

This is the component reference the bench works from. It covers what each component does, where the current generations sit, what to look for when buying, and the compatibility traps that catch people out. Prices here are never fixed — when a specific part is mentioned, the live catalogue has the current figure.

## Graphics cards

The graphics card is the single biggest variable in a gaming or workstation build. It sets your resolution ceiling, your frame rate, your VRAM for content and ML work, and roughly half your power budget.

### NVIDIA RTX 50 series (Blackwell)

The current consumer generation. Released early 2025, built on TSMC 4NP. GDDR7 memory across the stack, PCIe 5.0, DisplayPort 2.1b, fifth-generation Tensor cores, fourth-generation RT cores, and DLSS 4 with Multi Frame Generation.

- **RTX 5090** — 32GB GDDR7, 575W TDP, 12VHPWR connector, two-slot Founders Edition. The card for 4K maxed-out, 8K where titles support it, and local LLM work up to roughly 30B parameters quantised. Runs hot under sustained load — case airflow matters more than with any previous card.
- **RTX 5080** — 16GB GDDR7, 360W. Comfortable 4K gaming at 120Hz+ with DLSS on, 1440p native at high refresh. 16GB is tight for ML but fine for games through this generation.
- **RTX 5070 Ti** — 16GB GDDR7, 300W. The sweet spot in the stack for 1440p high-refresh and entry 4K. Effectively last-generation RTX 4080 performance at meaningfully lower power.
- **RTX 5070** — 12GB GDDR7, 250W. 1440p targeting card. 12GB is the floor we'd accept in 2026 for new builds.
- **RTX 5060 Ti** — 8GB or 16GB GDDR7, 180W. The 16GB variant is the one to buy; 8GB is already marginal at 1440p in current titles.
- **RTX 5060** — 8GB GDDR7, 150W. 1080p card. Workable for esports and older titles; struggles in recent AAA at high settings.

### NVIDIA RTX 40 series (Ada Lovelace)

Still heavily in the market, particularly refurbished. Ampere-era DLSS 3 (Frame Generation) is supported; DLSS 4 Multi Frame Gen is not.

- **RTX 4090** — 24GB GDDR6X. Still a very capable 4K card and the highest-VRAM NVIDIA consumer GPU short of the 5090. A well-cared-for refurbished 4090 with documented bench time is often a better buy than a new 5080 for ML work that needs the VRAM.
- **RTX 4080 Super / 4080** — 16GB GDDR6X. Superseded by the 5080 at similar performance and lower power, but frequently cheaper on the used market.
- **RTX 4070 Ti Super / 4070 Super / 4070** — 12–16GB, 200–285W. Solid 1440p cards; the Super variants are the ones to prefer.
- **RTX 4060 Ti / 4060** — 8–16GB. 1080p and light 1440p. The 8GB 4060 Ti is not one we recommend for new builds in 2026.

### RTX Pro 6000 Blackwell

The workstation card. 96GB GDDR7, ECC memory, blower-style cooler suited to multi-GPU rack builds. Priced as a workstation part, not a consumer one — typically four to five times a 5090. The right card for large-model ML training, 8K video work with heavy effects, and scientific compute. For almost any gaming workload, a 5090 is the better buy.

### AMD Radeon RX 9000 series (RDNA 4)

Launched 2025. AMD's current architecture. Strong rasterisation performance-per-pound, improved ray tracing over RDNA 3, FSR 4 support.

- **RX 9070 XT** — 16GB GDDR6, 304W. Competes with the RTX 5070 Ti in raster, slightly behind in ray tracing, usually ahead on price. 16GB VRAM is the headline spec.
- **RX 9070** — 16GB GDDR6, 220W. 1440p high-refresh card. Good value at its tier.

### AMD Radeon RX 7000 series (RDNA 3)

Still selling, particularly the 7900 XTX. 24GB VRAM on the XTX is the standout — more than any NVIDIA card until you reach the 4090 or 5090. Strong raster, weaker ray tracing than RTX 40/50 equivalents, older upscaling (FSR 3, no FSR 4).

### Intel Arc Battlemage

Intel's second-generation discrete GPUs. B580 (12GB GDDR6, 190W) and B570 (10GB GDDR6, 150W) launched late 2024 into 2025. Priced aggressively at the entry tier. XeSS upscaling, functional ray tracing, mature drivers by 2026. A reasonable option for 1080p-to-light-1440p builds on a budget; not a workstation or high-refresh pick.

### Upscaling and frame generation

Every modern GPU uses upscaling to hit target frame rates. The three systems don't interoperate — a game supports one, two, or all three, and the results vary.

- **DLSS 4 (NVIDIA, RTX 20 series and newer).** Transformer-based upscaling and Multi Frame Generation (RTX 50 only — up to 3× frame multiplication). Still the reference for image quality. DLSS 3 Frame Gen works on RTX 40, DLSS Super Resolution works on RTX 20 and newer.
- **FSR 4 (AMD, RX 9000 series).** AMD's machine-learning upscaler. Closed the gap to DLSS significantly at launch but supported in fewer titles. FSR 3 and FSR 2 continue to run on older cards and on NVIDIA / Intel hardware.
- **XeSS (Intel, any vendor).** Runs on Intel Arc with hardware acceleration and on other vendors in a slower shader-based fallback. Quality sits between FSR 3 and DLSS 3.

For cross-vendor answers: DLSS is better image quality and frame generation; FSR is more widely supported on older hardware; XeSS is the Intel-specific pick.

### Ray tracing — worth it or not?

At 4K with a 5080 or 5090, yes — DLSS 4 Multi Frame Gen offsets the cost enough to keep frame rates high. At 1440p with a 5070 Ti, selectively — path tracing is still a big hit. On anything RTX 4060 / RX 9070 or below, ray tracing is usually disabled or dropped to low. RDNA 3 and earlier AMD cards are weaker in ray tracing than NVIDIA equivalents; RDNA 4 narrowed the gap but hasn't closed it.

### What to look for when buying a GPU

1. **VRAM first.** In 2026, 8GB is the floor for 1080p and increasingly marginal; 12GB is the 1440p minimum; 16GB is where we'd start for 4K or any ML work.
2. **Power connector.** 12VHPWR (also called 12V-2x6 on later revisions) is on every RTX 40/50 card above the 4060. The connector requires a firm seat to the click — under-seating caused the early melting reports. We check seating on every refurbished card.
3. **Cooler design.** Two-slot coolers fit more cases; 3–4 slot coolers run quieter but need clearance. Blower-style coolers are louder but vent heat out the rear, which suits multi-GPU builds.
4. **Length.** Measure your case's GPU clearance. A 330mm Founders Edition 5090 fits plenty of mid-towers; a 360mm ASUS ROG or MSI Suprim may not.
5. **PSU wattage.** 5090 wants 1000W minimum; 5080 and 4090 want 850W+; 5070 Ti / 5070 want 750W+. See the PSU section for why oversizing pays.

## Processors

The CPU sets how responsive the machine feels, how quickly it encodes video, how fast it compiles code, and on AMD X3D parts, frame rates in CPU-bound games. Less of a dial than the GPU for pure gaming, but the one that makes or breaks a workstation.

### Intel Core Ultra 200 series (Arrow Lake-S)

LGA1851 socket, released late 2024. First desktop Intel generation with an on-die NPU, E-cores on a separate tile, no Hyper-Threading on the P-cores. Lower gaming performance than the 14th-gen Raptor Lake Refresh parts it replaced, but meaningfully lower power draw and temperatures.

- **Core Ultra 9 285K** — 24 cores (8P + 16E), 5.7GHz boost, 125W base / 250W turbo. Workstation-capable, solid multi-threaded, middling gaming compared to AMD X3D.
- **Core Ultra 7 265K** — 20 cores (8P + 12E), 5.5GHz boost. The sensible mainstream pick in this stack.
- **Core Ultra 5 245K** — 14 cores (6P + 8E), 5.2GHz boost. Entry K-SKU for the platform.

### AMD Ryzen 9000 series (Zen 5)

AM5 socket, released 2024. DDR5-only, PCIe 5.0, boost clocks up to 5.7GHz, improved IPC over Zen 4. AM5 is supported with socket longevity through 2027 minimum, meaning a 9000-series board will take the generation after this one.

- **Ryzen 9 9950X3D** — 16 cores, 5.7GHz boost, 170W, 144MB cache total. The halo part. 3D V-Cache on one CCD for gaming, full cores for work. Best-of-both for anyone who games *and* does heavy productivity.
- **Ryzen 9 9950X** — 16 cores, 5.7GHz, 170W. Non-X3D — pure productivity pick, faster than the 9950X3D outside games.
- **Ryzen 7 9800X3D** — 8 cores, 5.2GHz boost, 120W, 104MB cache. The gaming CPU of the generation. Slower in productivity than a 9900X, faster in games than anything that isn't a 9950X3D.
- **Ryzen 7 9700X** — 8 cores, 5.5GHz, 65W base (105W optional). Efficient and cool-running. Good for compact builds.
- **Ryzen 5 9600X** — 6 cores, 5.4GHz, 65W. Entry AM5. Fine for 1080p/1440p gaming.

### AMD Ryzen 7000 / 8000 series

Still in the catalogue. 7800X3D remains a strong gaming chip at a lower price than the 9800X3D. 7950X, 7900, 7700X, 7600 all work on the same AM5 boards and are sensible picks when the generation difference doesn't justify the 9000-series premium.

### AMD Ryzen Threadripper Pro (7000 / 9000 series)

sTR5 socket, WRX90 and TRX50 chipsets. 24 to 96 cores, eight-channel DDR5, up to 148 PCIe 5.0 lanes. For workstations with four GPUs, large multi-NVMe arrays, heavy 3D rendering, or video work with multi-stream capture. Overkill — genuinely — for anything that isn't primarily a production workstation.

### Intel Xeon W-3500 series

Sapphire Rapids architecture, LGA4677, up to 60 cores, eight-channel DDR5 ECC. Enterprise workstation chips. AMD Threadripper Pro has largely taken the market for new builds, but Xeon W remains in circulation for studios standardised on Intel platforms.

### Integrated graphics — when the CPU is the GPU

Every AM5 Ryzen has a basic iGPU (RDNA 2, two compute units) sufficient for desktop display output, video playback, and troubleshooting without a dedicated card. Every Core Ultra 200 has a stronger Xe-LPG iGPU usable for light gaming at 1080p low. Neither replaces a dedicated GPU for any real workload, but both mean a build can POST and run office work with no card fitted — useful when a customer's GPU has failed and they need to keep working. AMD's APU line (Ryzen 8700G, 8600G) has a much stronger iGPU (Radeon 780M) capable of 1080p medium in most games. We recommend APUs for small-office builds, kids' first PCs, and HTPCs.

### What to look for when buying a CPU

1. **Socket and chipset.** A 9950X3D needs AM5 with B650/B850/X670E/X870E. A 285K needs LGA1851 with Z890/B860. You cannot swap between them.
2. **Cooler compatibility.** Most AM4 coolers fit AM5. Some LGA1700 coolers fit LGA1851 but not all — check the brackets.
3. **Workload match.** Games? X3D. Video editing and rendering? More cores. Compiling? More cores and faster RAM. Office work? Any 6-core from the last three generations is fine.
4. **Power and thermals.** A 285K or 9950X3D under sustained multi-thread load needs a 280mm AIO minimum. A 9700X is happy on a decent air cooler.

## Motherboards

The board doesn't make things faster. It decides what fits, what lasts, and what updates cleanly. Spending more on a board rarely improves performance; spending less than the minimum causes real problems.

### Chipsets — what actually differs

On AM5: **A620** (budget, PCIe 4.0 only, often no overclocking), **B650 / B650E** (mainstream; B650E adds PCIe 5.0 to the GPU slot and M.2), **B850 / B850E** (2024 refresh, USB4 standard, better VRMs at the mid-tier), **X670E / X870E** (high-end, full PCIe 5.0, more lanes, better power delivery for 16-core parts).

On LGA1851: **H810** (entry), **B860** (mainstream), **Z890** (enthusiast — memory overclocking, CPU overclocking, more lanes).

### Form factors

- **E-ATX** — 305mm × 330mm. Workstation and HEDT boards. Requires a case that explicitly supports E-ATX.
- **ATX** — 305mm × 244mm. The standard. Fits almost every full-tower and mid-tower case.
- **Micro-ATX (mATX)** — 244mm × 244mm. Four RAM slots usually; fewer expansion slots.
- **Mini-ITX (ITX)** — 170mm × 170mm. Two RAM slots, one expansion slot. Compact builds only.

### What to look for

1. **VRM quality.** The voltage regulator modules power the CPU. Cheap boards with 6 or 8 under-rated phases will throttle or shut down a 16-core chip under sustained load. For 9950X3D / 285K class builds, prefer boards with 14+ proper phases.
2. **BIOS maturity.** Day-one BIOS versions are rarely the good one. We flash to the latest stable before shipping. If buying elsewhere, check the manufacturer's BIOS page and the date of the last release — boards that haven't seen an update in six months are either mature or abandoned, and it's worth knowing which.
3. **BIOS Flashback (or Q-Flash Plus, or USB BIOS Flashback).** A dedicated button on the rear I/O that lets you flash BIOS with nothing but a PSU and a USB stick — no CPU or RAM fitted. Essential on AM5 if buying a 9000-series chip for an older board; new motherboards on the shelf may still ship with BIOS that predates the CPU you're installing. Boards without this feature will not POST on an unsupported CPU, and you have to borrow an older CPU to update.
4. **M.2 slot count and speed.** Entry boards give you one PCIe 5.0 slot plus a couple of PCIe 4.0 slots. Prosumer boards give you two or three PCIe 5.0 slots.
5. **USB generation.** USB4 / Thunderbolt 4 is standard on B850 and Z890. Useful for external NVMe enclosures and high-refresh monitors over USB-C.

## RAM

### DDR4 vs DDR5

DDR5 is the only option on new AM5 and LGA1851 platforms. DDR4 persists on LGA1700 / AM4 refurbished builds. DDR5 is faster in bandwidth, has on-module power management and on-die ECC, and runs at lower voltage. CL (CAS latency) numbers look higher on DDR5 — that's normal; real latency in nanoseconds is similar or lower.

### Speeds that actually matter

- **AM5 (Ryzen 7000 / 9000):** 6000MT/s CL30 is the sweet spot. The memory controller (FCLK) runs 1:1 with memory at this speed. Faster kits (6400+) force 2:1 mode and give back any gains in latency. Exceptions exist, but 6000 CL30 is the default for a reason.
- **LGA1851 (Core Ultra 200):** 6400–7200MT/s CL32–36. Arrow Lake scales better with faster memory than AMD does.
- **LGA1700 (12th–14th gen):** DDR5 6000–7200, or DDR4 3600 CL16 on the boards that take DDR4.

### ECC vs non-ECC

ECC (error-correcting code) RAM catches single-bit memory errors and corrects them. Standard on servers and workstations; usually absent from consumer builds. AM5 consumer boards accept ECC UDIMMs but don't always enable correction — check the board's QVL. Threadripper Pro and Xeon W do ECC properly with RDIMMs. If the machine holds long-running simulations or financial data, it's worth the money. For games, it's not.

### Ranks, slots, and the four-stick trap

Two sticks in slots A2 and B2 (the second and fourth) is the fastest configuration on almost every board. Four-stick kits force the memory controller to work harder and often drop you a speed bin. If you need 128GB, a 2×64GB kit is preferable to 4×32GB — fewer ranks, higher stable speed. Check the kit is on the motherboard's QVL for AM5 in particular; the memory controller is picky.

### XMP, EXPO, and running at rated speed

Out of the box, DDR5 runs at its JEDEC base speed (usually 4800 or 5600MT/s) regardless of what's printed on the stick. The advertised 6000MT/s CL30 speed is a factory-tuned overclock profile stored on the module. To apply it, you enable **XMP** (Intel boards) or **EXPO** (AMD boards) in BIOS. Without this, a £200 premium kit runs at the same speed as a £90 stock kit. We enable the correct profile on every build before it ships. If a customer swaps RAM and doesn't re-enable, performance drops visibly in games and heavy productivity.

## Storage

### NVMe generations

- **PCIe 3.0** — up to ~3,500 MB/s. Older drives, mature, cheap. Still perfectly fine for games and general use.
- **PCIe 4.0** — up to ~7,500 MB/s. The sensible default for new builds. Samsung 990 Pro, WD Black SN850X, Crucial T500. Noticeably faster for large file moves and some game load times.
- **PCIe 5.0** — up to ~14,500 MB/s. Crucial T705, Corsair MP700 Pro, Samsung 9100 Pro. Run hotter — a heatsink is mandatory. Real-world gains over PCIe 4.0 are narrow unless you move huge files daily.

### SATA SSDs

2.5-inch drives, 550 MB/s ceiling, still useful as secondary drives or in older laptops that don't take NVMe. Samsung 870 EVO and Crucial MX500 are the reference picks.

### Enterprise HDDs

Large archival storage. Seagate Exos, WDC Ultrastar, Toshiba MG. Helium-filled, seven platters at 18–24TB, rated for 24/7 operation. CMR (conventional magnetic recording) for writes — avoid SMR drives for NAS or workstation use.

### Endurance — TBW

TBW (terabytes written) is the manufacturer's endurance rating. A 1TB Samsung 990 Pro is rated 600TBW; a 2TB is 1200TBW. For a gaming PC you will not approach this number. For a video editing workstation that ingests 500GB a day, it matters. Enterprise drives are rated in DWPD (drive writes per day) instead.

### DRAM vs DRAM-less

DRAM-cache drives (990 Pro, SN850X, T705) hold the mapping table in a dedicated RAM chip. DRAM-less drives (WD Blue SN580, Crucial P3 Plus) use host memory buffer (HMB) instead. DRAM-less is cheaper and fine for most workloads; DRAM drives hold up better under sustained writes.

### SLC cache and why large file copies slow down

Every consumer TLC or QLC NVMe uses a portion of its flash as a fast SLC cache. Writes within the cache size (typically 15–25% of free space) hit advertised speeds. Once the cache fills — on a 2TB drive, roughly 200–400GB into a sustained write — speeds drop to native TLC or QLC rates, which can be 1,500 MB/s for TLC and as low as 150 MB/s for QLC. For games and general use this never matters. For video editors writing 500GB of footage in one go, it does. Enterprise drives use pSLC or static cache that doesn't drop off the same way.

### Thermal throttling on NVMe

PCIe 5.0 drives idle at 45–55°C and hit 80°C+ under sustained writes without cooling. At 80°C the drive throttles. Every PCIe 5.0 NVMe needs a heatsink — usually supplied with the motherboard's M.2 shroud. PCIe 4.0 drives are cooler but still benefit from the motherboard heatsink; PCIe 3.0 drives rarely need one.

## Power supplies

The component that costs the most when it's bad and the least when it's right. We ship Seasonic, Corsair, be quiet!, and Super Flower as standard — and we'll refuse to sign off a high-end build on an unknown brand.

### 80 Plus ratings

Efficiency at typical load. Bronze (85%) / Gold (90%) / Platinum (92%) / Titanium (94%). Gold is the default in 2026. Platinum and Titanium matter for always-on workstations where electricity cost over three years covers the premium; otherwise they're vanity.

### ATX 3.1

The specification covering 12VHPWR connectors with improved tolerance (12V-2×6 pinout on the PSU side). Any new PSU bought for an RTX 40 or RTX 50 GPU should be ATX 3.1. Older ATX 3.0 units work but are less forgiving on connector tolerance.

### Wattage sizing

Rule of thumb: add up CPU TDP + GPU TDP + 150W overhead for drives, fans, USB, and peaks. Then add 25% headroom so the PSU runs at 60–70% load (peak efficiency, longer capacitor life).

- 9700X + RTX 5070: 65 + 250 + 150 = 465W. A 650W Gold is right.
- 9950X3D + RTX 5080: 170 + 360 + 150 = 680W. An 850W Gold is right.
- 9950X3D + RTX 5090: 170 + 575 + 150 = 895W. A 1000W Gold is the minimum; 1200W is the safer sizing.

### Modular

Fully modular means all cables are removable. Semi-modular means the ATX and EPS cables are fixed. Non-modular is everything fixed. Modular is worth the small premium — you ship cleaner builds and have fewer unused cables bunched in the case.

### What fails first on a cheap PSU

Electrolytic capacitors on the secondary side dry out, the 12V rail sags under transient load, and the over-current protection trips when a GPU spikes. The symptom at the customer's end: random reboots or shutdowns under gaming load, often blamed on the GPU. A proper Gold unit from Seasonic, Corsair RMx, or be quiet! Pure Power 12 M uses Japanese capacitors rated for 105°C and lasts a decade under normal conditions. A cheap 750W unit may struggle to deliver 550W of real, clean power — which is why a build can appear to work until the GPU first draws transient peaks and crashes.

## Cooling

### Air coolers

Noctua NH-D15 G2, be quiet! Dark Rock Pro 5, Thermalright Peerless Assassin 140. Handle anything up to ~250W sustained, which covers every consumer CPU except the 9950X3D / 285K at full multi-thread load. Quieter than AIOs when sized right. The trade-off is height — a 160mm+ cooler doesn't fit in most mid-towers' side panel; check your case's CPU clearance spec before buying.

### AIO liquid coolers

240mm, 280mm, 360mm, 420mm. Bigger radiator = more thermal headroom = quieter at the same load. A 360mm AIO handles any consumer CPU. A 280mm handles everything short of a 16-core full-synthetic load. Pumps and fans do fail eventually — five-to-seven years is typical. AIOs that are sealed units cannot be refilled. This is why we prefer air cooling on machines that go to customers who want "install once, forget"; AIOs go to customers who want silence or have a 16-core workstation chip.

### Custom loops

Hard tubing, reservoir, dedicated pump, separate GPU and CPU blocks. The bench builds these to order only. Performance is the best available; maintenance is the catch — expect a coolant change every 12–18 months. Not something we'd recommend as a first water-cooled build.

### Noise floor

Modern air coolers with 140mm fans idle at 18–22 dB(A). Decent AIOs at 20–26 dB(A). Below 30 dB(A) is effectively silent in a normal room. Above 40 dB(A) is when you start hearing it over a television. Any build that sits at the desk should aim for 30 dB(A) or lower under typical load.

### Thermal paste — what actually matters

Standard non-conductive pastes (Arctic MX-6, Noctua NT-H2, Thermal Grizzly Kryonaut) are within 1–2°C of each other under realistic loads. Application technique matters more than brand. A pea-sized dot in the centre for smaller IHS CPUs, or a cross / five-dot pattern for large IHS CPUs (Ryzen 9, Threadripper, Xeon) — the pressure of the cooler spreads it. Liquid metal (Conductonaut) is 5–8°C better but conducts electricity; one drop in the wrong place kills the motherboard. We don't ship liquid metal on customer builds unless specifically requested. Paste dries out slowly — every 3–5 years is the right re-paste interval for a daily-use machine. AV Care Plus covers this as part of the annual service.

## PC cases

### Airflow first

A well-ventilated mesh-front case with three 140mm fans at 800 RPM cools better and quieter than a solid-front case with six 120mm fans at 1500 RPM. Airflow is the single most important thing in case selection. We prefer Fractal Design, Lian Li, be quiet!, and Phanteks — all do airflow cases well.

### Clearance numbers to check

- **GPU length.** Current flagships are 330–360mm. A case spec of "up to 390mm GPU clearance" gives headroom.
- **CPU cooler height.** 160mm+ for a Noctua D15 class air cooler. 190mm+ for clearance to the side panel on some cases.
- **Radiator support.** 360mm top-mount and 360mm front-mount are the most common AIO positions.
- **PSU length.** Long ATX units at 180mm+ don't fit every mid-tower.
- **Motherboard form factor.** E-ATX support is a specific spec; don't assume.

### Sound damping

Cases with dense foam on the side panels (Fractal Define series, be quiet! Silent Base) reduce noise at the cost of airflow. Suits office machines more than gaming rigs. For a mixed-use machine at the desk, a good mesh case with quiet fans beats a damped case with standard fans.

### Form factors

- **Full tower** — 500mm+ tall. Fits E-ATX, multiple 360mm rads, long GPUs with no compromise. Best for workstations.
- **Mid-tower** — 450–500mm. The default. Fits ATX, 360mm rad, 360mm GPU. Most builds.
- **Micro-tower** — 350–450mm. Fits mATX, 240mm rad, compact GPU. Smaller desks.
- **Mini-ITX** — under 350mm, often SFX PSU. Fits ITX boards only. Specialist builds with real constraints on component choice.

### Dust filtering and positive pressure

A case with more intake fan pressure than exhaust (positive pressure) forces dust through the filters rather than through every seam in the panel. Positive pressure with good filters — magnetic mesh on front, bottom, and top where applicable — means you clean the filters once a quarter and the interior stays visibly clean. Negative pressure (more exhaust than intake, or no filters) draws dust in through the optical drive bay, the rear I/O shield, and every gap. Check the filter design before buying: filters that require removing the whole front panel get cleaned less often than magnetic ones that pull off in seconds.

### Cable management

Behind-the-motherboard routing space matters. 25mm is tight, 30mm is comfortable, 35mm+ is generous. Pre-installed Velcro straps and channels make a noticeable difference to the finished build — a well-routed machine runs cooler because cables aren't choking the front fans' intake path. We route every build to the same standard regardless of price; a £900 PC leaves the bench as tidy as a £5,000 one.

The right case matches the build's ambition: a 5090 and a 9950X3D in a compact mid-tower is asking for thermal trouble. A 9700X and a 5070 in the same case is perfectly happy.
