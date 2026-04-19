---
title: Linux Troubleshooting — systemd, Packages, Networking, Drivers
category: linux
updated: 2026-04-19
tags: [systemd, journalctl, apt, dnf, pacman, networking, nvidia, wayland, x11, permissions, dmesg, snap, flatpak]
---

This file covers Linux troubleshooting for the distros BAV customers realistically run: Ubuntu LTS, Debian stable, Fedora Workstation, Arch and its derivatives (EndeavourOS, Manjaro), Linux Mint, Pop!_OS. Commands below assume bash / zsh with a user in the sudoers group. Run commands that affect the system with `sudo` where the example shows it.

## systemd basics

systemd is the init system on every modern mainstream distro. It manages services (units), logs, mount points, timers, and network configuration. Knowing four commands covers 80% of service-related diagnosis.

### Checking a service

```bash
systemctl status nginx
```

Replace `nginx` with any unit name. The output shows:

- **Loaded:** whether the unit file is found and its enabled state.
- **Active:** running, stopped, failed, or activating.
- **Main PID:** the process ID if running.
- **Recent log lines:** the last 10 or so entries from the journal for this unit.

The status output almost always has enough detail to diagnose the issue directly. If a service is failing, the reason is usually in the log lines at the bottom of the status output.

### Listing failed units

```bash
systemctl --failed
```

Shows every unit currently in the `failed` state. Useful first check when something isn't working but the customer doesn't know what. A fresh-boot system with no failed units is a healthy system; one with three or four failures needs attention.

### Start, stop, restart, reload

```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

- `start` brings a stopped service up.
- `stop` brings a running service down.
- `restart` is stop followed by start — use when config changed significantly.
- `reload` signals the service to re-read its config without restarting — use when the service supports it (nginx, Apache, sshd, PostgreSQL), saves downtime.

### Enable, disable, mask

```bash
sudo systemctl enable nginx        # start at boot
sudo systemctl disable nginx       # don't start at boot
sudo systemctl mask nginx          # prevent from starting at all, even manually
sudo systemctl unmask nginx        # reverse a mask
```

Use `mask` when a service keeps starting despite `disable` — some packages will re-enable themselves on upgrade; masking blocks this completely.

## journalctl — systemd's log

systemd replaced `/var/log/messages` with a binary journal. Access is via `journalctl`.

### Common flags

```bash
journalctl -xe                     # recent entries with explanations, jump to end
journalctl -u nginx                # logs for one unit
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx -f             # follow (tail -f equivalent)
journalctl -b                      # current boot only
journalctl -b -1                   # previous boot
journalctl -p err                  # errors only
journalctl --since "2026-04-19 14:00"
```

### Filtering by priority

The `-p` flag takes a syslog priority level:

- `emerg` — system unusable
- `alert` — immediate action required
- `crit` — critical conditions
- `err` — errors
- `warning`
- `notice`
- `info`
- `debug`

`journalctl -p warning` shows warning and above (the more urgent levels are implied).

### Jumping to the start or end

- `-e` jumps to the end (most recent).
- `-r` reverses the order (newest first).
- `-n 50` shows the last 50 entries.
- `journalctl -n 100 -u nginx` — last 100 entries for nginx.

### Journal disk usage

```bash
journalctl --disk-usage
```

The journal grows until it hits the configured limit. Default on most distros is 10% of filesystem size, capped at 4GB. Clean up old entries:

```bash
sudo journalctl --vacuum-time=7d     # keep last 7 days
sudo journalctl --vacuum-size=500M   # keep latest 500MB
```

## dmesg — kernel ring buffer

`dmesg` shows messages from the kernel — hardware detection, driver loading, kernel panics, I/O errors.

```bash
dmesg -T                           # with human-readable timestamps
dmesg -T | tail -50
dmesg -T | grep -i error
sudo dmesg -w                      # follow (like tail -f) — needs sudo on newer distros
```

### When to use dmesg vs journalctl

- **dmesg** — hardware, kernel modules, USB events, disk errors, PCIe enumeration, network interface link state.
- **journalctl** — user-space services, authentication, application logs, boot sequence.
- **journalctl -k** — kernel messages specifically, from the journal.

The same kernel messages appear in both on systemd systems; `dmesg` is faster and more familiar to Unix admins.

### Common dmesg findings

- `I/O error, dev sda, sector 12345678` — storage failure, usually means drive is dying.
- `nvme nvme0: I/O timeout` — NVMe controller not responding, could be firmware or hardware.
- `mce: Uncorrected hardware memory error` — RAM error, equivalent to WHEA on Windows.
- `Out of memory: Kill process ... (oomkill)` — OOM killer terminated a process. Need more RAM or limit the process.
- `BUG: soft lockup` — a CPU was stuck in kernel code. Usually a driver bug or rarely hardware.

## Package managers

### APT (Debian, Ubuntu, Mint)

```bash
sudo apt update                      # refresh package lists
sudo apt upgrade                     # upgrade installed packages
sudo apt full-upgrade                # upgrade with removal/install as needed
sudo apt install nginx               # install a package
sudo apt remove nginx                # remove, keep config
sudo apt purge nginx                 # remove including config
sudo apt autoremove                  # remove orphaned dependencies
apt search nginx                     # search for packages
apt show nginx                       # package details
```

### DNF (Fedora, RHEL, Rocky, Alma)

```bash
sudo dnf check-update                # check for updates
sudo dnf upgrade                     # apply updates
sudo dnf install nginx
sudo dnf remove nginx
sudo dnf autoremove
dnf search nginx
dnf info nginx
sudo dnf distro-sync                 # align all packages to current repo versions
```

### pacman (Arch, EndeavourOS, Manjaro)

```bash
sudo pacman -Syu                     # sync and upgrade everything
sudo pacman -S nginx                 # install
sudo pacman -R nginx                 # remove
sudo pacman -Rns nginx               # remove with unused deps and config
pacman -Ss nginx                     # search
pacman -Si nginx                     # info
sudo pacman -Sc                      # clean old package cache
```

### Zypper (openSUSE)

```bash
sudo zypper refresh
sudo zypper update
sudo zypper install nginx
```

## Broken package recovery

### APT — "dpkg interrupted" / unmet dependencies

When apt is unhappy, messages like "dpkg was interrupted" or "E: Unable to correct problems, you have held broken packages."

```bash
sudo dpkg --configure -a             # finish any interrupted installs
sudo apt --fix-broken install        # resolve broken dependencies
sudo apt update
sudo apt upgrade
```

If a specific package is held back or conflicting:

```bash
apt-mark showhold                    # list held packages
sudo apt-mark unhold nginx           # unhold a package
```

For truly stuck situations, force a reinstall:

```bash
sudo apt install --reinstall nginx
```

### DNF — transaction failures

```bash
sudo dnf clean all                   # clear cache
sudo dnf makecache
sudo dnf distro-sync                 # reconcile installed vs available
```

If a transaction is stuck half-applied:

```bash
sudo dnf history
sudo dnf history undo <transaction-id>
```

### pacman — .pacnew files, keyring issues, partial upgrades

Arch uses rolling releases; partial upgrades are the single biggest cause of breakage. Never mix `pacman -Sy` (refresh only) with individual package installs — always run a full `-Syu` first.

```bash
sudo pacman -Syu                     # full system upgrade
```

Keyring failures on older installs:

```bash
sudo pacman -S archlinux-keyring
sudo pacman -Syu
```

Config file conflicts after upgrade (`.pacnew` files):

```bash
sudo find /etc -name "*.pacnew"
```

Merge the `.pacnew` changes into the existing config (e.g. with `vimdiff`), then remove the `.pacnew`.

## Permissions triage

### Reading permissions

```bash
ls -la
```

Output like `-rw-r--r-- 1 user group 4096 Apr 19 10:00 file.txt`:

- First character: `-` file, `d` directory, `l` symlink.
- Next three (rwx): owner permissions.
- Next three: group permissions.
- Last three: other permissions.
- `r` read, `w` write, `x` execute.

### Changing permissions

```bash
chmod 755 script.sh                  # rwxr-xr-x
chmod u+x script.sh                  # add execute for owner
chmod -R 644 /var/www/html           # recursive
```

Numeric meanings to know: `644` (files, typical), `755` (directories and executables, typical), `600` (private files, e.g. SSH keys), `700` (private directories).

### Changing ownership

```bash
sudo chown user:group file.txt
sudo chown -R www-data:www-data /var/www/html
```

### Access Control Lists (getfacl / setfacl)

Standard permissions cover owner / group / other. ACLs add per-user and per-group grants.

```bash
getfacl file.txt                     # show ACL
setfacl -m u:bob:rw file.txt         # give user bob read+write
setfacl -x u:bob file.txt            # remove bob's entry
setfacl -b file.txt                  # strip all ACLs
```

### sudoers

`/etc/sudoers` controls who can run what as root. Never edit directly — use `visudo`:

```bash
sudo visudo
```

Common entries:

```text
user ALL=(ALL:ALL) ALL               # user can do anything
user ALL=(ALL) NOPASSWD: ALL         # no password required (dangerous)
%sudo ALL=(ALL:ALL) ALL              # members of sudo group can do anything
```

Include files in `/etc/sudoers.d/` are preferred over direct edits — named files, one per purpose.

## Networking diagnostics

### Interface status

```bash
ip a
```

Shows every interface with its MAC address, IP addresses, and state (UP, DOWN). Look for:

- **Interface in state DOWN** — not connected or disabled. Bring up with `sudo ip link set eth0 up`.
- **No IP address** — DHCP failed or no link.
- **IPv4 in 169.254.x.x range** — DHCP failed, link-local address assigned. Check DHCP server and cabling.

### Routing

```bash
ip route
```

Shows the routing table. Must have a default route (via some gateway) for internet access:

```text
default via 192.168.1.1 dev eth0
```

If missing, DHCP didn't complete or static config is broken.

### Listening ports

```bash
sudo ss -tlnp
```

- `-t` TCP
- `-l` listening
- `-n` numeric (no DNS / service resolution)
- `-p` show process

Useful to confirm a service is actually listening on the expected port. Replace `-t` with `-u` for UDP.

### DNS

```bash
resolvectl status                    # systemd-resolved status
resolvectl query example.com         # resolve a name
```

On older / non-systemd-resolved systems:

```bash
nslookup example.com
dig example.com
cat /etc/resolv.conf
```

### NetworkManager

On Ubuntu desktop, Fedora, Mint, Pop!_OS:

```bash
nmcli device status                  # list interfaces
nmcli connection show                # list profiles
nmcli connection up "MyWifi"         # connect to a known profile
nmcli device wifi list               # scan for APs
```

GUI equivalent: network icon in the taskbar — usually covers the same operations visually.

### Connectivity tests

```bash
ping -c 4 8.8.8.8                    # basic reachability
ping -c 4 google.com                 # tests DNS and reachability
traceroute google.com                # path to destination
mtr google.com                       # combines ping and traceroute
curl -v https://example.com          # HTTP test with verbose output
```

## Process management

### top and htop

`top` is installed everywhere. `htop` is prettier and more interactive; install it (`apt install htop`) on systems that use it often.

```bash
top                                  # live process list
htop                                 # interactive, nicer
```

In `top`:
- Sort by CPU (default), memory (`M`), or PID (`N`).
- `k` to kill a selected process.
- `1` to show individual CPU cores.
- `q` to quit.

In `htop`:
- F6 to choose sort column.
- F9 to kill (with signal selection).
- F4 to filter by name.
- F5 for tree view (shows parent-child process relationships).

### ps for scripted queries

```bash
ps aux                               # all processes, full detail
ps -ef                               # similar, older syntax
ps aux | grep nginx                  # filter by name
pgrep -a nginx                       # same, cleaner output
```

### Killing processes

```bash
kill <PID>                           # polite SIGTERM
kill -9 <PID>                        # forceful SIGKILL — only when SIGTERM didn't work
killall nginx                        # kill all processes named nginx
pkill -f "python script.py"          # kill by matching command line
```

SIGTERM (the default) gives the process a chance to clean up. SIGKILL (-9) is immediate and unconditional — use only when SIGTERM is ignored. Services under systemd should be stopped with `systemctl stop`, not kill, so systemd knows the service is stopped deliberately.

### Finding what's using a file or port

```bash
sudo lsof /var/log/nginx/access.log  # which process has this file open
sudo lsof -i :80                     # which process is listening on port 80
sudo fuser -v /var/lib/mysql         # which processes have this directory open
```

### Load average

```bash
uptime
```

Output like `load average: 0.52, 0.58, 0.59` — load averaged over 1, 5, and 15 minutes. A load equal to the number of CPU cores means the system is fully busy but not overloaded. Load significantly higher than core count means processes are waiting for CPU or I/O.

## SSH troubleshooting

SSH is the most common remote-access tool and a frequent source of "it was working, now it's not" questions.

### Basic test

```bash
ssh -v user@host                     # verbose — shows every step
ssh -vvv user@host                   # very verbose for deeper issues
```

The verbose output names the exact step that fails — authentication method, host key, channel, shell. Read from the top; the first error is usually the real one.

### Common failures

- **"Connection refused".** SSH daemon isn't running on the target, or firewall blocking. Check `systemctl status ssh` on the target; check firewall rules (`ufw status` on Ubuntu, `firewall-cmd --list-all` on Fedora).
- **"Connection timed out".** Network unreachable or port blocked. Test with `ping` and `telnet host 22` or `nc -zv host 22`.
- **"Permission denied (publickey)".** Your key isn't on the server, or file permissions are wrong. On the server, `~/.ssh/authorized_keys` must be mode 600 and `~/.ssh/` must be 700 — SSH refuses loose permissions.
- **"Host key verification failed".** The server's key changed (legitimate reinstall, or potentially a man-in-the-middle). If legitimate, remove the old entry: `ssh-keygen -R hostname`.
- **"Too many authentication failures".** SSH tries every loaded key in order. After too many misses it aborts. Fix: `ssh -o IdentitiesOnly=yes -i ~/.ssh/specific_key user@host`.

### SSH agent

Loading keys into the agent avoids typing the passphrase every time:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l                           # list loaded keys
```

On desktop Linux, `ssh-agent` usually starts automatically with the session; `ssh-add` loads specific keys into it.

### Config file for shortcuts

`~/.ssh/config` stores per-host settings:

```text
Host server1
    HostName server1.example.com
    User hamzah
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
```

Then `ssh server1` uses all those settings automatically.

## Kernel modules

### Listing loaded modules

```bash
lsmod                                # all loaded modules
lsmod | grep nvidia                  # is the NVIDIA module loaded
```

### Loading / unloading

```bash
sudo modprobe nvidia                 # load module
sudo modprobe -r nvidia              # unload
```

`modprobe` handles dependencies automatically (loads required modules first). `insmod` and `rmmod` operate on single modules without dependency handling — rarely used directly.

### Module not loading

If `modprobe` reports "FATAL: Module X not found", the module isn't installed. Install the right package (e.g. `linux-modules-extra-$(uname -r)` on Ubuntu, or the relevant kmod package on Fedora).

If it reports an error but the module exists, check `dmesg`:

```bash
sudo dmesg | tail -30
```

The module's load failure reason is usually in the most recent kernel messages.

### Blacklisting a module

Preventing a module from loading (e.g. blacklisting nouveau when installing NVIDIA proprietary):

```bash
echo "blacklist nouveau" | sudo tee /etc/modprobe.d/blacklist-nouveau.conf
sudo update-initramfs -u             # Ubuntu/Debian
sudo dracut --force                  # Fedora
sudo reboot
```

## SELinux and AppArmor

Mandatory Access Control layers that enforce policies on top of standard permissions. A file may have correct Unix permissions and still be denied access because the MAC policy blocks it.

### SELinux (Fedora, RHEL, Rocky, Alma)

```bash
getenforce                           # current mode: Enforcing, Permissive, or Disabled
sudo setenforce 0                    # temporarily permissive (logs violations, doesn't block)
sudo setenforce 1                    # back to enforcing
```

For persistent changes, edit `/etc/selinux/config`. Set `SELINUX=permissive` or `SELINUX=disabled`.

SELinux denials appear in `/var/log/audit/audit.log` or via `journalctl`:

```bash
sudo ausearch -m avc -ts recent      # recent AVC denials
```

The right fix for most SELinux denials isn't to disable it — it's to correct the file context or add the specific policy exception. Typical fix commands:

```bash
sudo restorecon -Rv /var/www/html    # restore default contexts
sudo setsebool -P httpd_can_network_connect 1    # allow httpd network calls
```

### AppArmor (Ubuntu, Debian, SUSE)

```bash
sudo aa-status                       # what's protected and in which mode
```

AppArmor profiles live in `/etc/apparmor.d/`. Switch a profile to complain mode (log but don't enforce) to debug:

```bash
sudo aa-complain /usr/sbin/nginx
sudo aa-enforce /usr/sbin/nginx      # back to enforce
```

### Symptom of a MAC denial

Permission-like errors ("Permission denied", "Access denied") that persist after confirming Unix permissions are correct. `ls -la` shows the right owner, group, and mode, but the operation still fails. Check the relevant MAC log before assuming the error means something else.

## Disk space

### Quick overview

```bash
df -h
```

Shows each mounted filesystem with size, used, available, and use%. `-h` means human-readable (1.4G instead of 1467890).

A filesystem at 100% is a problem; 95%+ is a warning. The root filesystem filling up is the most common cause — log files, package caches, or user data left somewhere on `/`.

### Finding what's using space

```bash
sudo du -sh /*                       # top-level sizes of everything in /
sudo du -sh /var/* | sort -hr        # top space users in /var
```

The `-sh` means summarise (total per target, not per file) and human-readable. `sort -hr` sorts human-readable sizes in reverse (largest first).

For interactive exploration, `ncdu` is often the best tool:

```bash
sudo apt install ncdu                # or dnf / pacman
sudo ncdu /
```

Navigate the tree with arrow keys, delete selections with `d`.

### Common space hogs

- `/var/log/` — log files. Rotate or clean with `journalctl --vacuum-*`.
- `/var/cache/apt/archives/` — cached .deb files. `sudo apt clean` clears.
- `/var/cache/pacman/pkg/` — Arch package cache. `sudo pacman -Sc` or `-Scc` clears.
- `~/.cache/` — user application caches. Safe to clear; apps rebuild as needed.
- Docker: `/var/lib/docker/` grows fast. `docker system prune` reclaims space.
- Snap: `/var/lib/snapd/snaps/` — old snap revisions. `sudo snap set system refresh.retain=2` limits retained versions.

## Snap and Flatpak

Sometimes `apt` or `dnf` don't have a recent version of a package, or you want an isolated install. Snap (Canonical, default on Ubuntu) and Flatpak (cross-distro, default on Fedora) fill the gap.

### Snap basics

```bash
snap list                            # installed snaps
sudo snap install firefox            # install
sudo snap remove firefox             # remove
sudo snap refresh                    # update all
sudo snap refresh firefox            # update specific
```

Snap runs updates automatically in the background. Disabling this is awkward by design — Canonical considers it an anti-pattern.

### Flatpak basics

```bash
flatpak list                         # installed flatpaks
flatpak install flathub org.mozilla.firefox
flatpak uninstall org.mozilla.firefox
flatpak update
flatpak run org.mozilla.firefox
```

Flatpak apps are sandboxed with their own permissions. Grant access to additional paths or hardware with `flatpak override` or via the Flatseal GUI.

### When to reach for each

- Native package from apt / dnf / pacman **first** — best integration.
- Flatpak when the native version is too old, or you want sandboxing.
- Snap on Ubuntu when no alternative exists.
- AppImage for a portable single-file binary with no install.

## User vs root / config locations

### Service file locations

- `/etc/systemd/system/` — admin-managed system services. Higher priority than vendor files.
- `/usr/lib/systemd/system/` — vendor-supplied system services (installed by packages).
- `~/.config/systemd/user/` — user-level services, run under the user's session.

To run a service as the current user (not root), use `--user`:

```bash
systemctl --user status my-service
systemctl --user enable my-service
```

User services don't need sudo — they run under the user's session. Useful for things like music daemons, sync clients, editor daemons.

### Configuration file locations

- `/etc/` — system-wide config, requires root to modify.
- `~/.config/` — user-specific config (modern XDG standard).
- `~/.local/share/` — user-specific data.
- `~/.cache/` — user-specific cache (safe to clear).
- `~/.<appname>rc` — legacy location some apps still use (.bashrc, .vimrc, .gitconfig).

Mixing root and user configs is a common confusion source. If a setting works "only when I run with sudo", the config is in `/root/.config/` rather than `~/.config/`, or vice versa.

## Display server — Wayland vs X11

Modern distros default to Wayland; older or more conservative setups still use X11. Behaviour differs in ways that matter for troubleshooting.

### Checking which is active

```bash
echo $XDG_SESSION_TYPE
```

Returns `wayland` or `x11`.

### Wayland symptoms

- Screen-recording and screen-sharing apps work differently — portals (xdg-desktop-portal) mediate sharing, and some apps don't yet support them.
- X11-only apps run through XWayland compatibility layer — works for most, fails for some (particularly old games and some pro software).
- Keyboard / mouse automation tools (xdotool, xinput) don't work under Wayland — different APIs.
- Proprietary NVIDIA drivers have historically lagged on Wayland; by 2026 this is largely resolved for RTX 20-series and newer on driver 550+.

### Switching to X11 temporarily

On GNOME / GDM and KDE / SDDM login screens, the gear icon on the login prompt lets you pick X11 or Wayland sessions if both are installed.

On Ubuntu, to default to X11, edit `/etc/gdm3/custom.conf` and uncomment `WaylandEnable=false`, then reboot.

## NVIDIA drivers on Linux

NVIDIA on Linux is a recurring source of pain — less so in 2026 than five years ago, but still not plug-and-play in the way AMD and Intel typically are.

### Nouveau vs proprietary

- **Nouveau** — the open-source reverse-engineered driver. Ships with the kernel. Works out of the box, very poor performance, no CUDA, limited power management.
- **NVIDIA proprietary (nvidia-driver-550 and similar)** — closed-source. Full performance, CUDA, Vulkan, proper power management.
- **NVIDIA open-source kernel modules (550+)** — NVIDIA's own open-source kernel driver (distinct from nouveau). For Turing and later GPUs. User-space components still proprietary.

For any serious use (gaming, ML, compute), install the proprietary driver.

### Installing proprietary driver on Ubuntu

```bash
ubuntu-drivers devices               # list available drivers for detected hardware
sudo ubuntu-drivers install          # auto-install the recommended
```

Or install specific version:

```bash
sudo apt install nvidia-driver-550
sudo reboot
```

### Installing on Fedora

RPM Fusion is required:

```bash
sudo dnf install https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm
sudo dnf install https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
sudo dnf install akmod-nvidia
sudo reboot
```

Wait 5–10 minutes after reboot for DKMS to build the module before the GUI appears — this is normal.

### Kernel updates breaking the module (DKMS)

The NVIDIA driver's kernel module needs to be rebuilt for each kernel version. Most distros handle this through DKMS automatically. When it fails, symptoms are a black screen or text-only console after a kernel upgrade.

```bash
sudo dkms status                     # check whether the module built for current kernel
sudo dkms autoinstall                # rebuild for all installed kernels
```

If DKMS fails to build, check the log:

```bash
cat /var/lib/dkms/nvidia/*/build/make.log
```

Usually the build failure is due to kernel headers missing:

```bash
sudo apt install linux-headers-$(uname -r)    # Debian/Ubuntu
sudo dnf install kernel-devel-$(uname -r)     # Fedora
```

### Rolling back to a working kernel

Boot into a previous kernel from GRUB's Advanced options menu. Log in, remove the broken kernel:

```bash
sudo apt remove linux-image-<broken-version>       # Ubuntu
sudo dnf remove kernel-core-<broken-version>       # Fedora
```

## Fan control

Desktop Linux fan control uses `lm-sensors` and `fancontrol`.

### Setup

```bash
sudo apt install lm-sensors fancontrol          # or dnf / pacman
sudo sensors-detect                             # walks through chip detection
```

Answer Yes to the prompts; the detection writes to `/etc/modules` and similar config.

### Reading temperatures

```bash
sensors
```

Output shows every detected chip with its temperature and fan speed sensors.

### Configuring fan curves

```bash
sudo pwmconfig
```

Interactive script that tests each fan, associates it with a temperature sensor, and builds a curve. Writes to `/etc/fancontrol`.

Start / stop the service:

```bash
sudo systemctl enable --now fancontrol
```

### Laptop-specific

Laptops often use embedded controller (EC) firmware for fan control that Linux can't access directly. Tools like `thinkfan` (IBM/Lenovo ThinkPads) and `dell-smm-hwmon` (Dell) provide vendor-specific control. For most laptops, BIOS settings are the right place to manage fan behaviour.
