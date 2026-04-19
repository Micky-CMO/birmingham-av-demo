---
title: Troubleshooting — Common Issues and Fixes
category: troubleshooting
updated: 2026-04-19
tags: [no-post, gpu-artifacts, bsod, thermal-throttling, ssd, wifi, monitor, fan-noise, thermal-paste]
---

This file covers the issues we see most often in support. Each section gives the customer a checklist to work through. If nothing on the list resolves the problem, the next step is to contact support — we'd rather diagnose it properly than have customers replace parts they don't need to.

## PC won't POST

"Won't POST" means power comes on — fans spin, lights come on — but the machine doesn't display anything and doesn't reach Windows. Work through this in order. Most problems are resolved by the time you reach step 5.

### Checklist

1. **Monitor and cable.** Is the monitor powered on and set to the correct input? Is the cable in the GPU's output, not the motherboard's (unless there's no discrete GPU)? Try a different cable — DisplayPort cables fail more often than people expect.
2. **RAM reseat.** Remove all RAM, press firmly back in until both clips close. If two sticks, try booting with one stick in slot A2 (the second slot from the CPU). If it POSTs, the other slot or other stick may be the problem.
3. **Clear CMOS.** On the motherboard, either press the Clear CMOS button (rear I/O, if present) for 10 seconds, or remove the CR2032 battery for 60 seconds with the PSU switched off. This resets BIOS to defaults — useful if a failed overclock or memory profile left the board in a confused state.
4. **PSU switch, power cable, wall socket.** Confirm the PSU rear switch is on. Try a different power cable. Try a different wall socket on a different circuit.
5. **POST debug LEDs.** Most modern boards have four small LEDs labelled CPU / DRAM / VGA / BOOT. The one that stays lit tells you where POST stopped. CPU = reseat CPU and check for bent pins / socket debris. DRAM = RAM issue, return to step 2. VGA = GPU reseat or PSU cable issue. BOOT = drive not detected.
6. **GPU reseat.** With the PC off and the PSU switched off, remove the GPU, check the PCIe slot for dust, reseat firmly. Disconnect and reconnect the 12VHPWR cable.
7. **Minimal build.** Remove everything non-essential — secondary SSDs, capture cards, front-panel USB headers, extra fans. Boot with CPU, one stick of RAM, GPU (or iGPU), and the boot drive. If it POSTs now, reintroduce components one at a time.

If nothing above works, it's likely the motherboard, CPU, or PSU. Support can diagnose the rest — contact us with the debug LED status, any beep pattern, and which step in this list you reached.

## GPU artifacts or crashes in games

Visual glitches (green squares, flashing textures, snowy static) or games that crash to desktop point at the GPU. The question is whether it's the card itself, drivers, or power delivery.

### Checklist

1. **Update the driver — cleanly.** Run DDU (Display Driver Uninstaller) in safe mode to remove the existing driver, then install the current stable release from NVIDIA or AMD. Skip the beta.
2. **Reduce overclock.** If MSI Afterburner or a similar tool has been used, revert to stock. Factory-overclocked cards are stable; user overclocks often aren't, particularly on memory.
3. **Check temperatures.** In HWiNFO or GPU-Z, look at GPU core, hotspot, and memory junction temperatures under sustained load. Core above 83°C, hotspot above 95°C, or memory junction above 100°C is thermal trouble — clean the card's fans and filters, check airflow.
4. **Test with a different PSU cable.** A damaged or badly-seated 12VHPWR cable causes exactly this symptom. Replace the cable if you have a spare, reseat firmly if not.
5. **Test in a different game or benchmark.** 3DMark Time Spy, Unigine Superposition, FurMark. If artifacts appear in every workload, it's a hardware issue. If only one game is affected, it's a driver or game patch issue.
6. **Event Viewer for TDR events.** Windows Event Viewer → Windows Logs → System. Look for "Display driver stopped responding and has recovered" events. Frequent TDRs point at the GPU, rare ones at a driver or application.

Artifacts in POST or BIOS (before Windows loads) are almost always hardware — a card with those symptoms goes back under warranty.

## Blue screens (BSOD)

The stop code on the blue screen tells you more than people realise. The codes you'll see most often:

- **WHEA_UNCORRECTABLE_ERROR** — hardware fault, often CPU or RAM. Check temperatures, test RAM with MemTest86, disable overclocks.
- **MEMORY_MANAGEMENT** — RAM or memory controller. MemTest86 for four full passes. If clean, may be a failing BIOS memory profile — reload XMP/EXPO from defaults.
- **IRQL_NOT_LESS_OR_EQUAL** — driver issue. Check which driver is named in the dump (BlueScreenView or WhoCrashed make this easy).
- **PAGE_FAULT_IN_NONPAGED_AREA** — RAM or storage. Check the SSD SMART attributes and run a MemTest86 pass.
- **DRIVER_POWER_STATE_FAILURE** — almost always a graphics or chipset driver. Reinstall cleanly.
- **CLOCK_WATCHDOG_TIMEOUT** — CPU. Overclock instability, failing chip, or cooling issue.

### Reading the dump

Windows writes a minidump to `C:\Windows\Minidump` every time it crashes. Free tools (BlueScreenView, WhoCrashed) open these and name the offending driver or module in plain English. Install one of these, crash again, and the tool usually points straight at the problem.

If BSODs happen at idle, check temperatures and voltages. If they happen only under load, it's almost always CPU, GPU, or PSU stress. If they happen only in one application, it's the application or its driver stack.

## Thermal throttling

Symptoms: frame rate drops off after 5–10 minutes of gameplay; CPU hits 95°C and clocks back; fan noise becomes unbearable; gameplay stutters despite nothing being queued.

### Checklist

1. **Dust.** The single most common cause on any machine over 18 months old. Compressed air through every intake filter, the heatsink, and the GPU fans.
2. **Ambient temperature.** A room at 28°C in summer is 10°C warmer than the same room in winter. Case temps scale linearly with ambient.
3. **Thermal paste age.** On a 3+ year old machine, repasting is worth trying. AV Care Plus includes this as part of the annual service.
4. **Cooler mounting.** A loose CPU cooler or a bent AIO cold plate causes terrible temperatures with no other symptoms. Check the mount is firm and evenly tensioned on all four corners.
5. **Case airflow.** One exhaust fan with no intake pulls heat from the GPU back over the CPU cooler. Proper airflow is two or three intake at the front, one exhaust at the rear, optional top exhaust for AIO top-mount.
6. **Fan curve.** Some OEM fan curves prioritise silence over cooling until the CPU hits 85°C. In BIOS, set a more aggressive curve — 40% PWM at 50°C, 70% at 70°C, 100% at 85°C.

If temperatures are still high after all of the above, the cooler itself may be undersized for the CPU. A 240mm AIO is not enough for a sustained multi-thread load on a 9950X3D or 285K — step up to 360mm or a serious dual-tower air cooler.

## SSD performance degradation

A drive that was fast new and is noticeably slower six months later. Usually one of three things.

### Checklist

1. **Drive is nearly full.** SSDs slow down dramatically above 85% capacity. The SLC cache region needs free space to operate. Clearing to below 80% often restores performance immediately.
2. **TRIM not running.** Open a terminal and run `fsutil behavior query DisableDeleteNotify`. Output of `0` means TRIM is enabled (correct). Output of `1` means it's disabled — enable with `fsutil behavior set DisableDeleteNotify 0` and schedule a TRIM with `Optimize-Volume -DriveLetter C -ReTrim -Verbose` in PowerShell.
3. **Thermal throttling on PCIe 4/5 drives.** NVMe drives under sustained write load reach 80°C and throttle. Confirm the motherboard's M.2 heatsink is fitted. If not, performance drops under load and recovers at idle.
4. **SMART attributes.** CrystalDiskInfo or the manufacturer's tool. Any warning state — reallocated sectors, pending sectors, high wear — and the drive is on borrowed time. Back up and replace.

Drives with serious degradation (slow even when empty, errors in SMART) are replaced under warranty. Don't try to "recover" a drive that's warning about end-of-life — back up the data and swap it.

## WiFi drops

Symptoms: sudden disconnections every few minutes, slow speeds, streaming that buffers constantly.

### Checklist

1. **Signal strength.** Windows Task Manager → Performance → Wi-Fi. Under 60% strength at the PC's location is marginal. Move the router, add a mesh node, or run ethernet.
2. **Channel interference.** In dense environments (flats, terraced housing), the 2.4GHz band is usually saturated. Force the laptop or PC to 5GHz or 6GHz where supported. On the router, set 5GHz to a manual channel (36, 40, 44, 48) rather than auto.
3. **Driver.** WiFi drivers matter. Intel, Qualcomm, MediaTek all release frequent updates. Manufacturer website, not Windows Update, is usually where the current driver lives.
4. **Power saving.** Device Manager → network adapter → Properties → Power Management. Untick "Allow the computer to turn off this device to save power" — aggressive power saving causes drops on desktops that aren't on battery anyway.
5. **Router firmware.** A router with 2-year-old firmware is a router with every known bug unpatched. Log in, check for updates, apply.
6. **Neighbour's interference.** A WiFi analyser app (on a phone) shows the channels nearby networks are using. Pick one that's quiet.

If drops continue after all of the above, the WiFi card may be failing — common on older laptops. An Intel AX210 / BE200 card costs under £40 and is a 15-minute swap on most laptops.

## Slow file transfers

Moving a large file between drives takes far longer than it should.

### Checklist

1. **Source drive speed.** A file coming from a USB 2.0 port or an old 5400rpm HDD is limited by the source, not the destination.
2. **Destination drive type.** Copying to a nearly-full SSD hits the SLC cache limit fast — speeds drop to native TLC or QLC rates, which can be below 500 MB/s.
3. **Cable.** A USB-C cable rated USB 2.0 carries 480 Mbps regardless of what you plug it into. Check the cable's spec.
4. **Antivirus on-access scan.** Some antivirus products scan files during copy, slowing the transfer dramatically. Temporarily exclude the source folder or pause the scanner to test.
5. **Network transfer.** 1 GbE caps at 125 MB/s; if you're getting 100–110 MB/s, that's normal. For faster network transfers, you need 2.5 GbE or 10 GbE on both ends plus the switch between them.

## Monitor flicker or wrong colour

### Flicker

1. **Cable first.** Replace with a different DisplayPort or HDMI cable. Display cables fail frequently and the symptom is exactly this.
2. **Refresh rate.** Windows Settings → Display → Advanced. Set the refresh rate to the monitor's rated value. Some monitors auto-negotiate to a marginal rate that flickers.
3. **Adaptive sync.** G-Sync or FreeSync at low frame rates can flicker in some games — LFC (Low Framerate Compensation) helps but not always. Try disabling sync to test.
4. **GPU driver.** Clean install with DDU as above.

### Wrong colour

1. **Cable.** Some HDMI cables carry RGB Limited (16–235) rather than RGB Full (0–255), which makes everything look washed out or crushed. In the GPU control panel, set output to RGB Full.
2. **ICC profile.** A left-over profile from previous monitor calibration applies wrong correction. Windows Settings → Display → Color management → remove old profiles.
3. **HDR mode.** Windows HDR on a non-HDR monitor, or without the right Windows calibration, looks wrong. Disable HDR or calibrate properly with the Windows HDR Calibration app.

## Weird fan noise

### Clicking or ticking

A fan blade hitting a cable tie, a loose screw, or debris. Stop the fan by hand while it spins down — identify which fan, check for obstructions.

### Whining or whirring

Bearing failure. Fluid-dynamic and hydraulic bearings are quiet when new and whine as they dry out — typical lifespan 5–8 years. Sleeve bearings are shorter-lived. Replace the fan; on GPUs, aftermarket replacement fans are available for most cards.

### Buzzing (electrical)

Not mechanical — coil whine from VRMs on GPU or motherboard. Higher frame rates usually make it worse. Capping FPS with V-Sync or a frame limiter usually reduces or eliminates the noise. If coil whine is audible at idle, it's often the PSU — a warranty case.

### Rattling

Loose fan mounting or a fan grille touching a fan blade. Tighten mounts; slide a finger between the fan frame and the grille/radiator.

## "Do I need to reapply thermal paste?"

Paste dries out over time, but "dried paste" is a less frequent cause of temperature issues than most forums suggest.

### Good reasons to repaste

- The machine is 3+ years old and temperatures have crept up 8°C or more compared to when new.
- The cooler has been removed and reinstalled for any reason (cleaning, GPU swap that bumped the CPU cooler).
- The machine is under AV Care Plus and due for its annual service.

### Not a reason to repaste

- It's been a year and you've read online that you should.
- Temperatures are fine, but you're worried.
- The CPU reaches 85°C under full sustained multi-thread load — that's within normal range for current high-core-count chips.

Good paste (Arctic MX-6, Noctua NT-H2, Thermal Grizzly Kryonaut) gives you 5–7 years before it's dry enough to matter. AV Care Plus includes the annual repaste as part of the preventative service; without it, every 3 years is a reasonable schedule for a heavily-used machine.

## Refurbished machine arrived — what to check first

A BAV refurbished unit has already been through 24-hour burn-in on the bench. The checks below are quick confirmations rather than full diagnostics.

### In the first hour

1. **Inspect the outside.** Any courier damage to the box should be noted before unboxing. Any damage to the machine itself should be photographed immediately and reported.
2. **Check the birth certificate.** Inside the box, a printed sheet with the build number, builder name, burn-in temperatures, and shipping date. Verify the serial number on the back of the machine matches.
3. **First boot.** The machine boots to a fresh Windows install with manufacturer drivers. Complete the Windows setup with your own account — the machine isn't tied to any prior user.

### In the first day

1. **Run the hardware inventory.** Device Manager → scan every category. Everything should have a driver installed and no yellow warning icons. If anything does, the manufacturer's driver package is usually already on the desktop or in `C:\Drivers\`.
2. **Install your software.** Games, productivity apps, whatever you use.
3. **Stress test briefly.** Run a 30-minute 3DMark Time Spy loop or similar. Temperatures should match what's written on the birth certificate, within a few degrees. Differences above 10°C warrant a support conversation — usually it's case airflow in the customer's room, occasionally shipping has shifted a cooler.

### In the first week

1. **Register for warranty.** The 12-month warranty runs from delivery date automatically — no registration needed for it to apply, but registering puts the unit on the AV Care dashboard if you subscribe.
2. **Decide on AV Care.** The 30-day free trial is available from delivery — if you're going to take it, start it now rather than later, because accidental damage cover runs from day one.

Anything that doesn't match the burn-in figures on the certificate, any component with suspicious behaviour, or any boot issue — contact support. We have the build history for every unit we ship and can usually diagnose from the conversation alone.
