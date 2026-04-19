---
title: Networking — Home, Prosumer, and Enterprise
category: networking
updated: 2026-04-19
tags: [router, switch, access-point, wifi, ethernet, poe, vlan, firewall, cabling]
---

Networking gear is where buyers most often over- or under-spec. A £30 ISP-supplied router is fine until you add a 2.5GbE NAS and four access points; a £1,500 enterprise firewall is wasted on a four-person office with one printer. This file covers what each category of kit does, what to look for, and the tiers we stock.

## Routers

The router is the device at the edge of your network — it takes the ISP connection and hands out addresses to everything inside. Modern routers combine routing, firewalling, WiFi access, and sometimes switching in one box.

### WiFi generations — what the numbers actually mean

- **WiFi 5 (802.11ac).** 2014 generation. 5GHz only, up to ~1.3 Gbps theoretical per client. Still fine for older laptops and phones.
- **WiFi 6 (802.11ax).** 2019. Adds OFDMA and MU-MIMO for much better behaviour when many clients connect at once. 2.4GHz and 5GHz.
- **WiFi 6E.** 2020. Same as WiFi 6 but adds the 6GHz band — wider channels, far less interference, shorter range. Needs WiFi 6E-capable clients to benefit.
- **WiFi 7 (802.11be).** 2024. Adds 320MHz channels on 6GHz, Multi-Link Operation (a client uses two bands at once), and 4K-QAM modulation. Real-world speeds of 2–4 Gbps on WiFi 7 client devices in the same room as the router.

Upgrading WiFi only helps if your clients support the newer standard. A WiFi 7 router with a laptop from 2020 is a WiFi 6 network.

### Consumer routers

The ISP box replacement tier. ASUS RT-AX88U (WiFi 6), ASUS RT-BE88U (WiFi 7), TP-Link Archer BE800, Netgear Nighthawk RS700. Single-box solutions, reasonable ranges of 80–120 m² in a typical UK house. For flats and small homes, one of these is usually enough.

### Mesh systems

Two or more nodes that hand clients off between each other seamlessly. Eero 7, TP-Link Deco BE85, ASUS ZenWiFi BT10, Netgear Orbi 970. The right pick for houses above 120 m², houses with thick internal walls (common in Victorian and Edwardian UK stock), or houses over two floors with solid concrete between storeys. Wired backhaul (ethernet between nodes) is always faster than wireless backhaul — run Cat 6a between nodes where you can.

### Prosumer routers

The gap between consumer and enterprise. Ubiquiti UniFi Dream Router / Dream Machine Pro, Firewalla Gold Plus, MikroTik hEX S. VLAN support, proper firewall rules, VPN server, packet capture, configurable QoS. Needed when you want more than one network on the premises (a separate IoT network, a guest network that can't see internal devices), or when you're running a small office from home.

### Enterprise routers and firewalls

Fortinet FortiGate 40F / 60F / 100F, Palo Alto PA-400 series, Cisco Meraki MX. Deep-packet inspection, threat feeds, multi-WAN failover, site-to-site VPN, application-level policies. Needed at ten-plus users or when the organisation has any compliance requirement. Requires either in-house expertise or a managed support contract — these are not consumer products.

### What to look for when buying a router

1. **WAN port speed.** Cheap WiFi 7 routers still have 1 GbE WAN. If your ISP line is 1.8 Gbps Virgin or 2 Gbps full-fibre, you want 2.5 GbE WAN minimum.
2. **LAN port speeds.** Most routers are still 1 GbE on the LAN side. For internal transfers between a NAS and your PC, a 2.5 GbE LAN port (or a dedicated switch) matters more than the WAN number.
3. **CPU and RAM.** Feature lists are meaningless if the router CPU can't run them. Consumer routers with 512MB RAM and a dual-core ARM chip bog down with VPN and DPI enabled. Prosumer and enterprise gear specifies CPU clearly.
4. **Longevity of firmware.** ASUS and Ubiquiti have multi-year update cycles. Many cheap brands drop firmware support after two years, leaving unpatched vulnerabilities.

## Switches

A switch moves traffic between wired devices. Routers usually have four or five ports; the moment you want more, you add a switch.

### Unmanaged

The cheap, plug-and-play option. TP-Link TL-SG108, Netgear GS308. No configuration, no VLANs, no monitoring. Fine for joining a few desktops, a printer, and a NAS to the router. 5 / 8 / 16 / 24-port variants. Gigabit is standard; 2.5 GbE unmanaged switches (TP-Link TL-SG108-M2) are now affordable and worth the small premium on new installs.

### Managed

Web or CLI configuration, VLAN support, link aggregation, QoS, port mirroring, SNMP. Ubiquiti UniFi Switch range, Netgear M4250, TP-Link Omada. Needed when you want segregated networks (guest / IoT / internal) or when the network grows past one wiring closet.

### PoE — powering devices over ethernet

Power over Ethernet means the switch supplies power down the same cable that carries data. The cable runs to a ceiling-mounted access point or a security camera, and no local socket is required. Three standards matter:

- **PoE (802.3af).** Up to 15.4W at the port, ~12.95W at the device. Enough for most APs and IP cameras.
- **PoE+ (802.3at).** Up to 30W at the port. Covers 2.5 GbE APs, larger cameras, some VoIP phones.
- **PoE++ (802.3bt Type 3 / Type 4).** Up to 60W / 90W. Covers WiFi 7 APs with fast backhaul, displays, PTZ cameras.

The switch has a **total PoE budget** — a 48-port switch rated 400W can't power 48 × 30W devices simultaneously. Count your devices and add up their draw. PoE++ budgets add up fast.

### Enterprise SFP+ and 10GbE

SFP+ slots take fibre or copper modules for high-speed interconnects (10 Gbps typically, 25 / 40 / 100 Gbps in proper data-centre kit). The right answer when you want to run 10GbE between a NAS, a workstation, and the switch stack. MikroTik CRS305, Ubiquiti USW Aggregation, Netgear XS708T. SFP+ DAC (direct-attach copper) cables under 5m are cheap and low-latency; for longer runs you want fibre.

## Access points

The ceiling-mounted WiFi broadcaster, separate from the router. Replaces the WiFi in cheaper routers or supplements it in large spaces.

### When you need a dedicated AP

- Coverage area above ~120 m² per floor
- Thick internal walls (stone, concrete, old brick)
- More than 20 wireless clients simultaneously
- A requirement to separate wired routing from wireless coverage

A ceiling-mounted AP covers a circle of about 15–20 metres radius at full speed, tapering beyond. Walls take metres off this — a single stud wall costs 5m; a brick wall costs 10–15m; a fire door is effectively opaque to WiFi.

### Tiers

- **Consumer.** TP-Link EAP, ASUS ExpertWiFi. WiFi 6 / 6E. One or two APs. £80–£200.
- **Prosumer.** Ubiquiti UniFi U6, U7 Pro, U7 Pro Max, U7 Pro XG. WiFi 6 / 6E / 7. Cloud controller or on-prem Dream Machine. £150–£500 per AP.
- **Enterprise.** Cisco Meraki, Aruba, Ruckus. Four-stream to eight-stream radios, external antenna support for stadia and warehouses, controller-based orchestration. £400–£1,500 per AP with licensing.

### Placement rules

- Mount on the ceiling, not the wall — the radiation pattern from most APs is designed for downward coverage.
- Centre of the space, not in a corner. One AP in the middle of a 100 m² floor beats two APs at opposite corners.
- Avoid metal obstructions — fridges, filing cabinets, server racks block signal.
- Keep APs at least 5–8m apart when using more than one; closer than that, they interfere with each other on the same channel.

### Roaming between APs

A client moves through the building and the network should hand it off to whichever AP has the strongest signal. Three standards help:

- **802.11k.** The client is told which neighbour APs exist so it doesn't have to scan every channel.
- **802.11v.** The network can suggest "please move to that other AP" rather than waiting for the client to drift.
- **802.11r (Fast BSS Transition).** Cryptographic handoff — the client doesn't re-authenticate from scratch when it switches AP. Critical for VoIP and video calls; nobody notices a dropped 40ms, but a two-second re-auth kills the call.

All three are enabled by default on UniFi, Aruba, Meraki, Ruckus. Older consumer mesh systems sometimes implement a subset and call it "fast roaming". If calls drop as you walk through the house with a handset, this is usually why.

## Cabling

### Cat 5e vs 6 vs 6a vs 7 vs 8

- **Cat 5e.** Up to 1 Gbps at 100m. Existing cable in most UK homes built before 2010. Works fine for 1GbE. Will *sometimes* carry 2.5 GbE over short runs but is not rated for it.
- **Cat 6.** Up to 10 Gbps at 55m, 1 Gbps at 100m. Slightly thicker shielding than 5e.
- **Cat 6a.** Up to 10 Gbps at 100m. The sensible default for new installs in 2026. Thicker jacket, better twist, properly supports 10GbE over building-scale runs.
- **Cat 7.** Up to 10 Gbps, shielded twisted pair. Uses GG45 / TERA connectors properly, but almost always sold terminated with RJ45 — in which case it's really a marketing label on shielded Cat 6a.
- **Cat 8.** Up to 40 Gbps at 30m. Data-centre spec. Not the right cable for long office runs; short patch leads only.

For almost all customers, the right answer is **Cat 6a for structured cabling** and **Cat 6 patch leads** at the desk. Cat 7 and Cat 8 marketing should not drive a decision for a home or office network.

### Fibre

Single-mode (OS2) for long runs (multi-kilometre) and between buildings. Multi-mode (OM3, OM4) for runs inside a building where the distances are tens to hundreds of metres. Fibre is the right answer for any run between floors in a large building, between buildings on a site, or when you want to future-proof past 10GbE.

### Patch panels and structured cabling

On a proper install, cable runs from the wall outlet back to a patch panel in a central cupboard or rack. Short, flexible patch leads connect the panel to the switch. Three reasons this matters: the fixed run stays undisturbed (fewer failures), moves and changes only touch patch leads, and testing is straightforward because each run has a defined start and end. Loose runs tied straight into a switch behind a sofa look fine for a year and then one of them gets kicked loose. Keystone jacks at the wall with colour-coded Cat 6a behind the plasterboard is the shape of a tidy home network.

### Double NAT and bridge mode

Most ISP routers do their own NAT — translating your internal addresses to the one public address. If you add a prosumer router behind the ISP router, you now have *two* NATs, which breaks some VPNs, port forwarding, and peer-to-peer connections. Fix: put the ISP router into **bridge mode** (or "modem mode") so it hands the raw connection to your router. Virgin Media, BT, Sky, and most FTTP ISPs support this; some ISP-supplied boxes hide the option deep in advanced settings. On double-NAT with no bridge mode available, the workaround is DMZ — forwarding all traffic to your inner router — which is less clean but usually works.

## NIC upgrades

The network card in the PC or NAS. Most modern motherboards include at least 2.5 GbE; 10 GbE is still usually a discrete card.

- **2.5 GbE.** Cheap add-in cards (£20–£40) using Realtek RTL8125 or Intel I225/I226 chips. Fine for typical home and small-office upgrades. The Intel I226 is the more reliable chip; early Realtek 8125 revisions had firmware issues.
- **10 GbE.** Intel X550-T2, Aquantia / Marvell AQC113, Broadcom. £80–£200 cards. RJ45 or SFP+ variants. Fits into a PCIe 3.0 x4 slot minimum.
- **25 / 40 / 100 GbE.** Mellanox / NVIDIA ConnectX, Intel E810. Workstation and server cards, SFP28 / QSFP+ / QSFP28 optics. Needed only for NAS environments with multiple clients pulling 4K or 8K video simultaneously, or for virtualisation hosts.

If the machine is older, check that the PSU and PCIe slot have capacity. 10 GbE cards can draw 8–12W and run hot; keep them out of slots right under a large GPU.

## Firewalls — the basics

Everything with an internet connection has some firewall. The questions are how smart it is and who manages it.

- **Stateful firewall.** The default — tracks outbound connections and allows return traffic. Every consumer router does this.
- **Application-aware (NGFW).** Looks at what protocol is actually running on a port, not just the port number. Blocks a BitTorrent client using port 443.
- **IDS/IPS.** Intrusion detection and prevention. Watches for signatures of known attacks and either alerts or blocks.
- **DNS filtering.** Blocks entire categories of sites (malware, adult, ads) before the client even connects. The easiest single win for home network safety. Pi-hole, NextDNS, AdGuard Home, Control D.

For most homes, the ISP router's basic firewall plus DNS filtering is enough. For offices, invest in a proper NGFW.

## VLANs — plainly explained

A VLAN (virtual LAN) is a way of carving one physical network into separate logical networks. Devices on VLAN 10 can talk to each other but not to devices on VLAN 20 — unless the firewall explicitly allows it.

### Why it matters

- **IoT segregation.** Smart bulbs, thermostats, robot vacuums, and TVs run outdated software with known vulnerabilities. On a flat network, a compromised bulb can see your NAS. On a VLAN, it can't.
- **Guest networks.** Visitors get internet access without seeing your printers, NAS, or cameras.
- **Work from home.** A corporate laptop on its own VLAN, firewalled from the home network, keeps the company's compliance team happy.

### What you need

- A managed switch, or a router that does internal VLANs
- APs that support multiple SSIDs mapped to different VLANs
- A router capable of firewall rules between VLANs

Ubiquiti UniFi, TP-Link Omada, and MikroTik all do this at prosumer price points. A typical UK-home setup: VLAN 10 (trusted — PCs, phones), VLAN 20 (IoT — bulbs, TVs, vacuum), VLAN 30 (guest — WiFi only, internet-only).

## Tiers, summarised

### Small home / flat
Single-box WiFi 6 or 7 router, 1–2 Gbps WAN, 1 GbE LAN fine. Cat 6 patch leads. No switch needed, or a 5-port unmanaged for a TV and console.

### Family house (100–200 m²)
Either a capable single router in the centre, or a 2–3 node mesh with wired backhaul if the structure blocks signal. Unmanaged 8-port switch by the TV or home office. Cat 6a structured cable to any office and the media room.

### Prosumer / home lab
UniFi Dream Machine or similar router. UniFi Switch 24 PoE. U7 Pro access points. Cat 6a throughout. 2.5 GbE to the desktop, 10 GbE SFP+ to the NAS. VLANs for IoT and guest.

### Small office (5–25 users)
FortiGate 60F or similar NGFW, stack of UniFi Pro PoE switches, four to eight WiFi 7 APs. Structured Cat 6a to every desk, fibre between floors. Managed service contract for the firewall.

### Enterprise
Redundant NGFW pair, core / access / distribution switch layers, controller-managed APs, out-of-band management network, site-to-site VPN to other offices. Not a self-serve purchase.
