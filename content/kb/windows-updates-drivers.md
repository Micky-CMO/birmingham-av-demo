---
title: Windows Updates and Drivers
category: windows
updated: 2026-04-19
tags: [windows-update, wu-reset, drivers, inf, whql, dch, device-manager, ddu, pnp, ghost-devices]
---

Updates and drivers are the two most common sources of recurring Windows issues. This file covers Windows Update troubleshooting, driver install order, driver rollback, and the cleanup tools that matter.

## Windows Update failure triage

Most WU failures fall into a small number of categories. Work through the steps in order — each is less disruptive than the one after it.

### Step 1 — Run the troubleshooter

Settings → System → Troubleshoot → Other troubleshooters → Windows Update → Run. The built-in troubleshooter handles the majority of common issues automatically — reset service states, clear stuck packages, re-register components. On current Windows 11 the same tool sits at Settings → System → Troubleshoot → Get help with Windows Update.

### Step 2 — Check the service states

Four services must be running for Windows Update:

- **Windows Update (wuauserv).** The main update service.
- **Background Intelligent Transfer Service (BITS).** Downloads updates in the background.
- **Cryptographic Services (CryptSvc).** Validates update signatures.
- **Windows Installer (msiserver).** Installs MSI-based components.

Check all four:

```powershell
Get-Service -Name wuauserv, bits, cryptSvc, msiserver | Format-Table Name, Status, StartType
```

Any not running or set to Disabled:

```powershell
Set-Service -Name wuauserv -StartupType Manual
Start-Service -Name wuauserv
```

Repeat for each stopped service.

### Step 3 — Check free disk space

Windows Update needs several GB of free space on the system drive for download + extraction + install. Feature updates need more — 20GB minimum for a Windows 11 feature update.

Clear space with Disk Cleanup (Windows+R → `cleanmgr`) → Clean up system files. Particularly useful: Previous Windows installation(s), Windows Update Cleanup, Temporary files.

### Step 4 — WU components reset (the full sequence)

When the simpler steps fail, the full reset clears the update cache and re-registers services. Run from an elevated Command Prompt:

```cmd
net stop wuauserv
net stop cryptSvc
net stop bits
net stop msiserver
ren C:\Windows\SoftwareDistribution SoftwareDistribution.old
ren C:\Windows\System32\catroot2 catroot2.old
net start wuauserv
net start cryptSvc
net start bits
net start msiserver
```

What each step does:

- `SoftwareDistribution` holds the download cache and update database. Renaming forces Windows to rebuild it.
- `catroot2` holds signature catalogue files. Renaming forces regeneration.
- Starting services after the rename creates fresh versions of both folders.

After running, go to Settings → Update and run Check for updates. The first check after a reset takes longer than normal — Windows is re-populating what it lost.

### Step 5 — DISM and SFC for component store repair

If Updates still fail with HRESULT codes like 0x80073712 or 0x800F081F, the component store is damaged:

```cmd
DISM /Online /Cleanup-Image /RestoreHealth
sfc /scannow
```

Run in that order. See the BSOD guide for the detailed DISM + SFC sequence including offline source handling.

### Step 6 — Reset Windows Update with an MSI installer approach

If components keep failing, the Microsoft "wushowhide.diagcab" troubleshooter hides problem updates so they stop retrying. Not always available — Microsoft has deprecated the tool on newer Windows 11 builds. When it's available, it's useful for blocking a specific bad update while allowing others.

### Step 7 — In-place upgrade

When all of the above fail, an in-place upgrade reinstalls Windows over itself, keeping files and apps. Download the Windows 11 Media Creation Tool, run `setup.exe` from within Windows, pick "Keep personal files and apps". The upgrade resets update components as part of the process.

## Driver install from INF

Windows normally installs drivers through the `.exe` installer the manufacturer ships. When the installer won't run, or the right driver isn't among the available Windows Update options, install from the INF directly.

### Procedure

1. Download the driver package. Some are `.exe` self-extractors; some are `.zip`.
2. If self-extracting, use 7-Zip to extract without running the installer.
3. Look for the `.inf` file in the extracted folder — often several. The correct INF matches the device by PCI vendor / device ID.
4. Device Manager → right-click the target device → Update driver.
5. Browse my computer for drivers.
6. **Let me pick from a list of available drivers on my computer.**
7. Have Disk → navigate to the folder containing the INF files → select the correct INF.

### Finding the right INF

If several INFs are in the package, narrow by matching the device's PCI ID:

1. In Device Manager, right-click the device → Properties → Details tab.
2. Property dropdown → "Hardware Ids".
3. The first line looks like `PCI\VEN_10DE&DEV_1E07&SUBSYS_26F11458`.
4. Open each INF in a text editor, search for `DEV_1E07` or similar. The matching INF is the right one.

### When to install from INF rather than the vendor installer

- The installer refuses on a supposedly-incompatible OS version (Windows 11 vs Windows 10) but the driver itself is generic.
- The installer installs a pile of utility software you don't want alongside the driver.
- You're installing onto a non-standard Windows build where the installer's checks fail.

## Rolling back drivers

Device Manager → device → Properties → Driver tab → Roll Back Driver.

### When the Roll Back button is greyed out

- **Only one driver has been installed.** Windows only keeps the previous version, so if the current is the first, there's nothing to roll back to.
- **Previous driver has been purged.** After a disk cleanup or time-based retention, the previous package may be gone. No rollback possible.
- **Driver installed via .exe installer.** Some vendor installers replace the driver in place without creating a rollback entry. No rollback available through Device Manager.

When Roll Back isn't available but you need to revert:

1. Download the specific older version from the vendor's archive.
2. Uninstall the current driver (Device Manager → right-click → Uninstall device → tick "Delete the driver software").
3. Reboot. Windows reinstalls a generic driver.
4. Install the target older version manually.

## WHQL vs beta drivers

### WHQL (Windows Hardware Quality Labs)

Drivers that have passed Microsoft's compatibility testing. Digitally signed by Microsoft. The ones Windows Update ships, and the ones marked "WHQL" on vendor download pages.

- **Default choice for production systems.** Stable, signed, supported.
- **Lag behind feature releases.** The newest driver with a brand-new feature may not yet be WHQL-certified; the WHQL equivalent follows a few weeks later.

### Beta / pre-release drivers

Not yet certified. Vendor-signed, not Microsoft-signed.

- **Right choice when:** a specific bug in the WHQL driver affects you and the fix is only in beta, or a new game or application requires features only in the latest beta.
- **Wrong choice when:** the system is stable and you're installing beta for no concrete reason.

For NVIDIA specifically, the "Game Ready" and "Studio" drivers are both WHQL; the branching is by audience (games vs creative apps), not by testing depth. Both can be trusted on production systems.

### When it actually matters

Modern systems handle non-WHQL drivers fine; Windows will warn about unsigned drivers during install but accepts signed-by-vendor-only. The real difference: WHQL drivers survive Windows rollback points more reliably, and Microsoft support will ask about driver status for enterprise tickets.

## DCH vs legacy drivers

### DCH — Declarative, Componentised, Hardware Support Apps

The modern driver model. Core driver ships separately from optional utilities (control panel, overlays, streaming). The utilities install from the Microsoft Store or a separate vendor installer.

- **NVIDIA Standard drivers (legacy).** All-in-one — driver plus NVIDIA Control Panel plus GeForce Experience.
- **NVIDIA DCH drivers.** Core driver only; NVIDIA Control Panel installs separately from the Microsoft Store.
- **Intel DCH.** Graphics Command Center instead of the old Intel Graphics Control Panel.

### Which to use

Current Windows 11 effectively requires DCH for new installs. NVIDIA's Standard drivers are end-of-life for hardware from RTX 20 series onwards. When downloading from the NVIDIA site, leave the default DCH selection.

### Mixing DCH and Standard

Don't. Uninstall cleanly (DDU) before switching types. A Standard driver installed over a DCH driver, or vice versa, breaks the control panel and potentially the driver itself.

## PnP enumeration — ghost devices and hidden devices

Plug-and-Play (PnP) tracks every device that's ever been connected to the system. Disconnected devices become "ghosts" — driver still installed, device not currently present. Sometimes these cause conflicts.

### Seeing hidden devices

Device Manager → View → Show hidden devices. Ghost devices appear greyed-out.

### Cleaning up reliably

For thorough cleanup, use DevCon (Microsoft's command-line PnP tool, part of the Windows Driver Kit) or Ghostbuster (a GUI tool that wraps DevCon for ghost removal).

Useful when:

- A replaced network adapter keeps throwing conflicts because its MAC address is registered to an old driver.
- USB devices in different ports each create their own device entry and the list grows.
- Removed storage drives leave behind controller entries.

Removing ghost devices isn't automatic — Windows keeps them for a reason (returning the device lets it work immediately without driver reinstall). Clean up specifically when a ghost is causing a problem.

### Removing a specific ghost device

1. Device Manager → View → Show hidden devices.
2. Expand the relevant category (Network adapters, Storage controllers, USB devices).
3. Right-click the greyed-out device → Uninstall device.
4. Tick "Delete the driver software for this device" if removing completely.
5. Click Uninstall.

## Driver install order — chipset first, GPU last

The right install order on a fresh Windows install saves hours of debugging. Each step should complete before the next.

### The order

1. **Chipset drivers (motherboard manufacturer).** Intel Chipset Utility or AMD Chipset Driver. These register the chipset with Windows, enable proper CPU support, and configure PCIe devices. Everything else depends on this foundation.
2. **LAN / Ethernet driver.** So Windows Update can reach the internet directly.
3. **Management Engine (Intel) / PSP (AMD).** Management firmware interface. Intel calls it ME; AMD calls it PSP. Often bundled with chipset driver; sometimes separate.
4. **SATA / NVMe / RST driver.** Intel Rapid Storage Technology if applicable. Improves storage performance.
5. **Windows Update — let it run a full cycle.** Windows will download generic drivers and Microsoft-approved updates for what's present. Running this now, with chipset already in place, means Windows gets correct hardware identification.
6. **Audio driver.** Realtek or similar.
7. **Wi-Fi / Bluetooth driver.** Intel, Qualcomm, MediaTek — from the vendor's site.
8. **USB controllers if any are non-standard.** Most don't need drivers; dock controllers and some Thunderbolt setups do.
9. **GPU driver, last.** NVIDIA / AMD / Intel Arc. Install after everything else is stable. Use the clean install option in the driver package.
10. **Vendor utilities if required.** Motherboard software (Armoury Crate, iCUE, etc) last of all, or not at all — most are optional.

### Why this order

- Chipset first means later drivers have the right platform to install against.
- LAN before Windows Update means Windows can see the internet.
- GPU last means the GPU driver can enumerate every PCIe device correctly; installing it before chipset sometimes leads to display enumeration issues.
- Vendor utilities last means they don't interfere with core driver installs.

### Common mistakes in order

- Installing GPU driver first (before chipset) — works, but sometimes creates display-output enumeration quirks that only clean-install fixes.
- Running Windows Update immediately after a fresh install — Windows installs generic chipset drivers that then get overwritten by the proper Intel / AMD ones, sometimes triggering restart loops or driver conflicts.
- Installing motherboard utilities (iCUE, Armoury Crate, Dragon Center) before stabilising the base system — these utilities install services and drivers that can mask underlying issues.

## DDU — Display Driver Uninstaller

Display Driver Uninstaller from Wagnardsoft is the cleanup tool for graphics drivers. Normal "uninstall" leaves registry entries, leftover files, custom settings, and shader cache that persist across reinstalls.

### When to use DDU

- Persistent graphics issues after a driver reinstall didn't fix anything.
- Switching between NVIDIA, AMD, or Intel GPU brands.
- Switching between NVIDIA Standard and DCH driver types.
- Cleaning a refurbished system that came with leftover driver state from a previous configuration.
- After a driver crash where Windows safe-failed the driver and the next install won't "take" cleanly.

### When DDU is overkill

- Routine driver updates on a working system. The installer's "Clean install" checkbox is enough.
- Troubleshooting non-graphics issues. Don't wipe drivers randomly.

### The DDU procedure

1. Download DDU from Wagnardsoft.
2. Download the target driver package first, keep it on the desktop.
3. Disconnect from the internet — prevents Windows Update reinstalling a GPU driver while you work.
4. Boot into Safe Mode (Settings → Recovery → Advanced startup → Restart → Troubleshoot → Advanced → Startup Settings → 4).
5. In Safe Mode, run DDU as Administrator.
6. Select the GPU vendor (NVIDIA, AMD, or Intel).
7. Click "Clean and restart (highly recommended)".
8. System reboots. Windows will have a generic display adapter.
9. Install the target driver package from the desktop.
10. Reconnect to the internet.

### Network driver cleanup

DDU's sibling approach for network drivers uses `pnputil` directly rather than a dedicated GUI tool. For network issues where driver corruption is suspected:

```powershell
pnputil /enum-drivers
```

Lists all third-party drivers. Find the network driver's Published Name (the one starting with `oem##.inf`).

```powershell
pnputil /delete-driver oem12.inf /uninstall /force
```

Replace `oem12.inf` with the actual name. Reboot. Windows reinstalls the generic Microsoft driver; install the target vendor driver manually from there.
