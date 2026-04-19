---
title: Windows Performance Triage
category: windows
updated: 2026-04-19
tags: [task-manager, resource-monitor, startup, telemetry, pagefile, disk-usage, thermal-throttling, power-plan]
---

"My PC is slow" is one of the most common support questions. This file is a methodology for diagnosing it — where to look, what each tool tells you, when to reach for which command. Not opinions. The agent should walk the customer through tools in order rather than guessing at causes.

## Stage 1 — Task Manager as first triage

Task Manager's Performance and Processes tabs are the fastest view of what's consuming resources. Open with Ctrl+Shift+Esc.

### Processes tab

Four columns matter: CPU, Memory, Disk, Network. Click any column header to sort descending. The process at the top of each column is the heaviest consumer in that category.

- **CPU at 100% across all cores but a single app below 20%.** System-wide load is from multiple smaller processes. Look further — Resource Monitor or autoruns.
- **One app at 80%+ CPU.** That app is the cause. Either it's misbehaving (close it, check for updates) or it's doing legitimate heavy work (rendering, compiling, antivirus scan).
- **Memory at 90%+.** Sort by memory, identify the top consumers. Chrome / Edge with many tabs is a common finding. If legitimate, the machine may need more RAM.
- **Disk at 100%.** See the dedicated disk section below — this is its own diagnostic flow.
- **Network high on an idle-looking system.** Check Processes for the named culprit. Common causes: Windows Update, OneDrive sync, Steam / Epic background downloads, Dropbox.

### Performance tab

Visual graphs for CPU, Memory, Disk, Network, GPU. The graphs show trends over the last 60 seconds.

- **CPU.** Shows usage per logical core if "Change graph to → Logical processors" is selected. Uneven usage (one core maxed, others idle) points at a single-threaded bottleneck. Step-change drops to base clock under load = thermal throttling.
- **Memory.** Shows used, cached, available, and committed. If committed ≫ RAM size, the system is heavily paging.
- **Disk.** Shows active time %, response time in ms, read/write in MB/s. High active time with low throughput = many small I/O operations (typically Windows Search indexing, antivirus, SuperFetch).
- **GPU.** Shows 3D, Copy, Video Decode, Video Encode usage, plus dedicated and shared memory. A high 3D % in an idle-looking system points at a game or miner running in the background.

### Startup impact column

Task Manager → Startup tab. Windows estimates each startup entry's impact. Sort by Startup impact → disable anything marked "High" that you don't need at login.

Disabling here doesn't uninstall — it just removes from auto-start. Re-enable any that turn out to be needed.

## Stage 2 — Resource Monitor for per-process IO

When Task Manager shows high disk or network but you want to see exactly which files and connections:

```cmd
resmon
```

Or Start → type "Resource Monitor".

### Disk tab

Shows every active disk I/O operation, which process initiated it, and which file is being accessed. Essential for diagnosing high disk usage. Common patterns:

- **`MsMpEng.exe` reading many files.** Windows Defender scanning. Normal during scheduled scans, but constant activity may mean the scan isn't completing or a scan is running on every file change.
- **`System` reading `$MFT` or `pagefile.sys`.** Filesystem or memory pressure activity. Normal in low-memory situations.
- **`SearchIndexer.exe` reading user folders.** Windows Search indexing. First run after an OS install or major change can take hours.
- **`BackgroundTaskHost.exe` on a runtime DLL.** Windows scheduled tasks. Check Task Scheduler if this persists.

### Network tab

Shows TCP connections by process, with remote address and bytes sent/received. Useful for identifying background syncs, phone-home traffic, or suspicious outbound connections.

## Stage 3 — Startup and autoruns audit

The startup list visible in Task Manager is incomplete. Autoruns from Microsoft Sysinternals shows every auto-start location in Windows — scheduled tasks, services, login items, Explorer shell extensions, browser helper objects, the lot.

### Getting autoruns

Download from Microsoft Sysinternals. Run `autoruns.exe` as Administrator.

### Reading the output

Tabs categorise by auto-start type. For first-pass cleanup:

1. **Options menu → Hide Microsoft Entries.** Leaves only third-party entries.
2. **Options menu → Hide Windows Entries.** Further filters.
3. **Scan remaining entries.** Unticking an entry disables it without removing — safe to test.
4. **Unknown publisher entries.** The Publisher column shows the signer. Unsigned entries or entries from unfamiliar publishers deserve investigation — search the filename.

For safety, take a registry backup before bulk-disabling — File → Save. The .arn file restores all changes if something breaks.

## Stage 4 — Windows Search, Superfetch, telemetry

Three services that are common suspects in "PC is slow" complaints. Knowing when to disable them and when not to:

### Windows Search / SearchIndexer

Indexes files for fast Start menu and File Explorer searches. On first run (or after re-enabling), it can hammer the disk for hours.

**Leave it enabled if:** You use Start menu search heavily. Modern indexes are efficient after initial crawl.

**Disable / limit if:** You have an older spinning drive (HDD) that struggles during indexing. Reduce indexed locations: Control Panel → Indexing Options → Modify → untick large media folders.

**Full disable (rarely advised):**
```powershell
Set-Service wsearch -StartupType Disabled
Stop-Service wsearch
```

### SysMain (formerly Superfetch)

Pre-loads frequently-used applications into RAM for faster launch.

**Leave it enabled if:** The system has an HDD as the main drive. SysMain materially speeds up HDD-based systems.

**Disable if:** The system has only SSDs and shows SysMain running heavily during otherwise idle periods. SSDs are fast enough that pre-loading provides minimal benefit and the disk activity can be noticeable.

**Disable:**
```powershell
Set-Service SysMain -StartupType Disabled
Stop-Service SysMain
```

### Windows Telemetry / DiagTrack

Sends diagnostic data to Microsoft. Low impact on modern systems but occasionally spikes network or disk activity.

**Leave enabled unless:** You have compliance reasons to disable it, or you see it specifically causing problems.

**Disable (requires admin):**
```powershell
Set-Service DiagTrack -StartupType Disabled
Stop-Service DiagTrack
```

Windows may re-enable telemetry at major updates. Group Policy settings (Pro and above) provide a more permanent disable.

## Stage 5 — Page file configuration

The page file (`pagefile.sys`) is virtual memory — disk space Windows uses when physical RAM is full.

### Sizing

Windows manages the page file automatically by default. The automatic sizing is usually right — 1.5× to 3× RAM size on systems with less than 16GB, bounded smaller on systems with 32GB+.

**Leave "Let Windows manage it" on unless you have a specific reason.** Common wrong reasons people change it:

- "SSDs wear out from page file use." Modern SSDs have enormous endurance; page file writes are a tiny fraction of typical wear.
- "I have 64GB of RAM so I don't need a page file." Some Windows components and crash dumps require a page file regardless of RAM size. Disabling it breaks crash dump collection.

**Valid reasons to change:**

- **Move to a different drive** if the system drive is nearly full. Point page file at a drive with more free space: System Properties → Advanced → Performance Settings → Advanced → Virtual memory → Change.
- **Fixed size** for specific workloads (some ML frameworks, some databases) that prefer predictable swap behaviour.

### Checking current usage

Task Manager → Performance → Memory. "Committed" shows total virtual memory (RAM + page file) in use. If Committed regularly hits near the system's total (RAM + current page file), either add RAM or increase page file.

## Stage 6 — 100% disk usage diagnosis

The "100% disk usage" symptom is specific enough to have its own flow. Symptoms: Task Manager shows disk consistently pegged at 100% active time, system responds sluggishly to simple clicks, everything feels delayed.

### Common causes in order of probability

1. **Windows Update running in the background.** First boot after install, or after a large update, Windows Update can consume disk for hours. Check Settings → Update → Update history for recent activity. Wait for completion; the system returns to normal.
2. **SearchIndexer crawling.** First run indexes the full drive. Check Control Panel → Indexing Options → Status. If "Indexing complete" isn't showing, it's still working.
3. **Antivirus full scan.** Windows Defender scheduled scan, or a third-party AV. Check the AV's status pane.
4. **SysMain pre-fetching.** Usually brief bursts, but can be constant on a system with many recently-installed apps.
5. **SSD reaching end of life.** Performance collapse on an old SSD — check SMART. Reallocated sectors or pending sectors = replace.
6. **Old HDD with bad sectors.** Similar SMART check. HDDs grind with bad sectors even when idle.
7. **SATA cable or controller issue.** Cable failure, motherboard controller glitch. Swap cable and port to test.

### SSD vs HDD symptom differences

**SSD 100% with sluggish response:** Usually software (Defender, indexer) or a dying drive. Throughput numbers in Task Manager help distinguish — healthy SSD at 100% active time still pushes hundreds of MB/s. A dying SSD pegged at 100% active may show throughput under 20 MB/s.

**HDD 100% with sluggish response:** Often normal under heavy load. HDDs are slow by modern standards. Sustained 100% with low throughput (<5 MB/s) points at bad sectors.

## Stage 7 — Thermal throttling

A CPU that's been fine for months gradually gets slower as dust builds up in the cooler and paste ages. The symptom: performance collapses under sustained load, tasks that used to take 2 minutes now take 6.

### Confirming thermal throttling

Install HWiNFO or Core Temp. Start a sustained load (Cinebench, 7-Zip benchmark, a game). Watch CPU temperature and clock speed.

- **Temperature rising steadily to 100°C.** Thermal throttling territory. Clock speed drops to base and stays there.
- **Temperature stable at 85–90°C under full load.** Normal for many current CPUs. Not throttling.
- **Temperature hitting 100°C within seconds of load starting.** Cooler not seated, thermal paste failed, or pump not running on an AIO.

### HWiNFO specifically for throttling

Run HWiNFO in "Sensors only" mode. Find the CPU section and watch:

- **Core clocks.** If clocks drop below base clock under load, throttling is active.
- **Thermal throttling flags.** HWiNFO exposes a "Thermal Throttling" Yes/No flag directly — no ambiguity.
- **PL1 / PL2 limits (Intel) / PPT / TDC / EDC (AMD).** Power-limit throttling rather than thermal. Board's VRM or power limits are kicking in before heat does.

### Fixing thermal throttling

1. **Compressed air through heatsink, fans, and case filters.** 90% of the fix, 90% of the time, on a 2+ year old machine.
2. **Check case airflow.** Intake fans unobstructed, exhaust fans pulling air out. Add fans if the case has unused mounts.
3. **Repaste the CPU** if the machine is 3+ years old. See the thermal paste guidance in the hardware troubleshooting file.
4. **Check cooler mount** — an air cooler that has loosened or an AIO with a failing pump will show thermal problems with no visible dust.

## Stage 8 — Power plan impact

Windows power plans control CPU frequency scaling, sleep behaviour, and USB power management. The wrong plan can make a system feel slow.

### The three standard plans

- **Power saver.** Aggressive downclocking, USB power saving. Noticeable performance reduction. Right for extending laptop battery; wrong for a plugged-in desktop.
- **Balanced.** Downclocks when idle, ramps when needed. The default. Right for almost everyone.
- **High performance.** CPU stays at higher clocks, USB never sleeps. Slightly more responsive, noticeably more heat and noise.

### "Ultimate Performance" plan

Windows 10 Pro for Workstations and Windows 11 include an Ultimate Performance plan. Accessible via:

```powershell
powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
```

Less relevant than its name suggests — for most workloads the difference against Balanced is within margin of error. Worth trying if a specific workload feels sluggish; not worth defaulting to.

### Switching plans

- GUI: Control Panel → Power Options → select plan.
- Command line:
  ```cmd
  powercfg /list
  powercfg /setactive <GUID>
  ```

### Processor performance slider (modern settings)

Windows 11 Settings → System → Power shows a slider: Best power efficiency, Balanced, Best performance. This is the simplified equivalent of power plans. Setting to Best performance on a desktop is usually fine.

## Stage 9 — Background process audit

A system cluttered with vendor update utilities, OEM "helper" apps, and abandoned installer processes runs worse than a clean one.

### What to look for

Task Manager → Details tab. Sort by Memory or CPU. Things to investigate:

- **Multiple copies of browser processes on a system nobody's using.** Leftover from crashes. Restart the browser.
- **Vendor updater services (AsusUpdateService, DellClient*, etc).** Usually fine to leave enabled but check they're not hanging in a loop.
- **"Nahimic", "Sonic Studio", "Realtek", "Creative" audio helpers.** These often install alongside motherboard drivers. Commonly remove-able without losing audio functionality.
- **Manufacturer bloatware.** On a factory laptop, dozens of utilities install by default. On a refurbished BAV machine, we strip these before shipping.

### Uninstalling cleanly

- Settings → Apps → Installed apps → sort by size, name, or install date.
- For genuinely problematic leftovers, Revo Uninstaller (free version) removes registry entries and leftover files.
- For vendor bloat that reinstalls itself, check Task Scheduler for scheduled reinstall tasks.

## Stage 10 — When a clean install is the answer

Some systems are beyond reasonable triage. After years of installs, uninstalls, failed updates, and accumulated cruft, a clean Windows install is faster than further diagnosis.

### Signs a clean install is warranted

- Boot time measured in minutes rather than seconds on modern hardware.
- Persistent 100% disk or CPU usage despite the full triage above.
- Errors that SFC + DISM can't repair, and whose root cause isn't obvious.
- Multiple overlapping security products fighting each other.
- System is 4+ years old with the same Windows install throughout.

### In-place upgrade as an alternative

Before full wipe, try the in-place upgrade: download the Windows installation media for the same version, run setup.exe from within Windows, choose "Keep personal files and apps". This reinstalls the OS over itself, replacing system files while preserving user data and installed applications. Fixes most system corruption without requiring a full reinstall.

### Backing up before clean install

Even "keep files" paths can fail. Before any major repair:

- User documents — OneDrive / manual backup.
- Browser bookmarks and passwords (sign in with the browser's account sync).
- Application-specific data (Outlook PST files, QuickBooks files, Photoshop preferences).
- Software activations (some apps need to be deactivated first to re-activate cleanly).

### After a clean install

1. Install chipset drivers first — from motherboard / laptop manufacturer.
2. Then LAN driver.
3. Then WiFi driver.
4. Then Windows Update to current — let it run a full cycle.
5. Only then GPU driver, from NVIDIA / AMD / Intel direct.
6. Then applications.

This order avoids the situation where Windows Update installs a generic driver before the OEM driver, creating conflicts.
