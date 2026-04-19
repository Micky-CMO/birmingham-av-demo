---
title: Compatibility — The Traps That Catch People Out
category: compatibility
updated: 2026-04-19
tags: [sockets, psu-sizing, 12vhpwr, case-clearance, ram-qvl, pcie-lanes, thunderbolt]
---

Most PC problems aren't faults — they're parts that don't fit together as the customer expected. This file lists the compatibility traps that come up weekly in support, and how to check before buying.

## CPU sockets across generations

A CPU only fits its specified socket. The physical connector changes generation to generation, and within a socket family, BIOS support determines which specific chips work.

### Intel recent sockets

- **LGA1200 (2020–2021).** 10th and 11th gen Core. No path forward — buying a new CPU means a new board.
- **LGA1700 (2021–2024).** 12th, 13th, and 14th gen Core. The last DDR4/DDR5-capable Intel platform. End of life for new CPU releases.
- **LGA1851 (2024+).** Core Ultra 200 series (Arrow Lake). DDR5 only. Currently the active Intel desktop socket.

The mounting holes between LGA1700 and LGA1851 are similar but not identical — some coolers fit both with the right bracket, some don't. Always check the cooler's compatibility list before assuming.

### AMD recent sockets

- **AM4 (2017–2023).** Zen 1 through Zen 3 — Ryzen 1000 / 2000 / 3000 / 5000 series. Still heavily in the market, particularly for refurbished builds on the 5800X3D and 5950X.
- **AM5 (2022+).** Zen 4 and Zen 5 — Ryzen 7000, 8000 APU, and 9000. DDR5 only. AMD has committed to AM5 support through 2027 minimum, meaning an AM5 board bought today will accept at least one further CPU generation.

AM4 and AM5 are physically different — AM4 is PGA (pins on the CPU), AM5 is LGA (pins on the socket). The mounting brackets are compatible between AM4 and AM5 for most coolers, which is the rare good news of this transition.

### Threadripper / HEDT sockets

- **sTRX4 (2019–2021).** 3rd gen Threadripper. Legacy.
- **sWRX8 / sTRX4 PRO.** Threadripper Pro 3000 / 5000.
- **sTR5 (2023+).** Threadripper 7000 / 9000 and Threadripper Pro 7000 / 9000. WRX90 chipset for Pro, TRX50 for non-Pro.

A Threadripper non-Pro and a Threadripper Pro use the same socket but different chipsets — you can't swap between them on the same board.

## GPU power connectors — 12VHPWR and the 12V-2×6 revision

Every RTX 40 and RTX 50 card above the 4060 uses the 16-pin 12VHPWR connector (or its revised 12V-2×6 pinout on newer cards and PSUs). This replaced the 8-pin PCIe power connectors of previous generations.

### The trap

- Many older Gold PSUs predate 12VHPWR. They ship with only 8-pin PCIe outputs.
- An included adapter (two or three 8-pin to one 12VHPWR) is a working solution but not the ideal one — every extra connection is a potential resistance point.
- A proper ATX 3.1 PSU with a native 12VHPWR cable from the unit's modular panel is the clean answer.

### Seating matters

The early melting reports on RTX 4090 were caused by under-seated connectors — the plug not pushed fully home. The 12V-2×6 revision added a shorter sense pin that doesn't engage if the main pins aren't fully seated, so the GPU refuses power rather than running with a bad connection. On every BAV build the connector is fully seated and verified with a fingernail check to confirm the click. Customers installing their own GPU should push firmly until they feel and hear the click, then visually confirm no plastic is showing between the connector and the socket.

### Cable bend radius

12VHPWR cables should not be bent within 35mm of the connector. Tight bends right at the plug stress the pins and can cause intermittent contact. Cable combs or 90-degree adapters (Cablemod, Corsair) are the clean solutions for cases where the side panel is close to the GPU.

## Case clearance — the three numbers

Cases quote three clearance specs that customers routinely miss.

### GPU length

Current flagships are 330–360mm; custom-cooler variants reach 400mm. Check the case spec — "up to 390mm GPU clearance" is typical for a decent mid-tower. An ITX case may cap at 330mm, which excludes some RTX 5080 and all 5090 custom-cooler variants.

### CPU cooler height

Large air coolers like the Noctua NH-D15 G2 (168mm) or be quiet! Dark Rock Pro 5 (163mm) won't fit a compact case rated for 158mm maximum. Mid-towers typically clear 160–175mm; slim mid-towers may cap at 155mm. Always check this number on the case spec — trying to force a tall cooler against the side panel damages both.

### PSU length

Long fully-modular PSUs (Corsair AX1600i at 200mm, some 1200W units at 180mm) don't fit every case. Standard ATX cases clear 180mm; compact mid-towers may cap at 160mm. Mini-ITX cases use SFX or SFX-L PSUs exclusively — a standard ATX PSU will not fit regardless of length.

### Radiator clearance

AIO cooler radiators need room in the specific position you want to mount them. "360mm radiator support" in the case spec should be checked against: where (top / front / side), the fin-to-fan stack height (usually 55–65mm), and any clearance conflict with RAM (front-mount radiators on some cases push against tall RAM modules). Front-mount is generally cooler than top-mount because intake air is fresh; top-mount is quieter because the hot air exits upward.

## PSU wattage sizing with proper headroom

Underpowered PSUs cause random crashes that are extremely difficult to diagnose. The symptom at the customer's end is a game reboot the PC, the cause is a 12V rail that sagged for 20 milliseconds when the GPU spiked. We size PSUs so the peak draw sits at roughly 60–70% of rated wattage — the efficiency sweet spot and the level where transients don't stress the unit.

### Sizing worked examples

- **Entry build** — Ryzen 5 9600X (105W) + RTX 5060 (150W) + 150W overhead = 405W peak. 650W Gold with 35% headroom.
- **Mid-range** — Ryzen 7 9800X3D (120W) + RTX 5070 Ti (300W) + 150W = 570W. 750W Gold.
- **High-end** — Ryzen 9 9950X3D (170W) + RTX 5080 (360W) + 150W = 680W. 850W Gold.
- **Flagship** — Ryzen 9 9950X3D (170W) + RTX 5090 (575W) + 150W = 895W. **1000W minimum; 1200W is the right sizing for headroom.**
- **Dual-GPU ML** — 9950X (170W) + 2× RTX 5090 (1150W) + 150W = 1470W. **1600W Platinum, and check your wall socket amperage — a UK 13A / 230V socket tops out around 2990W real-world.**

### PSU age for existing builds

Capacitors age. A 10-year-old Gold PSU, even if it tests fine, is not a part we'd pair with a new 5090. The capacitance loss means transient response is degraded, and the 5090's spike behaviour is the single most demanding load the PC presents to the PSU. New GPU = new PSU, ideally ATX 3.1.

## RAM QVL compatibility on AM5

AM5's memory controller is sensitive. A kit advertised as "DDR5-6000 CL30" may not run at rated speed on every board. The motherboard manufacturer's QVL (Qualified Vendor List) tells you which specific kits have been tested and certified on that board.

### What to actually check

- The board's QVL page on the manufacturer's website (ASUS, MSI, Gigabyte, ASRock).
- Match both the speed and the capacity: a 2×16GB kit on the QVL doesn't guarantee a 2×32GB kit of the same model works.
- Prefer kits explicitly certified for AM5 and using Hynix A-die or M-die ICs (the current sweet spot for 6000MT/s CL30).

If a kit is not on the QVL, it may still work but often won't reach advertised speed — the board will run it at a lower speed automatically rather than refusing to POST.

### Four-stick limitations

On AM5, four-stick configurations often drop a speed bin. 4×16GB at 6000MT/s is rarely stable on most boards; 5200MT/s is the realistic ceiling for four sticks. If you need 128GB, use a 2×64GB kit. If you need 64GB, 2×32GB outperforms 4×16GB.

## NVMe PCIe generation vs motherboard slot

A PCIe 5.0 NVMe drive runs at Gen 5 only in a Gen 5 slot. Put it in a Gen 4 slot and you get Gen 4 speeds — no damage, just the slower ceiling.

### The shared-lane trap

Many B-series and entry X-series boards share lanes between the second M.2 slot and the chipset, or between M.2 and the secondary PCIe slot. Fitting a drive in the second slot may automatically disable or halve the speed of the chipset PCIe slot (typically the one your secondary GPU or capture card is in). Check the motherboard manual's lane table before deciding which drive goes where.

### Heatsinks

PCIe 5.0 drives need the motherboard's M.2 heatsink installed to avoid thermal throttling. Without it, sustained write speeds collapse after about 60 seconds. PCIe 4.0 drives benefit from the heatsink but usually survive without; PCIe 3.0 drives rarely need one.

## Monitor refresh rate and GPU pairing

A 360Hz monitor with a GPU that pushes 120 fps in your games is money wasted on the monitor. Match the refresh ceiling to what the GPU can actually drive at your chosen settings.

### Rule of thumb

- **RTX 5060 / RX 7700 XT.** 144Hz 1080p is the right ceiling.
- **RTX 5070 / RX 9070.** 165–240Hz 1440p is realistic.
- **RTX 5070 Ti / RTX 5080 / RX 9070 XT.** 240Hz 1440p or 120Hz 4K with DLSS.
- **RTX 5090.** 240Hz 4K OLED or 160Hz 4K mini-LED is the intended pairing.

### DisplayPort generation vs monitor bandwidth

A 240Hz 4K monitor may require DisplayPort 2.1 to run uncompressed. Older GPUs with DisplayPort 1.4 can still drive it — with Display Stream Compression (DSC) — but the full bandwidth headroom needs DP 2.1 on both ends. Check the monitor's spec and the cable's rating.

## Thunderbolt vs USB4 vs USB 3.2

The port looks identical (USB-C) but the underlying capability varies.

- **USB 3.2 Gen 2×2 (20 Gbps).** Fast for external NVMe and displays over DP Alt Mode. No Thunderbolt features.
- **Thunderbolt 3 and Thunderbolt 4 (40 Gbps).** Connects Thunderbolt-specific accessories (eGPU enclosures, certain docks and audio interfaces). Supports DisplayPort daisy-chaining. Intel-controlled standard historically.
- **USB4 (40 Gbps).** The open-standard sibling of Thunderbolt 4. Most USB4 ports work with Thunderbolt 4 accessories, but not all — check the accessory's compatibility list.
- **USB4 v2 / Thunderbolt 5 (80 Gbps, 120 Gbps asymmetric).** The current top spec. Found on Core Ultra 200 laptops and recent Apple silicon.

For connecting a single external display or external NVMe, any USB-C port with DP Alt Mode works. For eGPU or professional audio, Thunderbolt 4 or better is required.

### Cable matters

A USB-C cable rated for USB 2.0 will not carry DisplayPort or 40 Gbps data, even plugged into a Thunderbolt 4 port on both ends. Cables are not interchangeable at high speeds. Look for the rated speed on the cable (and preferably the length — some 40 Gbps cables are spec-limited to 1m or 2m).
