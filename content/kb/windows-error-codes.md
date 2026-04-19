---
title: Windows Error Codes — Reference with Fix Sequences
category: windows
updated: 2026-04-19
tags: [stop-codes, bsod, hresult, windows-update, activation, dism, sfc, installer, network, dotnet]
---

This file catalogues the Windows error codes that come up most often in support. Each entry gives the plain-English meaning, when the code appears, the likely causes ranked by probability, and an exact fix sequence. Every chunk is self-contained — an agent retrieving one code should not need to pull another chunk to resolve the issue.

## Stop codes (BSOD / bugcheck)

Stop codes appear on a full-screen blue (or black, on Windows 11) error screen with the format `*** STOP: 0x000000XX` or a QR code and a bugcheck string. The code itself is the most important piece of information for diagnosis.

### 0x0000007B — INACCESSIBLE_BOOT_DEVICE

Windows has loaded far enough to need the boot volume, but cannot read it. Appears during boot, usually with the blue screen flashing briefly before an automatic reboot loop.

**Most likely causes, ranked:**
1. Storage controller driver missing or wrong — especially after moving a disk to new hardware.
2. BIOS SATA / NVMe mode changed between AHCI, RAID, and Intel RST after an update.
3. Boot volume corruption — filesystem damage on the Windows partition.
4. Failing SSD or NVMe.
5. BCD store pointing to a drive that no longer exists.

**Fix sequence:**

1. Boot into BIOS, check the SATA / NVMe mode. If it reads RAID and the OS was installed in AHCI, switch back. If it reads AHCI and the OS was installed with RST / RAID, switch back.
2. Boot from Windows installation media, pick Repair → Troubleshoot → Command Prompt.
3. Run filesystem repair on the Windows volume:
   ```cmd
   chkdsk C: /f /r
   ```
4. Rebuild the boot configuration store:
   ```cmd
   bootrec /fixmbr
   bootrec /fixboot
   bootrec /scanos
   bootrec /rebuildbcd
   ```
5. If the install has been moved to new hardware, reset the storage driver stack:
   ```cmd
   dism /image:C:\ /cleanup-image /revertpendingactions
   ```
6. If all of the above fail, test the drive with the manufacturer's tool (Samsung Magician, WD Dashboard, Crucial Storage Executive). SMART attributes showing reallocated or pending sectors = drive replacement.

### 0x00000124 — WHEA_UNCORRECTABLE_ERROR

Windows Hardware Error Architecture reporting an uncorrectable hardware fault. The most common actual-hardware-fault BSOD — unlike many stop codes, this one really does usually mean a hardware problem.

**Most likely causes:**
1. CPU instability from overclocking or degraded chip.
2. RAM error.
3. PSU delivering unclean power under load.
4. Motherboard VRM problem.
5. Overheating.

**Fix sequence:**

1. Remove all overclocks. BIOS → load defaults. Disable XMP / EXPO temporarily.
2. Check temperatures during idle and load with HWiNFO or Core Temp. CPU above 95°C under sustained load points at cooling.
3. Test RAM with MemTest86 (bootable USB, four full passes minimum).
4. If the system has XMP / EXPO enabled, try reducing speed one bin (e.g. 6000 → 5600) and retest.
5. Check Event Viewer → Windows Logs → System for WHEA-Logger entries. The detail panel names the component — "Processor Core", "Memory Error", "PCI Express Root Port".
6. If WHEA-Logger points at a specific CPU core repeatedly, the chip is degrading. Under warranty this is a replacement.

### 0x0000009F — DRIVER_POWER_STATE_FAILURE

A driver failed to respond when Windows transitioned the system into or out of a power state (sleep, hibernate, wake). Usually a bad driver, occasionally a faulty device.

**Most likely causes:**
1. Graphics driver.
2. Network adapter driver (WiFi particularly).
3. USB controller driver.
4. Storage driver after a recent update.

**Fix sequence:**

1. Check Event Viewer → System for driver-related errors around the time of the BSOD. The driver module often appears in the event detail.
2. Update the named driver from the manufacturer's website, not Windows Update.
3. If the crash is on wake from sleep, disable fast startup:
   ```cmd
   powercfg /hibernate off
   ```
4. Open Device Manager → check each device's Power Management tab, untick "Allow the computer to turn off this device to save power" for network and USB devices.
5. If a recent driver update caused the issue, roll back: Device Manager → device → Driver tab → Roll Back Driver.

### 0x000000EF — CRITICAL_PROCESS_DIED

A Windows process marked as critical (csrss.exe, wininit.exe, services.exe, smss.exe) has terminated unexpectedly. Windows cannot continue without it.

**Most likely causes:**
1. System file corruption.
2. Malware.
3. Failed Windows Update.
4. Registry corruption.
5. Bad RAM.

**Fix sequence:**

1. Boot into Safe Mode (restart with Shift held, or three forced reboots to trigger Automatic Repair).
2. Run system file check:
   ```cmd
   sfc /scannow
   ```
3. Repair the component store:
   ```cmd
   DISM /Online /Cleanup-Image /RestoreHealth
   ```
4. Then run SFC again:
   ```cmd
   sfc /scannow
   ```
5. Check for a recent update that coincided with the crashes. Control Panel → Programs → View installed updates → uninstall recent quality or feature updates if the timing matches.
6. If a malware check hasn't been done, run Windows Defender Offline scan.
7. If MemTest86 hasn't been run, do so.

### 0x00000050 — PAGE_FAULT_IN_NONPAGED_AREA

Windows tried to read data from memory that wasn't there. The area of RAM that's supposed to always be present (non-paged pool) was invalid.

**Most likely causes:**
1. Faulty RAM.
2. Faulty storage (paging file corruption).
3. Antivirus driver bug.
4. Overclock instability.

**Fix sequence:**

1. Test RAM with MemTest86, four full passes.
2. Check SSD / HDD health with CrystalDiskInfo. Any "Caution" or "Bad" status = replace.
3. Remove third-party antivirus (uninstall, reboot, retest with just Windows Defender).
4. Revert any memory overclock — load BIOS defaults, retest without XMP / EXPO.
5. If the dump file names a specific driver, update or remove that driver.

### 0x00000074 — BAD_SYSTEM_CONFIG_INFO

The SYSTEM registry hive is damaged, usually corrupted. Windows can't load its boot configuration.

**Most likely causes:**
1. Power loss during an update or shutdown.
2. Disk errors on the Windows volume.
3. Failed Windows Update.

**Fix sequence:**

1. Boot from Windows installation media → Repair → Startup Repair. Try this first; it resolves many cases automatically.
2. If Startup Repair fails, open Command Prompt from the recovery environment and attempt BCD rebuild:
   ```cmd
   bootrec /rebuildbcd
   ```
3. Restore the registry from the automatic backup:
   ```cmd
   cd C:\Windows\System32\config
   ren SYSTEM SYSTEM.old
   copy RegBack\SYSTEM SYSTEM
   ```
   On Windows 10 1803+ the RegBack folder may be empty by default — if the backup files are 0 bytes, this step won't help.
4. If backup restore fails, use System Restore (also from the recovery environment) to a restore point before the issue started.
5. As a last resort, in-place upgrade using the installation media preserves apps and data.

### 0x000000D1 — DRIVER_IRQL_NOT_LESS_OR_EQUAL

A kernel-mode driver tried to access a memory address at an interrupt level it wasn't allowed to. Almost always a driver bug.

**Most likely causes:**
1. Recently updated driver (GPU, network, chipset).
2. Network driver specifically — this code is common for buggy WiFi drivers.
3. Third-party antivirus driver.

**Fix sequence:**

1. Open the minidump with BlueScreenView or WhoCrashed. The named driver file is the culprit 80% of the time.
2. If the named file is a network driver (e.g. `rt64win7.sys`, `Netwtw08.sys`), update the network adapter driver from the manufacturer's site.
3. If the named file is a graphics driver (`nvlddmkm.sys`, `amdkmdag.sys`), clean-install the GPU driver with DDU.
4. If the driver name looks unfamiliar, paste the filename into a search to identify which product it belongs to, then update or remove.

### 0x000000F4 — CRITICAL_OBJECT_TERMINATION

A critical Windows process terminated. Similar to 0x000000EF but more specifically tied to disk or storage issues.

**Most likely causes:**
1. Failing SSD or HDD.
2. Bad SATA or NVMe cable / connection.
3. Corrupted system files.

**Fix sequence:**

1. Check the drive in CrystalDiskInfo. Reallocated sectors count above zero on an SSD = imminent failure.
2. Reseat the drive connection — SATA cable or NVMe slot.
3. Run `chkdsk C: /f /r` from an elevated command prompt.
4. Run DISM + SFC as above.
5. If the drive tests clean and SFC/DISM pass, reseat RAM — a flaky memory controller can look like storage failure.

### 0x0000003B — SYSTEM_SERVICE_EXCEPTION

A system service threw an unhandled exception. Often driver-related but can be broader.

**Most likely causes:**
1. Driver bug, named in the dump.
2. System file corruption.
3. Incompatible security software.
4. RAM fault.

**Fix sequence:**

1. Open minidump with BlueScreenView. Note the named driver or module.
2. If a driver is named, update or roll back.
3. Run DISM + SFC sequence:
   ```cmd
   DISM /Online /Cleanup-Image /RestoreHealth
   sfc /scannow
   ```
4. Test RAM with MemTest86.
5. Uninstall third-party antivirus temporarily to test.

### 0x0000001E — KMODE_EXCEPTION_NOT_HANDLED

A kernel-mode program caused an exception that the error handler couldn't catch. Broad — the dump file tells you what actually went wrong.

**Most likely causes:**
1. Driver fault.
2. Hardware fault (RAM, CPU, storage).
3. System file corruption.

**Fix sequence:**

1. Open minidump — note the named driver and the exception code.
2. Common exception codes that pair with 1E: 0xC0000005 (access violation — usually driver), 0x80000003 (breakpoint — usually a debug driver), 0xC0000420 (assertion — usually a specific piece of software).
3. Update or remove the named driver.
4. Run DISM + SFC.
5. If no driver is named, test RAM and storage.

### 0x00000133 — DPC_WATCHDOG_VIOLATION

A Deferred Procedure Call took too long, usually meaning a driver is stuck. Common on systems with NVMe drives with outdated firmware.

**Most likely causes:**
1. NVMe / SSD firmware out of date.
2. Chipset driver out of date (Intel IRST / RST driver especially).
3. Network driver stuck.
4. USB device misbehaving.

**Fix sequence:**

1. Update SSD / NVMe firmware from the manufacturer's tool.
2. Install the current chipset driver from the motherboard manufacturer's support page.
3. If the system is using Intel RST / IRST, update the driver to the latest version — older versions are a known cause of this code.
4. Unplug all USB devices and test. Add them back one at a time if the system is stable without them.
5. If a specific driver is named in the dump, update or remove it.

### 0x00000139 — KERNEL_SECURITY_CHECK_FAILURE

A kernel security check — usually stack corruption — has failed. Often hardware-related but can also indicate driver memory corruption.

**Most likely causes:**
1. RAM fault.
2. CPU instability (especially from overclocking).
3. Driver memory corruption.
4. Malware (rare but possible).

**Fix sequence:**

1. MemTest86 four passes.
2. Load BIOS defaults, disable XMP / EXPO, retest.
3. DISM + SFC sequence.
4. Check Event Viewer for hardware errors at the time of crash.
5. If stable with defaults, re-enable XMP but at a lower speed bin (e.g. 6000 → 5200).

### 0x000000C2 — BAD_POOL_CALLER

A thread made an illegal pool allocation or free. Driver fault, nearly always.

**Most likely causes:**
1. Third-party driver bug.
2. Antivirus or security software driver.

**Fix sequence:**

1. Minidump → named driver.
2. Update or remove the offending driver.
3. If no driver is named, remove recently installed software one at a time and retest.

### 0x00000019 — BAD_POOL_HEADER

A pool header is corrupt. Similar to 0xC2, slightly different failure mode — points more strongly at RAM or a driver that's overrunning its buffer.

**Most likely causes:**
1. RAM fault.
2. Driver memory corruption.
3. Antivirus driver.

**Fix sequence:**

1. MemTest86 four passes.
2. Open minidump for named driver.
3. Update or remove the offending driver.
4. Load BIOS defaults, retest without XMP / EXPO.

### 0x0000004E — PFN_LIST_CORRUPT

The Page Frame Number list is corrupt. Nearly always RAM — on modern systems, rarely a driver.

**Fix sequence:**

1. MemTest86 four passes. If errors, the RAM stick or slot is faulty.
2. Test one stick at a time in each slot — isolate which stick fails and which slot fails.
3. Load BIOS defaults, retest at JEDEC speed (no XMP / EXPO).

### 0x00000024 — NTFS_FILE_SYSTEM

The NTFS driver encountered an error reading or writing the filesystem. Drive is likely failing.

**Fix sequence:**

1. Check drive SMART attributes with CrystalDiskInfo.
2. Run `chkdsk C: /f /r` from Command Prompt (Admin) — schedules a check at reboot.
3. If the drive is failing, replace. Back up first if possible.
4. If the drive tests clean, the NTFS driver itself may be corrupt — run DISM + SFC.

### 0x0000007E — SYSTEM_THREAD_EXCEPTION_NOT_HANDLED

A system thread threw an exception the error handler couldn't catch. The second parameter in the dump is the exception code, third is the address of the exception.

**Most likely causes:**
1. Driver fault (named in the dump).
2. Corrupt system files.

**Fix sequence:**

1. Open minidump — note the named module or driver.
2. Update or roll back the named driver.
3. Run DISM + SFC.
4. If the named module is `ntoskrnl.exe` with no other detail, test RAM and check for BIOS updates.

### 0x000000C5 — DRIVER_CORRUPTED_EXPOOL

A driver wrote to memory it shouldn't have, corrupting the system pool. Always a driver fault.

**Fix sequence:**

1. Minidump → named driver.
2. Update or remove.
3. If persistent and no driver named, enable Driver Verifier to catch the offender (see the BSOD guide for Driver Verifier workflow).

### 0x000000F7 — DRIVER_OVERRAN_STACK_BUFFER

A driver wrote past the end of its stack buffer. Driver fault — specifically one that's mishandling its own memory.

**Fix sequence:**

1. Minidump → named driver.
2. Update or remove.
3. This code is sometimes caused by specific malware — run Windows Defender Offline scan if nothing else points at a cause.

### 0x0000000A — IRQL_NOT_LESS_OR_EQUAL

A kernel-mode process or driver tried to access memory at an interrupt level it wasn't allowed to. Very similar to 0xD1 but more general.

**Most likely causes:**
1. Driver bug.
2. Hardware fault (especially RAM).
3. Incompatible drivers from Windows upgrade.

**Fix sequence:**

1. Open minidump for the driver name.
2. Update or remove.
3. MemTest86.
4. If recent Windows upgrade preceded the crashes, check for updated drivers from the laptop / motherboard manufacturer.

### 0x00000101 — CLOCK_WATCHDOG_TIMEOUT

A CPU core failed to respond to interrupts within the expected time. CPU instability or degradation.

**Most likely causes:**
1. CPU overclock unstable.
2. Degraded CPU.
3. Motherboard VRM issue delivering unstable power.

**Fix sequence:**

1. Load BIOS defaults — clear any overclock.
2. Disable Intel Speed Shift / AMD Precision Boost Overdrive temporarily.
3. If stable at defaults, the CPU is marginal at its boost clocks — may need replacement under warranty.
4. If the system crashes with defaults loaded, test with one stick of RAM, then with the other.

## HRESULT codes

HRESULT codes are returned by Windows APIs. They appear in Windows Update errors, application errors, installer failures, and many other contexts. Format is usually `0x8xxxxxxx` — the leading `8` indicates a failure.

### 0x80070005 — E_ACCESSDENIED

Access is denied. The caller doesn't have the required permissions.

**Most likely causes:**
1. Running an operation without elevation.
2. User doesn't own the file or folder.
3. File is in use by another process.
4. Antivirus blocking access.
5. Encryption or EFS on the target.

**Fix sequence:**

1. Run Command Prompt or PowerShell as Administrator (right-click → Run as administrator).
2. For file access issues, take ownership:
   ```cmd
   takeown /F "C:\path\to\file" /R /D Y
   icacls "C:\path\to\file" /grant administrators:F /T
   ```
3. Check if the file is in use with Process Explorer → Find Handle.
4. Temporarily disable antivirus real-time protection and retest.

### 0x80070057 — E_INVALIDARG

One or more arguments passed to a function is invalid. Broad — context determines which argument.

**Most likely causes:**
1. Malformed parameter passed to an installer or API.
2. Invalid characters in a path or name.
3. Corrupted installer metadata.

**Fix sequence:**

1. Check the path for invalid characters, trailing spaces, or excessive length (260-character limit without long path support enabled).
2. If this appears during backup or imaging, free space check: the destination may be smaller than required.
3. If appearing in Windows Update, run the Windows Update troubleshooter (Settings → Update & Security → Troubleshoot → Windows Update).

### 0x80070570 — ERROR_FILE_CORRUPT

The file or directory is corrupted and unreadable. Appears during install, Windows Update, and file operations.

**Most likely causes:**
1. Bad sectors on the source media.
2. Interrupted download.
3. Corrupted installation media (ISO, USB stick).
4. Filesystem errors on the destination.

**Fix sequence:**

1. If installing Windows, rebuild the installation media. Download fresh ISO, use a fresh USB stick.
2. If appearing during Windows Update, run:
   ```cmd
   DISM /Online /Cleanup-Image /RestoreHealth
   sfc /scannow
   ```
3. Run `chkdsk C: /f /r` on the Windows volume.
4. Test the source drive (if copying from external) with the manufacturer's tool.

### 0x80004005 — E_FAIL (Unspecified error)

The catchall error — an operation failed and Windows couldn't narrow the cause further. The real cause is elsewhere in logs.

**Most likely causes:**
1. Network or permission issue blocking an operation.
2. Corrupted file, registry key, or database.
3. Hyper-V / virtualisation conflict.

**Fix sequence:**

1. Check Event Viewer at the time of the error — the preceding Warning or Error entry usually names the actual cause.
2. Check Reliability Monitor (`perfmon /rel`) for a broader failure timeline.
3. If the error appears in a specific app (VirtualBox, VMware), check that app's logs.
4. If related to shared folders or network shares, verify credentials and SMB version compatibility.

### 0x800F0922 — Update installation failure

Windows Update or feature update failed to apply. Common cause: insufficient free space on the system reserved partition, or a VPN / proxy blocking the install.

**Most likely causes:**
1. System Reserved Partition (or EFI System Partition) is full.
2. VPN or firewall blocking Microsoft servers.
3. .NET Framework components corrupt.

**Fix sequence:**

1. Check the System Reserved Partition size. It needs 500MB minimum; many older installs have 100–350MB.
2. Disconnect any VPN, disable third-party firewalls temporarily.
3. Repair .NET Framework with the Microsoft .NET Framework Repair Tool.
4. Reset Windows Update components (see the WU reset sequence in the updates guide).

### 0x80073712 — Component store corruption

A file needed by Windows Update is missing or corrupt in the component store (`C:\Windows\WinSxS`).

**Most likely causes:**
1. Interrupted previous update.
2. Disk errors.
3. Manual deletion of a WinSxS file.

**Fix sequence:**

1. Repair the component store:
   ```powershell
   DISM /Online /Cleanup-Image /RestoreHealth
   ```
2. If DISM reports it can't find the source files, specify a known-good Windows image:
   ```powershell
   DISM /Online /Cleanup-Image /RestoreHealth /Source:WIM:D:\sources\install.wim:1 /LimitAccess
   ```
   Where `D:\` is a mounted Windows ISO of the same version.
3. After DISM succeeds, run SFC:
   ```powershell
   sfc /scannow
   ```

## Windows Update errors

### 0x8024402C — WU_E_PT_WINHTTP_NAME_NOT_RESOLVED

Windows Update couldn't reach Microsoft's servers. DNS or connectivity issue.

**Fix sequence:**

1. Test general connectivity (browser, `ping 8.8.8.8`).
2. Flush DNS:
   ```cmd
   ipconfig /flushdns
   ```
3. Temporarily switch DNS to 1.1.1.1 or 8.8.8.8 in the network adapter properties.
4. Check Group Policy for any WSUS server settings pointing at an unreachable internal server:
   ```cmd
   gpresult /h report.html
   ```
5. Disable VPN and proxy settings, retest.

### 0x80240FFF — WU_E_UNEXPECTED

Unexpected Windows Update error — the catchall for internal WU failures.

**Fix sequence:**

1. Run the Windows Update troubleshooter first.
2. Reset Windows Update components using the reset sequence from the updates guide.
3. If the issue persists, the component store may need repair:
   ```powershell
   DISM /Online /Cleanup-Image /RestoreHealth
   sfc /scannow
   ```

### 0x80070643 — ERROR_INSTALL_FAILURE

An installation encountered a fatal error. Common on .NET Framework updates, Windows Defender definition updates, and Office updates.

**Fix sequence:**

1. If on a .NET update, run the .NET Framework Repair Tool.
2. If on a Defender update, reset Defender:
   ```powershell
   "%ProgramFiles%\Windows Defender\MpCmdRun.exe" -RemoveDefinitions -All
   "%ProgramFiles%\Windows Defender\MpCmdRun.exe" -SignatureUpdate
   ```
3. For general failures, reset Windows Update components.
4. Check Event Viewer → Setup log for details at the time of the attempted install.

### 0x80080005 — CO_E_SERVER_EXEC_FAILURE

The update service failed to start a component. Usually a WU service issue.

**Fix sequence:**

1. Check that the Windows Update service is running:
   ```powershell
   Get-Service wuauserv
   Start-Service wuauserv
   ```
2. Same for Background Intelligent Transfer Service:
   ```powershell
   Get-Service bits
   Start-Service bits
   ```
3. If services won't start, reset Windows Update components.

## Windows Activation errors

### 0xC004F074 — Key Management Service unreachable

The KMS server couldn't be reached. Applies to volume-licensed Windows installations (enterprise / education).

**Fix sequence:**

1. Verify the machine has network access.
2. Check the KMS server configuration:
   ```cmd
   slmgr /skms kms.example.com:1688
   slmgr /ato
   ```
3. If no KMS server exists in your environment and this is a retail install, convert:
   ```cmd
   slmgr /ipk YOUR-RETAIL-KEY
   slmgr /ato
   ```

### 0xC004C003 — Product key blocked

The activation server blocked the key. Most often because the key is already used on the maximum allowed hardware, or the key was flagged as compromised.

**Fix sequence:**

1. If this is a BAV-supplied machine, contact support — we'll issue a replacement key.
2. If you have a valid retail key, run the Activation troubleshooter: Settings → System → Activation → Troubleshoot.
3. If Windows was upgraded on the hardware and the hardware hash changed substantially, linking the key to your Microsoft account may allow reactivation.

### 0xC004F012 — No product key installed

No licence is present. Happens after a fresh install that skipped key entry, or a hardware change broke the digital licence.

**Fix sequence:**

1. Enter the product key:
   ```cmd
   slmgr /ipk XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
   slmgr /ato
   ```
2. If using a digital licence linked to a Microsoft account, sign in: Settings → System → Activation → Add an account.
3. Run the Activation troubleshooter.

## DISM and SFC errors

### 0x800F081F — The source files could not be found

DISM couldn't find the files it needs to repair the component store. Appears when the default repair source (Windows Update) is unreachable, blocked, or corrupt.

**Fix sequence:**

1. Provide an explicit source using a mounted Windows ISO of the same version and architecture:
   ```powershell
   DISM /Online /Cleanup-Image /RestoreHealth /Source:WIM:D:\sources\install.wim:1 /LimitAccess
   ```
   Replace `D:\` with whatever drive letter your mounted ISO uses. The `:1` is the image index — some ISOs have multiple editions, index 1 is usually Home, 2 is Pro, etc.
2. If you don't know the index, list them:
   ```powershell
   DISM /Get-ImageInfo /ImageFile:D:\sources\install.wim
   ```
3. If the source is an ESD file rather than WIM (common on newer ISOs), convert or extract first.

### 0x800F0906 — Source files couldn't be downloaded

Similar to 081F but specifically about downloads failing. The WU source is unreachable.

**Fix sequence:**

1. Check internet connectivity.
2. Check Group Policy for settings that prevent reaching Windows Update (Computer Configuration → Administrative Templates → System → Specify settings for optional component installation).
3. Provide explicit source as in 0x800F081F above.

### 0x800F0907 — Source files couldn't be used

Group Policy is explicitly blocking use of Windows Update for component installation.

**Fix sequence:**

1. Open Group Policy Editor (`gpedit.msc`).
2. Navigate to Computer Configuration → Administrative Templates → System → "Specify settings for optional component installation and component repair".
3. Set to Enabled → tick "Contact Windows Update directly to download repair content".
4. Run `gpupdate /force` and retry DISM.

## Network and RDP errors

### Error 0x204 — Remote Desktop can't find the computer

The RDP client couldn't resolve the hostname of the target.

**Fix sequence:**

1. Try connecting by IP address instead of hostname.
2. Verify the remote host is on and accepting RDP connections:
   ```powershell
   Test-NetConnection -ComputerName remotehost -Port 3389
   ```
3. Check the hosts file (`C:\Windows\System32\drivers\etc\hosts`) for stale entries.
4. Flush DNS: `ipconfig /flushdns`.

### Error 0x1000007D — Logon attempt failed

RDP authentication failed. Credentials wrong, or the account doesn't have Remote Desktop rights.

**Fix sequence:**

1. Verify username and password on the target machine directly.
2. Check the user is a member of the Remote Desktop Users group on the target: `lusrmgr.msc` → Groups → Remote Desktop Users.
3. Verify Remote Desktop is enabled on the target: Settings → System → Remote Desktop.
4. If using Network Level Authentication and the client is older, disable NLA on the target temporarily.

### 0x80072EFD — Internet connection problem

Generic connectivity error. Appears in Windows Update, Store, and Windows services that need internet.

**Fix sequence:**

1. Confirm internet works (browser, another app).
2. Check proxy settings: Settings → Network → Proxy. Disable any configured proxy if not needed.
3. Check the `winhttp` proxy:
   ```cmd
   netsh winhttp show proxy
   netsh winhttp reset proxy
   ```
4. Temporarily disable VPN and firewall, retest.
5. If corporate network, check the SSL inspection / certificate trust for Microsoft domains.

## .NET / CLR errors

### 0x80131500 — CLR generic failure

A .NET runtime error. Broad — specific cause is usually in the Event Viewer Application log.

**Fix sequence:**

1. Check Event Viewer → Application for the full .NET exception detail.
2. Update to the latest .NET Framework release from Microsoft.
3. Run the .NET Framework Repair Tool (downloadable from Microsoft).
4. If a specific application is affected, reinstall that application.

### 0x80131904 — SQL / data-related CLR failure

.NET error related to SQL Server or a database component.

**Fix sequence:**

1. Verify the SQL Server service is running.
2. Check connection string in the application's config.
3. Check SQL Server logs for the corresponding connection attempt.
4. Test connectivity from the client with `sqlcmd` or similar.

## Windows Installer errors

### 1603 — Fatal error during installation

The most generic MSI installer failure. The real cause is always in the MSI log.

**Fix sequence:**

1. Install again with logging enabled:
   ```cmd
   msiexec /i "package.msi" /L*V "C:\install.log"
   ```
2. Open the log — search for `Return value 3` or `Error 1603`. The line above identifies what failed.
3. Common culprits: missing prerequisite, file in use, permission issue, conflicting version.
4. Clear the Windows Installer cache if corrupt:
   ```cmd
   net stop msiserver
   ren %systemroot%\installer %systemroot%\installer.old
   net start msiserver
   ```

### 1612 — The installation source is not available

The installer is trying to access a file that isn't there — usually because the install was run from media that's since been ejected, or a network share that's disconnected.

**Fix sequence:**

1. Reconnect the install source (reinsert disc, remap network drive).
2. If uninstalling an old product whose source is gone, use the Microsoft Program Install and Uninstall Troubleshooter.
3. For persistent issues, the installer cache (`C:\Windows\Installer`) may need the MSI re-added.

### 1719 — Windows Installer service could not be accessed

The MSI service isn't running or is damaged.

**Fix sequence:**

1. Start the service:
   ```cmd
   net start msiserver
   ```
2. If the service won't start, re-register:
   ```cmd
   msiexec /unregister
   msiexec /regserver
   ```
3. Check service dependencies (RPC, DCOM Server Process Launcher) are running.
4. If all else fails, the installer service files themselves may be corrupt — run DISM + SFC.

## Application Event Log HRESULTs worth knowing

### 0x80070002 — File not found

The system couldn't locate the file specified. Usually a path issue or missing dependency.

**Fix sequence:**

1. Verify the path exists and is accessible.
2. If this is in Windows Update, run the WU reset sequence.
3. For app installs, re-download the installer.

### 0x80070003 — Path not found

Similar to 0x80070002 but specifically the directory doesn't exist.

### 0x8007000E — Out of memory

The process couldn't allocate the memory it needed. On modern machines this is nearly always a bug in the application or a runaway memory leak, not literal memory exhaustion.

**Fix sequence:**

1. Task Manager → Details tab → sort by memory. Kill the runaway process if obvious.
2. Restart the affected application.
3. If persistent, check the application's crash logs.

### 0x8007045B — A system shutdown is in progress

Occurs when a process tries to start while Windows is shutting down or restarting.

**Fix sequence:**

1. Wait for the shutdown to complete.
2. If a shutdown is stuck, press and hold power for 10 seconds, then cold-boot.
3. If this appears repeatedly after restart, check for pending updates that require reboot.

### 0x8007007B — Filename, directory name, or volume label syntax is incorrect

Invalid characters or format in a path. Common in batch scripts and command-line tools.

**Fix sequence:**

1. Check the path for characters invalid in Windows filenames: `< > : " / \ | ? *`.
2. Quote any path containing spaces.
3. Check for trailing backslashes in command arguments.

### 0x800700DF — The file size exceeds the limit allowed and cannot be saved

Usually when writing to a FAT32 filesystem (4GB file size limit) or a filesystem with a quota applied.

**Fix sequence:**

1. Check the destination filesystem — FAT32 caps at 4GB per file.
2. If the destination is NTFS or exFAT, check for user quotas.
3. If on a network share, the server's filesystem or quota may be the limit.

### 0x80070422 — Service cannot be started

The named Windows service is disabled and couldn't be started by an app or installer that depends on it.

**Fix sequence:**

1. Open Services (`services.msc`).
2. Find the service named in the error (often Windows Update or Windows Installer).
3. Set Startup type to Automatic or Manual.
4. Start the service.

### 0x800706BA — The RPC server is unavailable

Remote Procedure Call target couldn't be reached. Common when querying remote machines or when a local service has crashed.

**Fix sequence:**

1. If querying a remote host, verify it's reachable and the Remote Registry service is enabled there.
2. Check the Remote Procedure Call (RPC) service is running locally.
3. Check firewall rules aren't blocking RPC endpoints (135, and dynamic high ports).

### 0x80070032 — The request is not supported

The operation isn't available on this system or in this context.

**Fix sequence:**

1. Context-dependent. If appearing in PowerShell with a specific cmdlet, check the cmdlet's documentation for supported parameters.
2. If appearing in a GUI operation, the feature may require a Pro or Enterprise edition of Windows.

## SMART attribute warnings

Drives running SMART self-monitoring raise warnings that surface as Event Viewer entries or tool pop-ups. These are codes to take seriously.

### Reallocated Sectors Count (0x05)

A bad sector was found and remapped to a spare area. Any non-zero value means the drive has started failing. A small steady increase is survivable; rapid growth means back up immediately.

### Current Pending Sector Count (0xC5)

Sectors that are flagged as unstable but haven't yet been reallocated. On the next write they'll either be remapped or confirmed bad. Non-zero = drive is failing.

### Uncorrectable Sector Count (0xC6)

Sectors the drive can't read even after retries. Data is already lost on these sectors. Non-zero = immediate replacement.

### End-to-End Error Count (0xB8)

Errors in the drive's internal data path. Usually indicates firmware or controller issues.

**Fix sequence for any of the above:**

1. Back up everything important immediately.
2. Confirm with the manufacturer's tool (Samsung Magician, WD Dashboard, Crucial Storage Executive) — they read the same SMART data but present it with clear warnings.
3. Replace the drive. Do not attempt to carry on — SMART warnings mean the drive is already degrading.
4. If the drive is under BAV's 12-month warranty, contact support with the SMART report. If on AV Care, raise a claim.
