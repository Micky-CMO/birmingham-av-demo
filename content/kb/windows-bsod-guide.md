---
title: Windows BSOD — Diagnostic Methodology
category: windows
updated: 2026-04-19
tags: [bsod, stop-code, safe-mode, winre, event-viewer, reliability-monitor, windbg, dism, sfc, memtest86, driver-verifier, clean-boot]
---

This file is the methodology for diagnosing blue screens, not a code lookup. Given a customer with a BSOD, work through the stages in order. Skip stages that don't apply — if the customer can still reach Windows normally, don't send them to WinRE.

## Stage 1 — Read the stop code

Every blue screen has two pieces of information that matter: the **stop code** (a bugcheck number like 0x00000124) and the **bugcheck string** (a name like WHEA_UNCORRECTABLE_ERROR or PAGE_FAULT_IN_NONPAGED_AREA).

### Where to find them

On Windows 10/11 the blue screen shows:

- A friendly message ("Your PC ran into a problem...").
- A QR code linking to a Microsoft support page.
- The stop code name at the bottom in capitals.

After the reboot, Windows writes a log entry to Event Viewer → Windows Logs → System with source **BugCheck**. The full stop code (all eight hex digits) is there, plus the four parameters that accompany it. These parameters are critical — two stop codes with the same name but different parameters can have different causes.

### Quickly gathering the evidence

The customer doesn't need to copy the entire screen. Ask for:

1. The stop code name (e.g. DRIVER_IRQL_NOT_LESS_OR_EQUAL).
2. The hex code if visible (e.g. 0x000000D1).
3. Any filename shown in brackets (e.g. `Netwtw08.sys`) — this is often the offending driver.
4. Roughly when it started and what was running at the time.

## Stage 2 — Safe Mode

Safe Mode boots Windows with only essential drivers and services. If the system is stable in Safe Mode and crashes in normal mode, the problem is a third-party driver, service, or startup item — not the base OS.

### Entering Safe Mode from a running Windows

1. Settings → System → Recovery → Advanced startup → Restart now.
2. After reboot: Troubleshoot → Advanced options → Startup Settings → Restart.
3. After the next reboot, press `4` for Safe Mode, `5` for Safe Mode with Networking, or `6` for Safe Mode with Command Prompt.

### Entering Safe Mode when Windows won't boot

Force three consecutive boot failures — power the machine, and as soon as the Windows logo appears, hold the power button until it cuts off. On the third failed boot, Windows automatically enters the Automatic Repair environment. From there: Advanced options → Startup Settings → follow the steps above.

### Which Safe Mode to use

- **Safe Mode (option 4).** Minimal drivers, no networking. Use when diagnosing driver crashes or installing drivers locally.
- **Safe Mode with Networking (option 5).** Adds basic network drivers. Use when you need to download drivers or run online tools.
- **Safe Mode with Command Prompt (option 6).** Boots to a command prompt rather than the desktop. Use when Explorer itself is corrupted or when running repair commands.

## Stage 3 — WinRE when the system won't boot

The Windows Recovery Environment (WinRE) is a minimal Windows installation used for repairs. It runs from a separate partition or from installation media.

### Access methods

1. **Automatic.** Three failed boots trigger it automatically (see Safe Mode section).
2. **From installation media.** Boot from a Windows USB, click "Repair your computer" on the install screen.
3. **From the boot options menu.** Settings → System → Recovery → Advanced startup → Restart now.

### What WinRE gives you

- **Startup Repair.** Automatic fix for boot loader and BCD issues. Run this first for boot problems.
- **Uninstall Updates.** Removes the most recent quality or feature update. Useful if crashes started after an update.
- **System Restore.** Rolls back to a restore point.
- **Command Prompt.** Full command-line access to run `bootrec`, `sfc`, `DISM`, `chkdsk`, `bcdedit`.
- **UEFI Firmware Settings.** Reboot straight into BIOS / UEFI without waiting for a POST prompt.

### System drive letter in WinRE

In WinRE, the Windows drive is often assigned a different letter — typically `D:` or `E:` rather than `C:`. List volumes first:

```cmd
diskpart
list volume
exit
```

Use the correct drive letter for subsequent commands. Running `sfc /scannow` in WinRE requires specifying the offline Windows and boot directories:

```cmd
sfc /scannow /offbootdir=C:\ /offwindir=C:\Windows
```

## Stage 4 — Event Viewer

Every BSOD generates corroborating entries in Event Viewer. These often say more than the blue screen itself.

### The four severity levels

- **Critical.** System failures like BSODs. The BugCheck entry lives here.
- **Error.** A significant failure — service failed to start, driver couldn't initialise.
- **Warning.** Non-fatal but notable — unexpected condition, degraded performance.
- **Information.** Normal operation events. Rarely useful for BSOD diagnosis.

### Where to look

- **Windows Logs → System.** The main log for OS and hardware events. Filter by source "BugCheck", "disk", "volmgr", "nvlddmkm", "WHEA-Logger", or specific driver names.
- **Windows Logs → Application.** For application crashes and .NET errors. Look for Application Error and .NET Runtime entries.
- **Applications and Services Logs → Microsoft → Windows → Kernel-Power.** Power transitions, sudden shutdowns (Event ID 41 is "system rebooted without cleanly shutting down first").

### Filtering to the right timeframe

In the log: right-click → Filter Current Log → set timeframe to around the crash. Filter by level (Critical, Error, Warning). This typically reduces thousands of entries to a handful, showing the exact sequence of events leading up to the crash.

### Key Event IDs to know

- **Event ID 41 (Kernel-Power).** The system restarted without shutting down cleanly. Usually a BSOD or power loss.
- **Event ID 1001 (BugCheck).** The BSOD itself, with stop code and parameters.
- **Event ID 6008 (EventLog).** Unexpected shutdown.
- **Event ID 129 (storahci / stornvme).** Storage controller timeout — drive not responding.
- **Event ID 157 (disk).** Disk has been surprise removed — cable or connection issue.
- **Event ID 11 (disk).** Controller error on disk — SMART warning level event.
- **Event ID 153 (disk).** IO operation retried — an early sign of drive failure.

## Stage 5 — Reliability Monitor

Reliability Monitor gives a visual timeline of the system's stability. Much faster than Event Viewer for initial triage.

Open it: `perfmon /rel` from Run, or Control Panel → Security and Maintenance → View reliability history.

### What it shows

A graph of stability scores by day. Red crosses mark critical events (BSODs, hard hangs). Yellow triangles mark warnings (application crashes, update failures). Blue circles mark informational events (successful installs).

Click any day to see the events that occurred, with summary details. Clicking "View technical details" opens the full error text — often named drivers, specific modules, or exact failure descriptions.

### Using it for triage

1. Open Reliability Monitor.
2. Look for the pattern — are crashes clustered around a specific date? If so, what was installed that day?
3. Click the earliest red cross. Note the named module or application.
4. Click subsequent crashes. If the same module repeats, that's the target. If different modules each time, the issue is more likely hardware than software.

## Stage 6 — Dump file analysis

Windows writes a memory dump when it bluescreens. The dump contains the state of the kernel at the moment of failure — which driver was running, which functions were on the stack, what exception occurred.

### Dump types

- **Mini dump (small).** 256KB, in `C:\Windows\Minidump\`. Enough for basic analysis. Enabled by default.
- **Automatic memory dump.** Several hundred MB, in `C:\Windows\MEMORY.DMP`. Contains more context.
- **Complete memory dump.** Size of physical RAM, in `C:\Windows\MEMORY.DMP`. Enable only if the minidump isn't enough.

### Configuring dump settings

Right-click This PC → Properties → Advanced system settings → Advanced tab → Startup and Recovery → Settings. Set "Write debugging information" to "Automatic memory dump" for a good balance.

### BlueScreenView — the fast path

NirSoft's BlueScreenView is the quickest way for most customers to read a dump. It opens every minidump in the folder automatically, highlights the driver likely responsible, and shows the stop code, parameters, and caused-by module for each one.

- Download BlueScreenView from NirSoft.
- Run it — it scans `C:\Windows\Minidump\` automatically.
- The top pane lists crashes by date. The bottom pane shows all drivers loaded at crash time, with the "caused by" driver highlighted in red.

### WinDbg — deeper analysis

Microsoft's WinDbg is the professional tool. Install from the Microsoft Store (WinDbg) or as part of the Windows SDK.

Basic workflow:

1. Launch WinDbg.
2. File → Open Dump File → select the `.dmp` from `C:\Windows\Minidump\`.
3. Set the symbol path:
   ```
   .sympath SRV*C:\Symbols*https://msdl.microsoft.com/download/symbols
   ```
4. Reload symbols:
   ```
   .reload
   ```
5. Run analyser:
   ```
   !analyze -v
   ```

The output identifies the bugcheck, the failing instruction, and usually the offending driver. For customers doing this themselves, BlueScreenView is almost always sufficient.

## Stage 7 — DISM + SFC in the right order

System File Checker (SFC) and Deployment Image Servicing and Management (DISM) repair Windows system files. Run them in the correct order or SFC has nothing to repair against.

### The three-step sequence

Open Command Prompt as Administrator (or PowerShell):

1. Run SFC to see if problems exist:
   ```cmd
   sfc /scannow
   ```
2. Repair the component store so SFC has good source files to copy from:
   ```cmd
   DISM /Online /Cleanup-Image /RestoreHealth
   ```
3. Run SFC again — this time it can actually fix what it finds:
   ```cmd
   sfc /scannow
   ```

### Why the order matters

SFC copies files from the WinSxS component store to replace corrupt ones. If the component store itself is damaged, SFC has nothing to copy. DISM repairs the component store by downloading clean source files from Windows Update. Running SFC without DISM first means SFC finds corrupt files it can't actually fix.

### When DISM fails

If DISM reports it can't reach Windows Update, provide an offline source — a mounted Windows ISO of the same version:

```cmd
DISM /Online /Cleanup-Image /RestoreHealth /Source:WIM:D:\sources\install.wim:1 /LimitAccess
```

`D:` here is the drive letter of the mounted ISO. The `:1` is the image index. List indices with:

```cmd
DISM /Get-ImageInfo /ImageFile:D:\sources\install.wim
```

### Reading the SFC log

SFC writes results to `C:\Windows\Logs\CBS\CBS.log`. Extract the SFC-relevant lines:

```cmd
findstr /c:"[SR]" C:\Windows\Logs\CBS\CBS.log > %userprofile%\Desktop\sfc.log
```

Open `sfc.log` on the desktop — each line starting `[SR]` is a result. "Cannot repair member file" entries name the specific files SFC couldn't fix.

## Stage 8 — Test the RAM

Bad RAM causes a wide range of stop codes, particularly 0x50, 0x4E, 0x1A, 0x9F, 0x124, 0x139. If a BSOD points at memory even indirectly, test it before replacing anything else.

### MemTest86

Download MemTest86 from memtest86.com (the free version is the Community Edition). Write it to a USB stick with their ImageUSB tool.

Boot from the USB. It runs through 13 test patterns covering different memory access patterns.

- **One full pass takes 30 minutes to 2 hours** depending on memory size and speed.
- **Run four complete passes minimum.** Errors sometimes only show after several hours.
- **Any error at all means bad RAM or bad memory controller.** A single error is not within margin — RAM either works or doesn't.

### Isolating which stick is faulty

If MemTest finds errors:

1. Power off, remove all sticks except one.
2. Boot with that one stick in slot A2 (usually the second slot from the CPU).
3. Run MemTest on that stick for at least two passes.
4. If clean, swap to the next stick. If it errors, that stick is the faulty one.
5. If all sticks test clean individually but errors return with multiple sticks, the memory controller (CPU or motherboard) may be the issue, or the memory profile is unstable at the combined speed.

## Stage 9 — Driver Verifier

When dump files consistently point at "ntoskrnl.exe" or "unknown" without naming a specific driver, Driver Verifier forces aggressive checking on all third-party drivers to expose the real culprit.

### Starting Driver Verifier

Run `verifier` as Administrator. In the wizard:

1. Choose "Create custom settings (for code developers)".
2. Tick: Special pool, Pool tracking, Force IRQL checking, Deadlock detection, Security checks, Miscellaneous checks, DDI compliance checking.
3. Next page: "Select driver names from a list".
4. Select all non-Microsoft drivers (sort by Provider, untick everything from "Microsoft").
5. Finish and reboot.

### What happens next

Verifier makes the system much stricter. A driver that was skating by with minor errors will now crash the system within hours or days.

- If the system BSODs quickly, the new dump names the specific bad driver.
- If it runs stable for a few days with Verifier on, that driver set is probably fine.

### Stopping Driver Verifier

Critical — leaving Verifier on permanently will continue to crash the system. Stop it with:

```cmd
verifier /reset
```

Then reboot. If the system won't boot with Verifier enabled (possible if a driver crashes during early boot), boot into Safe Mode and run the reset command there.

## Stage 10 — Roll back vs clean install drivers

Drivers can be reverted or replaced. Picking the right approach matters.

### Roll back

Device Manager → right-click device → Properties → Driver tab → Roll Back Driver. Reverts to the previously installed driver. The button is **greyed out** if:

- Only one driver version has been installed on this device.
- Windows has already discarded the previous version (after an uninstall or some time).

### Clean install (with DDU for graphics)

For GPUs specifically, Display Driver Uninstaller (DDU) removes not just the driver but every trace — registry entries, leftover files, and custom settings. Essential when symptoms persist after a normal driver reinstall.

1. Download the target driver version first (from NVIDIA or AMD).
2. Download DDU from Wagnardsoft.
3. Disconnect from the internet (prevents Windows Update from reinstalling a driver while you work).
4. Boot into Safe Mode.
5. Run DDU → select GPU vendor → "Clean and restart".
6. After reboot, install the target driver package.
7. Reconnect to the internet.

### Clean install via Windows

For other devices, uninstall from Device Manager (right-click → Uninstall device → tick "Delete the driver software" where available). Reboot. Windows reinstalls a generic driver. Then install the manufacturer-specific driver from their website.

## Stage 11 — Clean boot

A clean boot starts Windows with only Microsoft services. If the system is stable with all third-party services disabled and crashes return when they're enabled, a third-party service is the cause.

### Procedure

1. `msconfig` (System Configuration).
2. Services tab → tick "Hide all Microsoft services" → click Disable all.
3. Startup tab → Open Task Manager → disable everything on the Startup tab.
4. Apply, OK, reboot.

If stable in clean boot, re-enable services in halves — enable the top half in Services, reboot. If still stable, re-enable the second half. Whichever half causes the crash contains the culprit — bisect further until one service is identified.

To return to normal: `msconfig` → General tab → "Normal startup".

## Decision tree — hardware fault vs driver vs OS corruption

This is the flow an agent should walk through when the customer has a recurring BSOD:

### Is the stop code hardware-leaning?

**Hardware-leaning codes:** 0x124 (WHEA), 0x4E (PFN list), 0x50 (page fault), 0x24 (NTFS), 0x101 (clock watchdog), 0x139 (kernel security check), 0x9C (machine check).

If yes → test RAM first, then check drive SMART, then check temperatures.

### Is a specific driver named in the dump?

Yes → update or roll back that driver, then DDU clean install for graphics drivers.

### Is the crash reproducible by a specific action?

Yes and the action is in-app → update that app, check logs for the app's own errors.
Yes and the action is sleep/wake → driver power state issues, usually GPU or network.
Yes and the action is launching a specific game → GPU driver clean install, game file verification.

### Does the crash happen at random during idle?

Usually RAM or PSU. MemTest86, and swap PSU if available.

### Does the crash happen only under load?

Thermal throttling → check temperatures, clean dust, possibly repaste.
PSU under-delivery → size check the PSU against the components.

### Does the crash happen after a Windows Update?

Uninstall the most recent update. If stable, block the specific update until the fix ships.

### Does the system pass all hardware tests and no driver is named?

Run DISM + SFC, then consider in-place upgrade. If even that doesn't resolve, a clean install is the answer.
