---
title: Refurbished — What It Actually Means at BAV
category: refurb
updated: 2026-04-19
tags: [refurbished, bench-process, grading, warranty, birth-certificate, thermal-history]
---

The word "refurbished" has been ruined by eBay and Amazon. Sellers apply it to anything from a genuinely rebuilt and tested machine to a unit that has been switched on once and wiped. This file explains what refurbished means when a Birmingham AV product says it, and what the 22 builders on the bench actually do between a unit arriving and a unit shipping.

## The bench process

Every refurbished product passes through seven stages. The process is the same whether we're processing a £180 office laptop or a £4,200 RTX 4090 tower. The bill of labour scales with the machine, but no stage is skipped.

### Stage 1 — Inbound

The unit arrives on the bench. Before anything is plugged in or opened:

- Photograph the exterior from six angles. These are stored against the unit's serial number.
- Log the source (trade-in, ex-lease, ex-corporate, manufacturer B-stock, returned order).
- Record cosmetic condition against a standard checklist — scratches, dents, yellowing, missing screws, broken feet, keyboard wear, screen condition, hinge play on laptops.
- Verify the serial number against manufacturer warranty records where applicable.
- Remove any existing SSD or HDD. Customer data isn't our concern to read — it's our concern to destroy.

Every customer drive coming in is wiped to a NIST 800-88 Clear standard before being reused or recycled. Drives too old to reuse are physically destroyed.

### Stage 2 — Strip

The case comes off. On desktops, every component is removed — GPU, CPU, cooler, RAM, storage, PSU, fans, cables. On laptops, the bottom panel comes off and we examine the internals before removing anything. Nothing is reinstalled without being inspected individually.

The strip stage is also when we decide if a unit is salvageable at all. Some arrive beyond economic repair — water damage, lightning-strike motherboards, cracked substrate on a CPU or GPU. Those units go into the parts bin. Anything usable is harvested; anything not is recycled responsibly via our licensed WEEE contractor.

### Stage 3 — Clean

The bench-standard clean takes about 40 minutes on a typical desktop, longer on laptops because the hinges and keyboard area need disassembly.

- Compressed air and a soft brush through every fan, heatsink, and intake filter.
- Isopropyl alcohol on the heatsink contact face and CPU/GPU IHS — old thermal paste is completely removed, not just wiped.
- Cosmetic clean of the case exterior with a non-solvent cleaner. Scratches that can be polished out, are. Scratches that can't are documented.
- Keyboard and palm-rest clean on laptops — alcohol wipe, keycap removal where needed.
- Screen clean with a proper display-safe solution, not household glass cleaner.

### Stage 4 — Component assessment and swap criteria

Each component is tested individually and a decision made: keep, replace, upgrade, reject.

**Thermal paste.** Always replaced. Arctic MX-6 or Noctua NT-H2 as standard, liquid metal by request only and only on machines going to experienced customers.

**Fans.** Measured for bearing noise and RPM deviation. Any fan that whines above background, wobbles on its axis, or fails to reach rated RPM gets replaced. Case fans go to Arctic P12 / P14 or Noctua NF-A12x25 depending on the build grade.

**PSU.** Every PSU is tested under load on the bench. Units more than five years old, or from brands we don't stock, are replaced as a matter of course — even if they test fine. The capacitors inside a six-year-old £35 PSU are the single most common cause of "my refurbished PC died after three months" stories from other sellers.

**RAM.** Runs through MemTest86 for a minimum of four full passes. Any errors = replacement. Mixed kits (different brands or speeds) are always re-matched to a single kit.

**CPU.** Tested with Prime95 small FFTs for 30 minutes watching package temperature and per-core clocks. A CPU that throttles below rated boost under sustained load is either paired with a better cooler or rejected.

**GPU — the big one.** Modern GPUs, particularly RTX 30 and 40 series, have two failure modes we specifically test for:

- **VRAM junction temperature.** The memory modules on an RTX 3080/3090 and RTX 4080/4090 can reach 100–110°C under sustained load if thermal pads have degraded. We stress the card with 3DMark Port Royal on loop while monitoring memory junction temps. Above 95°C sustained = thermal pad replacement before the card ships.
- **VRM thermal behaviour.** The power delivery on high-end cards runs hot by design, but not *that* hot. We flag and inspect any card showing VRM temps beyond 100°C under sustained load.

Any GPU fan with bearing whine is replaced with a matching OEM spare or an aftermarket replacement if the original is unobtainable. Cards with any sign of past repair (reflow evidence, bodged pads, amateur thermal paste application) are either reworked properly or returned to stock as parts only.

**Motherboard.** POST test across all RAM slots, M.2 slots, PCIe slots, USB ports, and rear I/O. BIOS flashed to latest stable before any further testing. CMOS cleared, default XMP/EXPO profile enabled.

**Storage.** Any OEM drive is tested with a SMART attribute scan and a full-drive read pass. Drives with reallocated sectors, pending sectors, or elevated uncorrectable error counts are rejected. Every build ships with a new NVMe drive as standard; reusing old storage in refurbished machines is a false economy.

### Stage 5 — Rebuild, paste, and cabling

Rebuild with fresh paste, new cabling where the originals are in any way damaged, tidy routing. Every build leaves the bench with cables properly managed — not for aesthetics, for airflow. A rebuilt machine with choked front fans runs 8–12°C hotter than the same machine built properly.

### Stage 6 — Burn-in

Every rebuilt machine runs a minimum 24-hour burn-in cycle:

- OCCT stability test for 8 hours covering CPU, GPU, RAM, and power delivery simultaneously.
- 3DMark Time Spy Stress Test (20-loop) for GPU-specific stability.
- Temperatures, fan speeds, clocks, and voltages logged to a file that becomes part of the unit's birth certificate.
- Any instability = back to Stage 4 to find the cause. No unit ships with known-bad behaviour in the log.

Laptops get a scaled-down version of the same — typically 6 hours combined CPU and GPU load with thermal logging.

### Stage 7 — QC and birth certificate

Final visual inspection by a second builder. Fresh Windows install with any manufacturer drivers, BIOS on latest stable, default profiles loaded. The unit's birth certificate is printed and placed in the box:

- Build number and serial number
- Who built it (builder code and name)
- Components and versions as shipped
- Burn-in results — peak and average temperatures, any throttling, fan behaviour
- Date of build and date of QC signoff

A customer who receives a refurbished 4090 tower from us sees every thermal test that card went through on the bench. The certificate isn't decoration — it's the reason we can say with confidence that a refurbished card with a year's documented history is a safer purchase than a new one with no history at all.

## Grades — what each actually means

The refurbished market uses grades that vary by seller. Here's what they mean at BAV, and what they mean elsewhere.

### At BAV

- **Grade A (Like New).** Fully passed the seven-stage process. Cosmetic condition indistinguishable from new — no visible scratches at arm's length under normal room light. Full packaging or equivalent. 12-month warranty.
- **Grade B (Excellent).** Fully passed the process. Minor cosmetic marks — light scuffs on a case edge, small marks on a laptop lid. Functionally identical to Grade A. Discounted accordingly. 12-month warranty.
- **Grade C (Good).** Fully tested and stable. Cosmetic wear is visible — dents on a case corner, deeper scratches, key wear on a laptop. No functional issues. Larger discount. 12-month warranty applies.

Every grade we sell is functionally guaranteed and covered by the same warranty — the grade describes cosmetic condition only. Performance, stability, and reliability standards do not vary between grades.

### Elsewhere (what to watch for)

- **Manufacturer-refurbished.** A unit returned to the manufacturer, tested, repaired as needed, and resold with a manufacturer warranty. Usually a safe bet. Apple, Dell Outlet, Lenovo Outlet all do this to a high standard.
- **Factory-refurbished.** Usually synonymous with manufacturer-refurbished, but some third-party "factory-refurbished" just means "an off-site refurbishment centre processed it", which could be anyone.
- **Seller-refurbished.** The seller has done *something*. Could be anything from a proper rebuild to a power-on test. Read the listing carefully and check the warranty length — a 30-day warranty is a red flag.
- **Open box.** A returned new unit, resealed. Usually fine; has manufacturer warranty from the original purchase date, which may leave less than 12 months remaining.
- **Used — like new / very good / good / acceptable.** No refurbishment implied. Eyes open, verify everything.

## What we replace, what we keep, what we refuse

### Always replaced

- Thermal paste on every CPU and GPU
- Any fan with bearing noise, wobble, or RPM deviation
- PSUs more than five years old, or from non-stocked brands
- CMOS battery on motherboards older than three years
- Storage drives showing any SMART degradation
- Damaged cables, bent pins, worn USB ports

### Kept where tested good

- CPU and motherboard (assuming they pass load testing and POST cleanly)
- RAM passing MemTest86 four passes clean
- GPU passing sustained thermal testing with normal memory junction temps
- Case, PSU cables, fans that meet our specification
- Laptop batteries with >85% design capacity (otherwise replaced)

### Refused outright

- Units with evidence of water damage or corrosion
- Cards or boards with previous unprofessional repair work
- Any CPU or GPU with cracked substrate or damaged pads
- PSUs from unknown brands, regardless of age or test results
- Storage drives from deceased-brand OEMs
- Mining cards with altered BIOS or signs of extended hash-rate duty (we don't sell ex-mining GPUs as gaming cards — full stop)

## Why refurbished with thermal history beats new with no history

A new GPU arrives in a sealed box. You don't know its manufacturing batch, how it was stored, or how it behaves under sustained load until you install it and run it. A proportion of new cards have assembly issues (badly applied thermal paste, loose heatsink screws, uneven thermal pads) that only appear weeks later as temperature creep or instability. Warranty claims on those are your problem.

A refurbished GPU that's been through the BAV bench has a documented thermal run. We know its memory junction temperature at full load. We know its fan curve is correct. We've replaced the paste and pads. If it was going to fail early, it would have failed during the 24-hour burn-in — which is the whole point of the burn-in.

For older silicon still in production that is hard to source — an RTX 3090 for an ML workstation, a 5950X for a legacy production environment — a refurbished unit with this history is often the better technical buy. Not just the cheaper one.

## What to ask before buying refurbished from anyone

1. **What warranty, from what date?** New product warranties run from purchase. Refurbished warranties should too.
2. **Who tested it and what did they test?** A 24-hour burn-in with a log is a different product from a 30-second POST test.
3. **What's been replaced?** Paste, fans, and PSU at minimum for anything worth calling "refurbished".
4. **Grade definition — cosmetic, functional, or both?** A single grade word with no definition means nothing.
5. **Returns policy?** If the seller won't accept returns, they don't trust their own refurbishment.

BAV answers all five of those, for every unit, in the listing and on the birth certificate.
