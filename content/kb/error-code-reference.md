---
title: Error Code Reference Tables
category: reference
updated: 2026-04-19
tags: [hresult, stop-codes, kernel-panic, systemd, http, smart, post-beep, usb, gpu-driver, stripe]
---

Quick-reference tables. Each row: code → plain-English meaning → first action. When a customer pastes a code, the agent finds it here first before pulling in the fuller guidance from the topic-specific files.

## Windows HRESULT codes

HRESULT codes appear throughout Windows, in installer failures, Windows Update errors, application crashes, COM errors, and Shell operations. Format is typically `0x8xxxxxxx` (the high bit indicates failure). The tables below group by prefix.

### 0x8007xxxx — Win32 errors wrapped as HRESULT

| Code | Meaning | First action |
|------|---------|--------------|
| 0x80070002 | File not found | Verify path exists; re-download if installer source |
| 0x80070003 | Path not found | Check directory exists and is accessible |
| 0x80070005 | Access denied | Run as Administrator; take ownership with takeown + icacls |
| 0x8007000D | Invalid data | Corrupted input; regenerate / re-download |
| 0x8007000E | Out of memory | End runaway process; reboot; check for memory leaks |
| 0x80070020 | Sharing violation | Close the app holding the file; check with Process Explorer |
| 0x80070032 | Request not supported | Context-specific; check feature availability on this edition |
| 0x80070035 | Network path not found | Verify network share, credentials, SMB version |
| 0x80070043 | Network name cannot be found | DNS resolution fails; check server name and DNS |
| 0x80070057 | Invalid parameter | Malformed argument; check path validity and characters |
| 0x80070070 | Not enough disk space | Free space on target drive |
| 0x8007007B | Filename syntax incorrect | Invalid characters in path; check quoting |
| 0x8007007E | Module not found | Missing DLL; reinstall application |
| 0x80070091 | Directory not empty | Contents still present; delete contents first |
| 0x8007045B | Shutdown in progress | Wait for shutdown; cold-boot if stuck |
| 0x80070422 | Service disabled | Set service to Manual or Automatic; start it |
| 0x80070426 | Service not started | Start the named service |
| 0x80070570 | File corrupt | Rebuild install media; run DISM + SFC |
| 0x8007065D | Stack overflow in extension | Uninstall the faulty shell extension |
| 0x80070643 | Fatal install error | Run WU reset; check installer logs |
| 0x80070652 | Install in progress | Wait for current install; reboot if stuck |
| 0x800706BA | RPC server unavailable | Check RPC service; check firewall for RPC |
| 0x8007139F | Invalid state | Service / component state mismatch; restart |

### 0x8004xxxx — OLE / dispatch / automation errors

| Code | Meaning | First action |
|------|---------|--------------|
| 0x80040111 | ClassFactory cannot create object | Re-register COM component: `regsvr32 name.dll` |
| 0x80040154 | Class not registered | Register the required component; check Office bitness |
| 0x80040200 | OLE error | Repair the Office install; re-register components |
| 0x80040e14 | SQL syntax error | Fix the SQL query; check connection string |
| 0x80040e4d | SQL login failed | Verify credentials and permissions |

### 0x800Fxxxx — Windows servicing / component errors

| Code | Meaning | First action |
|------|---------|--------------|
| 0x800F0831 | Update package missing | Clean WU components; try manual update (.msu file) |
| 0x800F0900 | Uncommon update error | Run WU troubleshooter; reset components |
| 0x800F0906 | Source files couldn't be downloaded | Provide offline source with DISM /Source |
| 0x800F0907 | Source files couldn't be used | Fix Group Policy for optional component install |
| 0x800F081E | Feature disabled | The feature requires a different Windows edition |
| 0x800F081F | Source files couldn't be found | Provide offline source; check WU connectivity |
| 0x800F0922 | Update installation failure | Check free space on system reserved partition; disable VPN |
| 0x800F0923 | Driver / service unrecoverable | Unrelated driver broke Windows Servicing — identify and remove |

## Windows Stop codes (bugcheck)

Full coverage with fix sequences is in the windows-error-codes knowledge chunk; this table is for fast lookup.

| Code | Bugcheck name | Usual cause | First action |
|------|---------------|-------------|--------------|
| 0x0000000A | IRQL_NOT_LESS_OR_EQUAL | Driver bug, RAM | Minidump for driver name; MemTest86 |
| 0x00000019 | BAD_POOL_HEADER | RAM, driver overrun | MemTest86; check drivers |
| 0x0000001E | KMODE_EXCEPTION_NOT_HANDLED | Driver, system file corruption | Check dump; DISM + SFC |
| 0x00000024 | NTFS_FILE_SYSTEM | Drive failing, NTFS corrupt | chkdsk; check SMART |
| 0x0000003B | SYSTEM_SERVICE_EXCEPTION | Driver, system files | Dump analysis; DISM + SFC |
| 0x0000004E | PFN_LIST_CORRUPT | RAM fault | MemTest86 |
| 0x00000050 | PAGE_FAULT_IN_NONPAGED_AREA | RAM, antivirus driver | MemTest86; uninstall third-party AV |
| 0x00000074 | BAD_SYSTEM_CONFIG_INFO | Registry SYSTEM hive corrupt | Startup Repair; System Restore |
| 0x0000007B | INACCESSIBLE_BOOT_DEVICE | Storage driver, BIOS mode | Check SATA/NVMe mode in BIOS; chkdsk |
| 0x0000007E | SYSTEM_THREAD_EXCEPTION_NOT_HANDLED | Driver | Check dump for module name |
| 0x0000009F | DRIVER_POWER_STATE_FAILURE | Driver power handling | Update network / GPU driver; disable fast startup |
| 0x000000C2 | BAD_POOL_CALLER | Driver bug | Identify driver; update or remove |
| 0x000000C5 | DRIVER_CORRUPTED_EXPOOL | Driver memory corruption | Driver Verifier to find culprit |
| 0x000000D1 | DRIVER_IRQL_NOT_LESS_OR_EQUAL | Driver bug | Dump names the driver |
| 0x000000EF | CRITICAL_PROCESS_DIED | System file damage, malware | Safe Mode; DISM + SFC; malware scan |
| 0x000000F4 | CRITICAL_OBJECT_TERMINATION | Storage issue | Check drive SMART; reseat cables |
| 0x000000F7 | DRIVER_OVERRAN_STACK_BUFFER | Driver bug | Identify driver; malware scan as secondary |
| 0x00000101 | CLOCK_WATCHDOG_TIMEOUT | CPU unstable | Load BIOS defaults; remove overclock |
| 0x00000124 | WHEA_UNCORRECTABLE_ERROR | Hardware fault | Event Viewer WHEA-Logger detail; MemTest86 |
| 0x00000133 | DPC_WATCHDOG_VIOLATION | NVMe firmware, chipset driver | Update SSD firmware; update chipset driver |
| 0x00000139 | KERNEL_SECURITY_CHECK_FAILURE | RAM, CPU overclock | MemTest86; BIOS defaults |

## Linux kernel panic families

Panics print a call trace. The function at the top of the trace points at the failing subsystem.

| Trace contains | Family | Most likely cause |
|----------------|--------|-------------------|
| `ext4_`, `btrfs_`, `xfs_`, `fs/` | Filesystem | Corrupt filesystem; run fsck from live USB |
| `nvme_`, `ahci_`, `scsi_`, `block/` | Storage | Failing drive; replace |
| `nvidia`, `amdgpu`, `i915` | GPU driver | Driver module issue; rebuild DKMS or rollback |
| `mce_`, `mcheck_` | Machine check | Hardware fault — usually CPU or memory |
| `Out of memory`, `oom_reaper` | OOM | Add RAM or reduce workload; tune swap |
| `Kernel module` followed by name | Third-party module | Rebuild module against current kernel |
| `mount`, `root=`, `initramfs` | Boot / root mount | Wrong UUID in cmdline or fstab; rebuild initramfs |
| `soft lockup`, `hard LOCKUP` | CPU stuck | Driver spinning; kernel bug; rarely CPU hardware |
| `NULL pointer dereference` | Kernel bug | Report to distro / module vendor; try older kernel |

## systemd unit exit codes

When a unit fails, `systemctl status` shows an exit code. Common codes:

| Code | Meaning | First action |
|------|---------|--------------|
| 0 | Success (not a failure — unit exited cleanly) | No action needed |
| 1 | General error | Check `journalctl -u unit` for the actual error |
| 2 | Misuse of shell builtin | Typo in unit file's ExecStart |
| 126 | Permission denied / not executable | `chmod +x` the target file; check path |
| 127 | Command not found | Binary doesn't exist at the path specified |
| 128+n | Terminated by signal n | 129 = SIGHUP, 137 = SIGKILL (OOM), 143 = SIGTERM |
| 200 | User-defined failure | Check the specific unit's documentation |
| 203 | exec failed | Broken unit file — check ExecStart= syntax |
| 208 | systemd couldn't start the unit cleanly | Check unit file for syntax errors; `systemd-analyze verify` |

## HTTP status codes

When a customer hits a web application issue, the status code is the primary diagnostic.

### 4xx — Client errors

| Code | Meaning | First action |
|------|---------|--------------|
| 400 | Bad Request | Malformed request; check form submission / API body |
| 401 | Unauthorized | Sign in again; check credentials |
| 403 | Forbidden | Authenticated but not permitted; check user permissions |
| 404 | Not Found | URL typo, content moved, or deleted |
| 405 | Method Not Allowed | Using GET where POST is required (or vice versa) |
| 408 | Request Timeout | Slow connection; retry |
| 409 | Conflict | Resource state mismatch (e.g. concurrent edit) |
| 413 | Payload Too Large | Upload exceeds server limit |
| 414 | URI Too Long | URL exceeds server limit |
| 415 | Unsupported Media Type | Wrong Content-Type header |
| 418 | I'm a teapot | Joke status — not used in practice |
| 422 | Unprocessable Entity | Request well-formed but semantically wrong (failed validation) |
| 429 | Too Many Requests | Rate limited; back off and retry |

### 5xx — Server errors

| Code | Meaning | First action |
|------|---------|--------------|
| 500 | Internal Server Error | Server crash or exception; check server logs |
| 501 | Not Implemented | Server doesn't support this method |
| 502 | Bad Gateway | Proxy got invalid response from upstream; check upstream service |
| 503 | Service Unavailable | Temporarily down (maintenance, overload); retry later |
| 504 | Gateway Timeout | Upstream took too long; check upstream performance |
| 507 | Insufficient Storage | Server out of disk space |

## SMART drive attributes

Appear in CrystalDiskInfo, smartctl, manufacturer tools. Raw value is device-specific; normalised value is the standardised health indicator (closer to threshold = worse).

| ID (hex) | ID (dec) | Name | Significance |
|----------|----------|------|--------------|
| 0x05 | 5 | Reallocated Sectors Count | Any non-zero = drive has started failing |
| 0x09 | 9 | Power-On Hours | Informational — drive uptime in hours |
| 0x0A | 10 | Spin Retry Count | Non-zero on HDDs = motor struggling |
| 0x0C | 12 | Power Cycle Count | Informational — number of power-ons |
| 0xB4 | 180 | Unused Reserve NAND Blks | SSD — remaining spare capacity |
| 0xB7 | 183 | SATA Downshift Count | Interface errors; check cable |
| 0xB8 | 184 | End-to-End Error Count | Data path errors — firmware or controller |
| 0xBB | 187 | Reported Uncorrectable Errors | Data already lost; replace drive |
| 0xBD | 189 | High Fly Writes | Head flying too high — HDD issue |
| 0xBE | 190 | Airflow / Temperature | Drive temp — above 50°C for HDD, 70°C for SSD is concerning |
| 0xC2 | 194 | Temperature | Current temperature reading |
| 0xC4 | 196 | Reallocation Event Count | Each remap increments — sustained growth = failing |
| 0xC5 | 197 | Current Pending Sector Count | Sectors pending remap; drive is failing |
| 0xC6 | 198 | Uncorrectable Sector Count | Unreadable sectors; data loss already; replace |
| 0xC7 | 199 | CRC Error Count | SATA cable or port issue; try a different cable |
| 0xE1 | 225 | Load / Unload Cycle Count | HDD head parking — high count = aggressive power management |
| 0xE9 | 233 | Media Wearout Indicator | SSD wear — 0 means end of rated life |
| 0xF1 | 241 | Total LBAs Written | SSD endurance — multiply by sector size for total bytes written |
| 0xF2 | 242 | Total LBAs Read | Read workload statistic |

Any warning-state attribute (0x05, 0xC4, 0xC5, 0xC6, 0xBB) = back up immediately and replace the drive.

## POST beep codes

Older motherboards beep through the PC speaker at POST when something's wrong. Beep patterns vary by BIOS vendor.

### AMI BIOS (older boards)

| Beeps | Meaning |
|-------|---------|
| 1 short | POST passed, all OK |
| 2 short | Memory parity error |
| 3 short | RAM read/write error in first 64KB |
| 4 short | System timer failure |
| 5 short | CPU error |
| 6 short | Keyboard controller error |
| 7 short | Virtual mode exception |
| 8 short | Display memory failure |
| 9 short | ROM checksum |
| 10 short | CMOS shutdown register error |
| 11 short | Cache memory error |
| 1 long, 3 short | Memory test failed |
| 1 long, 8 short | Display / retrace test failed |

### Phoenix BIOS

Phoenix uses patterns like "1-2-3-4" — four groups of beeps with pauses between. A POST card displaying a hex code is more practical than counting beeps by this point.

| Pattern | Meaning |
|---------|---------|
| 1-1-1-3 | CMOS / BIOS failure |
| 1-1-4-1 | Cache error |
| 1-2-2-3 | BIOS ROM checksum |
| 1-3-1-1 | DMA refresh failure |
| 1-3-4-1 | RAM failure at specific address |
| 2-1-2-3 | ROM copyright notice check failed |
| 2-2-3-1 | Unexpected interrupt |

### Dell beep codes (BIOS beeps at startup)

Dell uses repeat patterns separated by pauses.

| Pattern | Meaning |
|---------|---------|
| 1 beep | BIOS ROM checksum failure |
| 2 beeps | No RAM detected |
| 3 beeps | Chipset error |
| 4 beeps | RAM read/write failure |
| 5 beeps | Real-time clock failure (CMOS battery) |
| 6 beeps | Video BIOS failure |
| 7 beeps | CPU cache test failure |

### UEFI POST codes

Modern UEFI boards rarely use beeps — most have a two-digit LED display or debug LEDs for CPU / DRAM / VGA / BOOT. Check the motherboard manual for the specific codes, which are board-vendor-specific.

## USB / Device Manager error codes

Codes shown in Device Manager properties for problem devices.

| Code | Meaning | First action |
|------|---------|--------------|
| Code 1 | Not configured correctly | Reinstall driver |
| Code 3 | Driver corrupted | Uninstall from Device Manager; reboot |
| Code 9 | Windows can't identify | Remove device; reconnect |
| Code 10 | Device cannot start | Driver issue, hardware issue, power issue — check all three |
| Code 12 | Conflict | Resource conflict (IRQ); move card to different slot |
| Code 14 | Restart required | Reboot |
| Code 16 | Device cannot identify all resources | Usually older hardware on newer OS |
| Code 18 | Reinstall drivers | Uninstall + reinstall from vendor |
| Code 19 | Registry info corrupt | Uninstall + reinstall; System Restore if persistent |
| Code 22 | Device disabled | Enable from Device Manager |
| Code 24 | Not installed or not functioning | Uninstall and scan for hardware changes |
| Code 28 | No drivers installed | Install drivers |
| Code 31 | Device not working properly | Reinstall driver; Code 31 often masks other issues |
| Code 32 | Service start type disabled | Check service configuration |
| Code 37 | Driver returned failure | Reinstall driver; often hardware issue underneath |
| Code 38 | Can't load driver (version still in memory) | Reboot |
| Code 39 | Can't load driver (corruption or missing) | Reinstall driver from vendor |
| Code 43 | Device reported problem | Test hardware; update driver; consider failing device |
| Code 45 | Not currently connected | Device disconnected — reconnect |
| Code 48 | Driver blocked for compatibility | Install compatible driver; may be vendor-blacklisted |
| Code 52 | Digital signature verification failed | Driver not properly signed; find a signed version |

**Code 43 is particularly common on GPUs** — can mean driver, can mean failing card, can mean PCIe slot issue. Test with known-good driver, known-good slot, and if still Code 43, the GPU is suspect.

## GPU driver install error codes

### NVIDIA installer

| Code | Meaning | First action |
|------|---------|--------------|
| "Installer cannot continue" | Previous install didn't clean up | Run DDU in Safe Mode |
| "Not compatible with this version of Windows" | Wrong driver for OS version | Verify driver matches Windows build |
| "The NVIDIA Installer failed" | Usually antivirus interference | Disable AV; try again |
| Error 1 | Generic install failure | Check installer logs in `%TEMP%\NVIDIA Corporation\` |
| Error 2 | Driver package signature | Re-download; check file integrity |
| Error 43 | After install, Device Manager Code 43 | DDU clean install |

### AMD Software / Radeon Installer

| Code | Meaning | First action |
|------|---------|--------------|
| Error 182 | Unsupported hardware | Wrong driver package for GPU |
| Error 195 | Unable to download | Network issue or AMD servers; manual download |
| Error 1603 | Install engine failure | DDU clean install; disable AV |
| "No AMD graphics driver installed" | Detection failure | Reseat GPU; check device in Device Manager |

### Intel Graphics Installer

| Code | Meaning | First action |
|------|---------|--------------|
| "Computer does not meet minimum requirements" | Wrong driver or OEM driver locked | Get driver from OEM (laptop manufacturer) |
| "Operating system is not supported" | Mismatch between driver and Windows version | Match driver to Windows edition and build |
| "A driver cannot be installed" | Intel blocked by OEM customisation | OEM's support site has the right driver |

## Stripe error codes (BAV checkout)

Customer-facing Stripe errors seen in BAV's checkout.

### Card declines

| Decline code | Meaning | Customer guidance |
|--------------|---------|-------------------|
| `generic_decline` | Card issuer declined, no specific reason | Contact card issuer or try different card |
| `insufficient_funds` | Not enough available balance | Try different card or payment method |
| `lost_card` | Reported lost | Do not retry; contact card issuer |
| `stolen_card` | Reported stolen | Do not retry; contact card issuer |
| `expired_card` | Past expiry date | Use an unexpired card |
| `incorrect_cvc` | CVC doesn't match | Re-enter CVC correctly |
| `incorrect_number` | Card number invalid | Re-enter card number |
| `processing_error` | Issuer's processor failed | Retry; if persists, try another card |
| `card_velocity_exceeded` | Too many attempts recently | Wait 24 hours or try different card |
| `do_not_honor` | Issuer declined without specifying | Contact card issuer |
| `fraudulent` | Stripe's fraud system flagged | BAV support — we may be able to approve |

### Payment Intent errors

| Error | Meaning | BAV staff action |
|-------|---------|------------------|
| `authentication_required` | 3D Secure needed | Customer completes authentication |
| `requires_action` | Additional step needed (3DS) | Direct customer to complete 3DS flow |
| `requires_payment_method` | No valid payment method | Customer re-enters card |
| `requires_confirmation` | PI created but not confirmed | Staff resolves in dashboard |
| `canceled` | Intent was cancelled | Customer restarts checkout |
| `succeeded` | Payment completed | Not an error — order should proceed |

### Radar (fraud) flags

When a payment is flagged by Stripe Radar, support reviews. The flag itself isn't customer-visible — customers see a generic decline. Internal review then chooses to approve, ask for verification, or decline permanently.

## Quick lookup tips

- **Paste the full code including the `0x` prefix.** Reduces false matches.
- **If only a short name appears** (e.g. "PAGE_FAULT_IN_NONPAGED_AREA" with no hex), check the bugcheck table by name.
- **If no code appears** and the customer only has a symptom, this file isn't the right retrieval target — go to the diagnostic methodology file.
- **Stop codes on Windows are eight digits** (`0x0000007B`). Drop leading zeros only when matching — many references show the short form `0x7B`.
