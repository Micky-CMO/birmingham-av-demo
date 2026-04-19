---
title: Linux Boot and Filesystem
category: linux
updated: 2026-04-19
tags: [grub, uefi, fstab, luks, lvm, btrfs, ext4, xfs, kernel-panic, chroot, initramfs, rescue-mode]
---

This file covers the Linux boot stack from firmware to login, how to repair each stage, and how to recover from common filesystem and encryption failures. Commands assume a live USB is available for recovery — most serious boot issues require one.

## The Linux boot stack

### UEFI boot chain

1. **Power on.** UEFI firmware runs.
2. **Boot order.** Firmware reads NVRAM, picks the configured default boot entry.
3. **EFI System Partition.** A FAT32 partition (mounted at `/boot/efi`) contains `.efi` boot files.
4. **shim (if Secure Boot is on).** A Microsoft-signed tiny EFI program that validates and loads the next stage.
5. **GRUB loads.** The bootloader reads `/boot/grub/grub.cfg`. Shows the menu (or auto-selects the default).
6. **Kernel and initramfs load.** GRUB loads `/boot/vmlinuz-*` and `/boot/initrd.img-*` (Debian/Ubuntu) or `/boot/initramfs-*.img` (Fedora/Arch) into memory.
7. **Kernel boots.** Detects hardware, mounts the initramfs as a temporary root.
8. **initramfs runs.** Contains just enough userspace to mount the real root filesystem (includes filesystem modules, LVM tools, LUKS for encrypted disks).
9. **Root filesystem mounted.** Kernel switches from initramfs to the real root.
10. **systemd starts.** PID 1. Brings up every configured unit.
11. **Display manager.** GDM, SDDM, or LightDM shows the login prompt.

### Legacy BIOS boot chain

Similar but with MBR / BIOS boot code instead of the ESP:

1. BIOS POST.
2. BIOS reads the MBR from the first boot drive.
3. MBR boot code loads GRUB's first stage.
4. GRUB loads, reads config from `/boot/grub/`.
5. From there: kernel + initramfs as above.

## GRUB repair from a live USB

The most common Linux boot repair. A broken GRUB config, overwritten bootloader (e.g. after a Windows install on a dual-boot system), or a missing EFI entry all present as "system won't boot" with the same general fix: mount the installed system from a live USB, chroot in, reinstall GRUB.

### Boot the live USB

Same distribution as the installed system where possible — Ubuntu live USB for an Ubuntu install, Fedora live USB for a Fedora install. Cross-distro chroots work but need the matching tools.

### The chroot sequence

```bash
# Identify the partitions
sudo fdisk -l

# Typical: /dev/nvme0n1p1 = ESP, /dev/nvme0n1p2 = root
# Mount the root filesystem
sudo mount /dev/nvme0n1p2 /mnt

# Mount the ESP inside it
sudo mount /dev/nvme0n1p1 /mnt/boot/efi

# Bind-mount the virtual filesystems the chroot needs
for i in /dev /dev/pts /proc /sys /run; do sudo mount -B $i /mnt$i; done

# Enter the chroot
sudo chroot /mnt

# Now inside the installed system's environment
```

### Reinstall GRUB

Inside the chroot, on UEFI:

```bash
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=ubuntu
update-grub
```

Replace `ubuntu` with the distribution identifier. This string becomes the name in the UEFI boot menu — use the distro's convention (`ubuntu`, `fedora`, `arch`, `debian`).

On legacy BIOS:

```bash
grub-install /dev/nvme0n1
update-grub
```

Note: `/dev/nvme0n1` is the whole disk, not a partition. Writing GRUB to a partition on a BIOS/MBR system is nearly always wrong.

### Distro variations of update-grub

- **Debian / Ubuntu / Mint:** `update-grub` (wrapper around `grub-mkconfig`).
- **Fedora / RHEL:** `grub2-mkconfig -o /boot/grub2/grub.cfg` (or `/boot/efi/EFI/fedora/grub.cfg` on some UEFI configs).
- **Arch / EndeavourOS:** `grub-mkconfig -o /boot/grub/grub.cfg`.

### Exit the chroot and reboot

```bash
exit                                 # leave chroot
sudo umount -R /mnt
sudo reboot
```

`umount -R` recursively unmounts everything under `/mnt`. Remove the live USB before reboot.

## Rescue mode and single-user boot

When GRUB loads but the system won't complete boot, you can drop into a minimal environment without booting the full system.

### From the GRUB menu

At the GRUB menu, highlight the default entry and press `e` to edit it. Find the line starting `linux` (or `linuxefi` on older Fedora). At the end of that line, add one of:

- `single` or `1` — single-user mode (limited services, root shell).
- `systemd.unit=rescue.target` — rescue mode (more services than single-user, not full graphical).
- `systemd.unit=emergency.target` — minimal possible environment, root filesystem mounted read-only.
- `init=/bin/bash` — skip systemd entirely, boot straight to a root shell. Useful when even emergency.target fails.

Press `Ctrl+X` or `F10` to boot with the modified command line. The change is one-time — next boot uses the normal config.

### In emergency mode, root filesystem is read-only

To make changes, remount read-write:

```bash
mount -o remount,rw /
```

### Root password required

Rescue and emergency modes ask for the root password by default on many distros. If you set a root password during install, enter it. If you didn't (Ubuntu style), this method fails — use `init=/bin/bash` instead, which skips the password prompt.

### Resetting the root password

Boot with `init=/bin/bash`. Remount root read-write (`mount -o remount,rw /`). Run `passwd`. Reboot (`exec /sbin/init` or cold reboot).

## /etc/fstab

`/etc/fstab` lists filesystems to mount at boot. Each line is one mount.

### Fields

```text
# <device>       <mount>    <type>   <options>               <dump> <pass>
UUID=abc-123     /          ext4     defaults,errors=remount-ro 0    1
UUID=def-456     /boot/efi  vfat     umask=0077              0      1
UUID=ghi-789     none       swap     sw                      0      0
```

- **device** — what to mount. UUIDs are best (stable across disk reordering); `/dev/sda2` works but breaks if the drive letter changes.
- **mount** — where to mount it. `none` for swap.
- **type** — filesystem (ext4, xfs, btrfs, vfat, swap).
- **options** — mount options. `defaults` is reasonable; other common options below.
- **dump** — whether to include in `dump` backups. `0` almost always.
- **pass** — fsck order at boot. `1` for root, `2` for other filesystems, `0` to skip fsck.

### Useful mount options

- `noauto` — don't mount at boot (mount manually with `mount /path`).
- `user` — allow unprivileged users to mount this entry.
- `nofail` — don't fail boot if this filesystem is missing (essential for external drives).
- `noatime` — don't update access times (slight performance win, safe for most use).
- `compress=zstd` — btrfs transparent compression.
- `ro` / `rw` — read-only or read-write.

### Finding UUIDs

```bash
blkid
lsblk -f
```

Both show every block device with its UUID and filesystem type.

### fsck failed at boot

If a filesystem has errors, fsck may fail automatically and drop the system to emergency mode with the message "Failed to mount /..." or "fsck failed with exit code...".

Boot from live USB and run fsck manually:

```bash
sudo fsck -y /dev/nvme0n1p2
```

`-y` answers yes to prompts. Can take a long time on large filesystems. After fsck completes successfully, try rebooting the installed system.

### System boots read-only

A common symptom of boot-time fsck problems: root mounted read-only as a safety measure. Systemd auto-remounts root read-only when it detects problems it can't fix.

Force a fresh fsck by booting to emergency mode and running:

```bash
mount -o remount,rw /
fsck -fy /
```

`-f` forces check even if filesystem appears clean. Can only run on unmounted filesystems — root is tricky. Easier: boot live USB, fsck from there.

## Filesystems

### ext4

The default on Debian, Ubuntu, Mint. Mature, fast, reliable. Supports journal, online resize, and quotas.

Check:

```bash
sudo fsck -y /dev/nvme0n1p2
```

Resize (after growing the underlying partition):

```bash
sudo resize2fs /dev/nvme0n1p2
```

### XFS

Default on RHEL and its rebuilds (Rocky, Alma). Fast for large files, no shrinking support — only grow.

Check:

```bash
sudo xfs_repair /dev/nvme0n1p2    # filesystem must be unmounted
```

Grow:

```bash
sudo xfs_growfs /
```

### btrfs

Default on Fedora Workstation. Copy-on-write with snapshots, subvolumes, checksums, transparent compression.

Check:

```bash
sudo btrfs check /dev/nvme0n1p2
```

Snapshot:

```bash
sudo btrfs subvolume snapshot -r /home /home-snapshot-$(date +%F)
```

Rollback from a snapshot: this requires the snapshot to have been made of the right subvolume, typically `@` (root). Tools like `btrfs-restore` or full-system rollback tools like `timeshift` (on Fedora and some other distros) automate the procedure.

### ZFS

Optional on most distros. Similar feature set to btrfs but more mature in some respects. Install via DKMS on Ubuntu (`zfsutils-linux`) or via rpmfusion on Fedora. ZFS pools use `zpool` commands; datasets use `zfs` commands.

### Snapshot rollback as disaster recovery

On btrfs and ZFS systems with automatic snapshots (snapper, timeshift, zfs-auto-snapshot), rolling back to a pre-breakage snapshot is often faster than debugging the actual problem. Any Fedora or openSUSE install with the default snapshot tools lets you boot into a previous system state from GRUB.

## LUKS encryption

LUKS is the Linux disk encryption standard. Encrypted drives look like normal block devices with a LUKS header — nothing is accessible until unlocked with a passphrase or keyfile.

### Opening a LUKS volume from live media

```bash
sudo cryptsetup open /dev/nvme0n1p2 decrypted_root
```

Prompts for the passphrase. On success, `/dev/mapper/decrypted_root` becomes accessible. Mount as normal:

```bash
sudo mount /dev/mapper/decrypted_root /mnt
```

Close when done:

```bash
sudo umount /mnt
sudo cryptsetup close decrypted_root
```

### LUKS on LVM or LVM on LUKS

Many installers use LVM on top of LUKS — one encrypted container holding an LVM volume group with multiple logical volumes (root, home, swap). After opening LUKS:

```bash
sudo cryptsetup open /dev/nvme0n1p2 decrypted
sudo vgscan
sudo vgchange -ay                    # activate all LVM volume groups
sudo lvs                             # list logical volumes
sudo mount /dev/mapper/vg-root /mnt
```

### Adding a new passphrase

```bash
sudo cryptsetup luksAddKey /dev/nvme0n1p2
```

Prompts for existing passphrase, then new one. Useful as a recovery key.

### Changing a passphrase

```bash
sudo cryptsetup luksChangeKey /dev/nvme0n1p2
```

### Backing up the LUKS header

Critical — a corrupt header makes the data unrecoverable even with the correct passphrase:

```bash
sudo cryptsetup luksHeaderBackup /dev/nvme0n1p2 --header-backup-file /safe-location/luks-header.bak
```

Store the backup off the machine.

## LVM basics

Logical Volume Management separates physical disks from filesystems. The three layers:

- **Physical Volume (PV).** A disk or partition initialised for LVM.
- **Volume Group (VG).** One or more PVs pooled together.
- **Logical Volume (LV).** A slice of a VG, presented as a block device.

### Inspecting LVM

```bash
sudo pvs                             # list physical volumes
sudo vgs                             # list volume groups
sudo lvs                             # list logical volumes
```

More detail with `-v` or the longer commands `pvdisplay`, `vgdisplay`, `lvdisplay`.

### Growing a logical volume

```bash
sudo lvextend -L +50G /dev/vg-root/root       # add 50GB to root LV
sudo resize2fs /dev/vg-root/root              # grow the ext4 filesystem to fit
# or for xfs:
sudo xfs_growfs /
```

Using `-l +100%FREE` consumes all remaining free space in the VG.

### Shrinking a logical volume

Shrinking is more error-prone than growing. Shrink the filesystem first, then the LV.

```bash
sudo resize2fs /dev/vg-root/home 50G
sudo lvreduce -L 50G /dev/vg-root/home
```

XFS cannot shrink — only ext4, ext3, ext2, and btrfs can.

### Adding a disk to an existing VG

```bash
sudo pvcreate /dev/sdb
sudo vgextend vg-root /dev/sdb
# now the VG has more free space, extend LVs as needed
```

## Partition management

The partition table describes how a disk is divided. Modifying partitions always carries risk; back up first.

### Inspecting

```bash
sudo fdisk -l                        # all disks and their partitions
sudo parted /dev/nvme0n1 print       # one disk
lsblk                                # tree view of block devices
lsblk -f                             # with filesystem info
```

### gparted (GUI)

The standard graphical partition tool on Linux. Shows partitions visually, supports resize, move, create, delete across common filesystems. Install:

```bash
sudo apt install gparted             # or dnf / pacman
```

gparted won't touch mounted filesystems. To resize the root partition, boot from a live USB with gparted pre-installed (Ubuntu live USB includes it, or dedicated GParted Live).

### Resizing a partition safely

The order matters:

1. **Backup.** Always.
2. **Unmount** the filesystem on the partition.
3. **Resize the partition** (`gparted`, `parted`, `fdisk`).
4. **Resize the filesystem** to match (`resize2fs`, `xfs_growfs`, or similar).

When growing, resize partition first, then filesystem. When shrinking, filesystem first, then partition. This order ensures the filesystem never extends beyond its container.

### GPT vs MBR

- **MBR** — old style. Maximum 2TB per disk. Up to four primary partitions (or three primary + unlimited logical via extended). Used only on legacy BIOS systems or very old OS installs.
- **GPT** — current. Disks over 2TB. Up to 128 partitions. Required for UEFI boot. Includes partition header redundancy and CRC checksums.

All new installs should use GPT. Converting MBR to GPT non-destructively is possible with `gdisk` but requires care — back up the partition table first.

## Rescue options beyond the standard live USB

### systemd-boot entries for rescue

Some distros (notably Arch and its derivatives with systemd-boot rather than GRUB) let you add a rescue entry that boots to emergency mode directly. Edit the relevant entry in `/boot/loader/entries/` and add `systemd.unit=emergency.target` to the options line.

### GRUB rescue shell

If GRUB itself partially loads but can't find its config, it drops to a minimal `grub rescue>` prompt. Commands available are limited:

```text
ls                                   # list devices
ls (hd0,gpt2)/                       # browse a partition
set root=(hd0,gpt2)
set prefix=(hd0,gpt2)/boot/grub
insmod normal
normal
```

This loads enough GRUB modules to reach the normal menu. From there you can boot the installed system and fix the broken config properly.

### SystemRescue

A dedicated rescue Linux distribution (formerly SystemRescueCD) — boots from USB, comes with every common repair tool (fsck variants, parted, gparted, cryptsetup, LVM tools, testdisk, GRUB reinstall helpers). Preferred over a generic Ubuntu live USB when the repair task is complex or cross-distro.

## Kernel panic at boot

A kernel panic is the equivalent of a BSOD. The screen fills with call trace output; the system halts.

### Common causes

1. **Wrong UUID in fstab** — a drive has been removed or replaced, and fstab references a UUID that no longer exists. Mark affected entries `nofail` or correct the UUID.
2. **Missing module in initramfs** — initramfs doesn't contain a driver needed to mount root. Common after hardware change (new NVMe controller) or after a manual kernel install.
3. **nvidia-dkms broken after kernel update** — not usually a panic, more often a black screen, but in extreme cases a panic.
4. **Failing hardware** — bad RAM or bad CPU core showing up during early kernel load.

### Recovery from fstab errors

Boot to emergency mode (add `systemd.unit=emergency.target` to the GRUB kernel line). Remount root read-write. Edit `/etc/fstab` to fix or comment out the offending entry:

```bash
mount -o remount,rw /
nano /etc/fstab
# save, then:
reboot
```

### Rebuilding initramfs

If a hardware change or module removal broke initramfs:

```bash
# Debian/Ubuntu:
sudo update-initramfs -u -k all

# Fedora/RHEL:
sudo dracut --regenerate-all --force

# Arch:
sudo mkinitcpio -P
```

Run these from a chroot if the system won't boot at all.

### Booting a previous kernel

GRUB's "Advanced options" submenu lets you pick a previous kernel. If the current kernel is broken (DKMS module failure, hardware incompatibility), the previous kernel usually still boots. Once booted, you can remove the broken kernel and reinstall or wait for a fix.

```bash
# Ubuntu: remove a specific kernel
sudo apt remove linux-image-6.8.0-35-generic

# Fedora: remove a specific kernel
sudo dnf remove kernel-core-6.8.5-300.fc40.x86_64
```

Keep at least two kernels installed at all times on any production system — the current one and a known-working fallback.

### Persistent panic — checking the last bit of output

On a traditional panic, the last screen shows a call trace. The function at the top of the trace is what was running when the panic occurred. Names containing `nvme` or `ahci` point at storage; `nvidia` or `amdgpu` point at graphics; `ext4` or `btrfs` at filesystem. The function name combined with the module names in the trace usually narrows the cause to a specific driver.

For panics that happen too quickly to read, `dmesg` from a previous boot is in `/var/log/` as kern.log (persistent) or in `journalctl -b -1` from a subsequent successful boot.
