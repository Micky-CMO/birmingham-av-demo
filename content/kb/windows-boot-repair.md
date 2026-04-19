---
title: Windows Boot Repair
category: windows
updated: 2026-04-19
tags: [uefi, bcd, bootmgr, winload, bootrec, bcdboot, chkdsk, dual-boot, grub, bitlocker, bios-flash]
---

This file covers the Windows boot process, the symptoms of each kind of boot failure, and the repair commands that fix them. Every command here runs from the WinRE Command Prompt unless noted otherwise.

## The boot process

Knowing where boot fails tells you which file to repair. Modern Windows boots through a specific chain — each stage hands control to the next.

### UEFI boot chain

1. **Power on.** CPU runs UEFI firmware from the motherboard chip.
2. **POST.** Hardware initialisation, memory training, device enumeration.
3. **UEFI reads the boot order.** From NVRAM, it finds the boot entry that points to a file on the EFI System Partition (ESP).
4. **ESP contents load.** The ESP is a small FAT32 partition (typically 100–500MB) mounted at `\EFI\`. The boot file for Windows is at `\EFI\Microsoft\Boot\bootmgfw.efi`.
5. **bootmgfw.efi runs.** This is the Windows Boot Manager. It reads the Boot Configuration Data (BCD) store.
6. **BCD tells bootmgr what to load.** The BCD lists boot entries — OS installations, recovery environments, hibernation resume files.
7. **winload.efi loads.** The OS loader (or `winresume.efi` if resuming from hibernation). This is located in `\Windows\System32\` on the system partition.
8. **Kernel loads.** `ntoskrnl.exe` starts, brings up drivers, starts services.
9. **winlogon.exe runs.** User session begins.

### Legacy BIOS / MBR boot chain

Still present on older hardware and some dual-boot setups:

1. POST.
2. BIOS reads the first sector of the first boot drive — the Master Boot Record (MBR).
3. MBR points at the active partition's Volume Boot Record (VBR).
4. VBR loads `bootmgr` (the legacy Boot Manager).
5. `bootmgr` reads the BCD store.
6. BCD loads `winload.exe` (note: `.exe`, not `.efi`).
7. Kernel, services, logon as above.

## Symptoms to cause map

Different failure messages point at different stages of the boot chain. Identify the stage first.

### "An operating system wasn't found" / "No boot device"

The firmware couldn't find anything bootable. Either the boot order is wrong, the boot drive isn't detected, or the ESP is gone.

**Check:**
- BIOS detects the drive at all (POST screen or BIOS UI).
- Boot order lists the correct drive.
- The ESP is present and populated.

### "Missing operating system" / "BOOTMGR is missing"

Usually a legacy BIOS message — the MBR or VBR couldn't find the bootmgr file. Partition table or boot record damaged.

**Repair:**
```cmd
bootrec /fixmbr
bootrec /fixboot
bootrec /rebuildbcd
```

### "winload.efi is missing or contains errors"

UEFI found the boot manager, the boot manager read the BCD, but when it tried to launch winload.efi it couldn't. Either the file is gone, the BCD points at the wrong location, or the Windows partition is damaged.

**Repair:**
```cmd
bcdboot C:\Windows /s S: /f UEFI
```

Where `C:\` is the Windows volume and `S:` is the ESP (mount the ESP first — see the ESP mounting section below).

### "Your PC couldn't start properly" / Automatic Repair loop

Windows ran some stage of boot but hit a problem and is now trying to repair itself unsuccessfully. Usually a bad update, corrupt drivers, or failed system files.

**Repair:**
1. Let Automatic Repair run once more and note the error message.
2. From Advanced options, try System Restore to a working restore point.
3. Try Safe Mode.
4. Try `sfc /scannow` and `DISM /Online /Cleanup-Image /RestoreHealth` from the Command Prompt in WinRE.

### "Inaccessible boot device" stop code 0x7B

Windows started loading but couldn't read the system partition. Storage driver, BIOS mode change, or drive failure.

**Repair:**
1. BIOS check — is SATA mode AHCI vs RAID vs RST set the same as when Windows was installed?
2. `chkdsk C: /f /r` from WinRE.
3. `dism /image:C:\ /cleanup-image /revertpendingactions` to roll back any pending system changes.

### Stuck on Windows logo indefinitely

Windows started but a driver or service is hanging. Often a GPU driver, storage driver, or system service that isn't responding.

**Repair:**
1. Force off. On next boot, enter Safe Mode (three failed boots → Automatic Repair → Advanced options → Startup Settings).
2. In Safe Mode, uninstall the most recent driver update or update.
3. Check Event Viewer for the sequence of events before the last hang.

### "Your PC/device needs to be repaired" with a file error

UEFI says a specific file failed to load. The file path in the message tells you what's missing — often `\Windows\System32\config\SYSTEM` (registry hive corrupt) or `\EFI\Microsoft\Boot\BCD` (BCD corrupt).

**For corrupt BCD:**
```cmd
bootrec /rebuildbcd
```

**For corrupt registry hive:**
```cmd
cd C:\Windows\System32\config
ren SYSTEM SYSTEM.old
copy RegBack\SYSTEM SYSTEM
```

Note: On Windows 10 version 1803 and later, `RegBack` may be empty by default. Microsoft disabled the automatic backup in those versions. If the backup files are 0 bytes, use System Restore or re-install.

## WinRE Command Prompt essentials

The recovery environment gives you a command prompt with administrative privileges. These commands are the ones that actually fix boot issues.

### Finding your drives

In WinRE, the Windows drive is typically mounted as a different letter than `C:`. List what's present:

```cmd
diskpart
list disk
list volume
exit
```

The output shows volume letters, labels, filesystem type, and size. The Windows volume is the large NTFS one; the ESP is the small (100–500MB) FAT32 one with label "System Reserved" or no label.

### Mounting the ESP

The ESP is often hidden without a drive letter. To mount it for file operations:

```cmd
diskpart
list disk
select disk 0
list partition
select partition 1
assign letter=S
exit
```

Replace `disk 0` and `partition 1` with the actual disk and EFI partition numbers shown. The ESP is typically partition 1 on a clean GPT install.

### bootrec commands

`bootrec` is the primary tool for boot record repair. It has four switches:

- `bootrec /fixmbr` — writes a new Master Boot Record, leaves the partition table intact. Use when the MBR is corrupt but partitions are fine.
- `bootrec /fixboot` — writes a new boot sector to the system partition. On UEFI systems this may report Access Denied — use `bcdboot` instead as the UEFI equivalent.
- `bootrec /scanos` — scans all drives for Windows installations and reports what it finds.
- `bootrec /rebuildbcd` — scans for Windows installs, offers to add each to the BCD. Rebuilds the boot menu.

Full sequence for a standard repair:

```cmd
bootrec /fixmbr
bootrec /fixboot
bootrec /scanos
bootrec /rebuildbcd
```

### bcdboot — the UEFI repair command

`bcdboot` copies boot files from a Windows installation to the ESP and creates BCD entries for it. This is the UEFI equivalent of `bootrec /fixboot`.

```cmd
bcdboot C:\Windows /s S: /f UEFI
```

- `C:\Windows` — the source Windows installation.
- `/s S:` — the target ESP (use the letter you assigned with diskpart).
- `/f UEFI` — force UEFI firmware type. Alternatively `ALL` for both BIOS and UEFI, or `BIOS` for legacy-only.

### chkdsk — filesystem repair

`chkdsk` repairs NTFS errors. On the Windows volume, run it from WinRE because the volume can't be repaired while it's in use.

```cmd
chkdsk C: /f /r
```

- `/f` — fix errors found.
- `/r` — locate bad sectors and recover readable information (implies `/f`).
- Runs for a long time — 30 minutes to several hours on large drives. Don't interrupt it.

If `chkdsk` reports the volume is in use, the command prompt may be detecting it as mounted — run from WinRE rather than a running Windows session.

### bcdedit — viewing and editing the BCD

`bcdedit` shows and edits the BCD store.

```cmd
bcdedit /enum
```

Shows all boot entries. Useful for seeing what the boot manager thinks is available.

```cmd
bcdedit /set {default} bootstatuspolicy ignoreallfailures
```

Tells bootmgr to boot even if it has recorded a previous failure. Useful when the automatic repair loop is triggered by a single prior crash that's been fixed.

```cmd
bcdedit /set {default} recoveryenabled no
```

Disables the automatic repair environment. Reverse with `yes`. Use temporarily if Automatic Repair keeps triggering and blocking access to normal boot.

## Dual-boot repair without destroying GRUB

Dual-boot systems (Windows + Linux, usually Ubuntu / Mint / Fedora) typically use GRUB as the bootloader. GRUB lives on the ESP (on UEFI systems) and chainloads into Windows' bootmgfw.efi when Windows is selected.

Problem: Windows updates sometimes overwrite the UEFI boot order to make Windows Boot Manager the default, bypassing GRUB. A more serious problem: `bootrec /fixmbr` on a legacy MBR setup wipes GRUB entirely.

### Windows update overwrote the boot order (UEFI dual-boot)

Windows is still there, GRUB is still there, but the firmware boots straight into Windows now.

**Option 1: Fix from Windows.** Use BCDEdit to change the default:

```cmd
bcdedit /set {bootmgr} path \EFI\ubuntu\shimx64.efi
```

Adjust the path for your Linux distribution.

**Option 2: Fix from firmware.** Enter UEFI setup and change boot order — put the GRUB entry (usually named after the distro) above Windows Boot Manager.

**Option 3: Fix from Linux live USB.** Boot Linux live, mount the system, and run `update-grub` in a chroot — this re-registers GRUB as the default bootloader.

### Windows is unbootable on a dual-boot system

Repair Windows WITHOUT running `bootrec /fixmbr` on the whole-disk MBR, which would remove GRUB.

Instead:

1. Mount the ESP as shown above.
2. Run `bcdboot C:\Windows /s S: /f UEFI` to repair only the Windows entry.
3. This creates/repairs Windows' boot files without touching the Linux entries on the same ESP.
4. After the Windows repair, boot into Linux and run `update-grub` to refresh GRUB's menu so it still sees Windows as a dual-boot option.

### Linux is unbootable but Windows works

Boot a Linux live USB of the same distribution. Mount the Linux filesystem, chroot in, and reinstall GRUB:

```bash
sudo mount /dev/nvme0n1p2 /mnt
sudo mount /dev/nvme0n1p1 /mnt/boot/efi
for i in /dev /dev/pts /proc /sys /run; do sudo mount -B $i /mnt$i; done
sudo chroot /mnt
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=ubuntu
update-grub
exit
```

Replace `/dev/nvme0n1p2` with the Linux root partition and `/dev/nvme0n1p1` with the ESP. Replace `ubuntu` with your distribution name.

## Recovering after a failed BIOS flash

A failed BIOS update leaves the motherboard unable to POST. Recovery depends on the board's features.

### BIOS Flashback / Q-Flash Plus / USB BIOS Flashback

Most current ASUS, MSI, Gigabyte, and ASRock boards include a recovery flash button on the rear I/O. Procedure:

1. Download the latest stable BIOS for the exact board revision from the manufacturer.
2. Rename the BIOS file per the manufacturer's instructions (typically something specific like `MSI.ROM` or `GIGABYTE.BIN`).
3. Put the file in the root of a FAT32-formatted USB stick.
4. Plug the USB stick into the specific flashback port on the rear I/O — usually marked with a flash icon.
5. With the PC off but PSU connected and switched on, press and hold the flashback button for 3–5 seconds.
6. The LED near the button flashes during flashing. Do not disconnect power.
7. The flash takes 5–10 minutes. When complete, the LED stops flashing.
8. Remove the USB, unplug from mains, wait 30 seconds, reconnect, and try to POST.

This requires no CPU, RAM, or GPU fitted — only the motherboard and PSU. Useful when a failed flash or incompatible BIOS has left the system unable to start.

### Dual-BIOS boards

Some Gigabyte and ASRock boards have a backup BIOS chip. Procedure varies by board:

- Some auto-switch if the main BIOS fails three times.
- Some have a physical switch on the board to select the backup BIOS.
- After recovery, flash the main BIOS from within the now-working backup.

### No flashback and no dual BIOS

The board needs an external programmer or RMA. Clipping a CH341A programmer onto the BIOS chip and flashing directly is the usual workshop fix, but it requires the right equipment and enough confidence not to brick the chip further. Usually this is an RMA case.

## BitLocker-encrypted drives

BitLocker adds a layer that can complicate boot repairs. If the boot environment changes significantly (firmware update, motherboard change, some driver changes), BitLocker may require the recovery key at next boot.

### When you need the recovery key

- BIOS / UEFI firmware updates can change the PCR registers BitLocker uses to validate boot state.
- Motherboard swaps (same-brand, different model).
- TPM reset or TPM firmware update.
- Boot file changes from bootrec / bcdboot can trigger it.

Save the recovery key BEFORE running any of these commands. It's available:

- In the Microsoft account associated with the device (sign in at account.microsoft.com/devices/recoverykey).
- From a previously saved printout or USB key.
- In an Active Directory or Azure AD environment, from the domain's recovery escrow.

### Boot-time recovery key entry

When BitLocker demands the key at boot, it shows a 48-digit code identifier and asks for the matching recovery key. Enter the 48-digit key (no dashes required), and Windows boots normally.

### Suspending BitLocker before repairs

If repairs are needed and you anticipate boot environment changes, suspend BitLocker first:

```powershell
Suspend-BitLocker -MountPoint "C:" -RebootCount 1
```

`-RebootCount 1` means it stays suspended for one reboot then re-enables. Use `0` to leave suspended until manually resumed with `Resume-BitLocker`.

### Repairing a drive when BitLocker is active

In WinRE, unlock the drive before running commands against it:

```cmd
manage-bde -unlock C: -RecoveryPassword 123456-123456-...
```

Replace with the actual 48-digit recovery key. Once unlocked, you can run `chkdsk`, `sfc`, and `DISM` against the drive normally. BitLocker re-locks at next reboot unless also suspended.

### Decrypting permanently (if you've lost confidence in the setup)

```powershell
Disable-BitLocker -MountPoint "C:"
```

Runs in the background, can take hours on a large drive. The drive remains accessible throughout. Only decrypt if you no longer need encryption — it's the most reliable way to eliminate BitLocker as a factor in ongoing boot problems.
