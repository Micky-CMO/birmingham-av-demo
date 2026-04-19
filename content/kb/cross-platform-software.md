---
title: Cross-Platform Software Issues
category: cross-platform
updated: 2026-04-19
tags: [browsers, office, outlook, adobe, vscode, docker, wsl, steam, email-setup, antivirus]
---

This file covers application-level issues that appear across both Windows and macOS / Linux where relevant. The troubleshooting here is OS-agnostic — fixes apply regardless of which OS the customer is running unless specifically noted.

## Browsers

### Chrome / Edge — profile corruption

A corrupted profile shows as: crashes at launch, missing bookmarks, settings not saving, extensions misbehaving.

**Fix sequence:**

1. Close the browser fully (check Task Manager / Activity Monitor / `ps` to ensure no process is lingering).
2. Locate the profile folder:
   - **Windows Chrome:** `%LOCALAPPDATA%\Google\Chrome\User Data\Default`
   - **Windows Edge:** `%LOCALAPPDATA%\Microsoft\Edge\User Data\Default`
   - **macOS:** `~/Library/Application Support/Google/Chrome/Default`
   - **Linux:** `~/.config/google-chrome/Default`
3. Rename `Default` to `Default.old`.
4. Launch the browser. A fresh profile is created.
5. If you need data from the old profile, copy specific files from `Default.old` into the new `Default` folder while the browser is closed: `Bookmarks`, `Login Data`, `History`, `Preferences`, `Cookies`.

### Firefox — profile corruption

Firefox has a built-in profile manager.

1. Close Firefox fully.
2. Launch with the profile manager: `firefox -P` (any platform).
3. Create a new profile, test if the issue persists with the new one.
4. If the new profile is fine, the old one is corrupt. Selectively import from `~/.mozilla/firefox/<old-profile>/` — `places.sqlite` (bookmarks + history), `logins.json` + `key4.db` (passwords), `formhistory.sqlite`.

### Cache and cookies reset

The simplest browser fix — clears most issues around sites not loading properly, logins not persisting, or outdated content.

- **Chrome / Edge:** Ctrl+Shift+Del → choose time range and data types → Clear data.
- **Firefox:** Ctrl+Shift+Del → same flow.

When a specific site misbehaves, clear cookies for just that site rather than everything — avoids losing logins on other sites.

### Hardware acceleration — toggling off

GPU-accelerated rendering can cause issues on specific hardware: visual artifacts, flickering, crashes during video playback. Toggling off forces software rendering.

- **Chrome / Edge:** Settings → System → toggle off "Use hardware acceleration when available" → Relaunch.
- **Firefox:** Settings → General → Performance → untick "Use recommended performance settings" → untick "Use hardware acceleration when available".

Not always the answer — software rendering is slower and uses more CPU. Re-enable after testing if the issue isn't hardware-acceleration-related.

### Extension triage

A bad extension is the most common cause of browser issues.

1. Launch in incognito / private mode. Extensions usually don't run in private by default. If the issue disappears, an extension is the cause.
2. Disable all extensions, then re-enable one at a time to identify the culprit.
3. If the problem is with a specific site, try disabling ad blockers and privacy extensions — they often break sites that rely on third-party resources.

## Microsoft Office

### Outlook — OST file corruption

The OST file is Outlook's local cache for Exchange / Microsoft 365 accounts. When it's corrupt, Outlook slows to a crawl, search returns wrong results, or items fail to sync.

**Fix:**

1. Close Outlook.
2. Locate the OST file: `%LOCALAPPDATA%\Microsoft\Outlook\`. Filename is usually `user@domain.com.ost`.
3. Rename it to `.ost.old`.
4. Restart Outlook. A new OST is built, re-syncing from the server. Takes 10 minutes to several hours depending on mailbox size.
5. Once confirmed working, delete `.ost.old`.

OST files don't need backing up — they rebuild from the server. PST files do.

### Outlook — PST file corruption

PST files store data for local and some POP3 accounts. Not server-side, so they need backup and can be genuinely lost if corrupt.

**Fix with SCANPST:**

1. Close Outlook.
2. Find `SCANPST.EXE` (Inbox Repair Tool). Location varies by Office version — in `C:\Program Files\Microsoft Office\root\OfficeXX\` for most current installs.
3. Run SCANPST, point it at the PST file.
4. Tick "Make backup of scanned file before repairing".
5. Run repair. Takes minutes to hours for large files.
6. Reopen Outlook.

SCANPST can fix minor corruption but not large-scale damage. For badly corrupted PSTs, third-party tools (Stellar Repair for Outlook, DataNumen Outlook Repair) sometimes recover more — but the best protection is regular PST backups.

### Word — corrupt document

A document that crashes Word at open.

**Recovery sequence:**

1. Open Word with no document. File → Open → navigate to the file → in the Open dialog, click the arrow next to Open → "Open and Repair".
2. If that fails, File → Options → Advanced → in General section, tick "Confirm file format conversion on open". Now opening the file lets you pick a different reader (e.g. recover text from any file).
3. If still no luck, rename the file extension to `.zip`. Modern .docx files are ZIP archives. Extract with any ZIP tool; inside, `word/document.xml` contains the text. Copy / paste from there.

### Excel — shared workbook issues

Legacy "Shared Workbook" feature is being retired in favour of co-authoring in SharePoint / OneDrive.

- **Use co-authoring** for multi-user editing on current Office — save the file to SharePoint or OneDrive, multiple users edit simultaneously.
- **Avoid legacy shared workbook mode** — it's error-prone, has severe feature restrictions, and is disabled by default in newer Office versions.

### Office activation failures

Common error codes in this area: 0xC004F074 (KMS unreachable), 0xC004C003 (key blocked), 0x8007000D (data invalid).

**Fix sequence:**

1. Settings → Accounts → verify the Microsoft account associated with the licence.
2. Office application → File → Account → Sign out, then Sign in again.
3. Microsoft Support and Recovery Assistant (free, from Microsoft) diagnoses activation issues.
4. As a last resort, uninstall Office (Control Panel → Programs, or on current Windows, `Settings → Apps`), then reinstall from account.microsoft.com.

### Click-to-Run vs MSI

Modern Microsoft 365 and Office 2019+ are Click-to-Run installs — stream-installed, updated automatically, and isolated in their own folder. Older Office (2016 Volume License, 2013) used MSI installers — traditional Windows installer, separate updates.

**You cannot mix them on the same machine.** A failed transition between Click-to-Run and MSI is a frequent source of activation and update failures. Clean uninstall with the Office Removal Tool, then reinstall the correct version.

## Adobe Creative Cloud

### Licence issues — sign-in fails, asks to sign in repeatedly

1. Close all Adobe apps. End any `AdobeIPC` or `Creative Cloud` processes in Task Manager.
2. Open Creative Cloud Desktop.
3. Sign out (top-right menu → Sign out). Confirm.
4. Sign back in.

If that doesn't fix it:

1. Run Adobe Creative Cloud Cleaner Tool (free, from Adobe).
2. Choose "Clean All" (wipes everything) or "Clean" for specific products.
3. After cleaning, reinstall from creativecloud.adobe.com.

### Creative Cloud Cleaner Tool

Official Adobe tool for when normal uninstall doesn't fully remove Creative Cloud or individual apps. Downloads from Adobe's help site. Run as administrator on Windows. Removes all trace of Adobe from the machine — useful before a fresh install or when switching between subscription types.

### Fonts not loading

Creative Cloud syncs fonts from Adobe Fonts. When they stop appearing in apps:

1. Creative Cloud Desktop → Fonts tab → verify fonts are showing as active.
2. Restart the affected app (Photoshop, Illustrator, etc).
3. If no fonts appear at all, CC → Account → sign out → sign back in.
4. Check the specific font hasn't been removed from the Adobe Fonts catalogue.

### Colour profile sync

In colour-critical work (print, video), ICC profiles must match between apps. Adobe apps use profiles from `C:\Program Files (x86)\Common Files\Adobe\Color\Profiles` (Windows) or `/Library/Application Support/Adobe/Color/Profiles` (macOS). Custom or calibrated profiles go in the user's profile folder.

If profiles don't sync between machines, Creative Cloud's sync settings include colour settings under "Preferences sync". On a calibrated system, don't sync colour settings across machines with different monitors — the profiles are display-specific.

## VS Code

### Extension conflicts

Symptoms: crashes at launch, IntelliSense broken, terminal won't open, features missing.

**Start clean:**

1. Launch with extensions disabled: `code --disable-extensions`.
2. If fine in this mode, re-enable extensions one at a time to find the conflict.
3. The culprit is usually a language extension (TypeScript, Python, Java) with a broken version — update or reinstall from the Extensions pane.

### Settings reset

If VS Code itself is broken but extensions aren't the issue, reset settings:

1. Close VS Code.
2. Rename the settings folder:
   - **Windows:** `%APPDATA%\Code\User\`
   - **macOS:** `~/Library/Application Support/Code/User/`
   - **Linux:** `~/.config/Code/User/`
3. Relaunch — a default settings set is created.
4. Copy `settings.json`, `keybindings.json` from the renamed folder selectively.

### Workspace trust

VS Code 1.57+ requires trust for workspaces running extensions that execute code. If features seem missing:

- File → Preferences → Trust this workspace, or
- Command Palette (Ctrl+Shift+P) → "Workspaces: Manage Workspace Trust".

Untrusted workspaces have restricted features and some extensions disabled.

### Remote and WSL development

VS Code's Remote extensions (Remote - SSH, Remote - WSL, Remote - Containers) connect VS Code to a remote environment. Common issues:

- **WSL connection fails** — WSL 2 must be installed and functional. `wsl --status` from PowerShell confirms.
- **SSH connection hangs** — verify SSH works from a separate terminal first. VS Code relies on working SSH.
- **Extensions not appearing in remote** — extensions are scoped to local or remote. "Install in WSL / SSH Host" re-installs the extension in the remote environment.

## Docker Desktop

### WSL 2 backend

Docker Desktop on Windows uses WSL 2 as its Linux environment. When it won't start:

1. `wsl --status` — verify WSL is installed and version 2 is default.
2. `wsl --update` — update the WSL kernel.
3. `wsl --list --verbose` — confirm `docker-desktop` distributions are present and running.

### Hardware virtualisation required

Docker requires VT-x (Intel) or AMD-V. If disabled in BIOS, Docker refuses to start.

1. Enter BIOS / UEFI.
2. Find "Virtualisation" / "VT-x" / "Intel VT" / "SVM Mode" (AMD).
3. Set to Enabled.
4. Save and reboot.

Check from Windows: Task Manager → Performance → CPU — "Virtualisation" shows Enabled or Disabled.

### Disk image reset

Over time, Docker's disk image grows with old images, layers, and volumes. Reclaim space:

```bash
docker system prune -a               # remove unused images, containers, networks
docker volume prune                  # remove unused volumes (careful — data loss)
docker builder prune                 # remove build cache
```

For full reset, Docker Desktop → Settings → Troubleshoot → Reset to factory defaults.

## WSL 2

### Installation

```powershell
wsl --install
```

On recent Windows 11 this installs WSL, enables the required features, and installs Ubuntu by default.

For specific distributions:

```powershell
wsl --list --online                  # available distributions
wsl --install -d Ubuntu-24.04
```

### Reset a distribution

If a WSL distribution becomes broken:

```powershell
wsl --shutdown                       # stop everything
wsl --unregister Ubuntu              # remove a distribution (also erases data)
wsl --install -d Ubuntu              # reinstall fresh
```

`--unregister` is destructive — export data first if needed:

```powershell
wsl --export Ubuntu C:\backup\ubuntu.tar
```

### Network bridging

WSL 2 uses a virtualised network by default. Services on `localhost` in WSL are usually forwarded automatically to Windows' localhost, but exceptions occur:

- Firewall rules on the Windows Defender side may block the WSL network adapter.
- `wsl hostname -I` inside WSL shows the WSL IP — if localhost forwarding doesn't work, use this IP directly from Windows.

For bridged networking where WSL gets an IP on the physical network, enable mirrored mode in `.wslconfig`:

```ini
[wsl2]
networkingMode=mirrored
```

Place in `%USERPROFILE%\.wslconfig`. `wsl --shutdown` and restart to take effect.

## Steam and game launchers

### Shader cache corruption

Symptoms: game stutters that weren't there before, occasional crashes, DLSS or FSR glitches after GPU driver update.

**Fix:**

- **NVIDIA:** Clear DirectX and Vulkan shader caches at `%LOCALAPPDATA%\NVIDIA\DXCache\` and `%LOCALAPPDATA%\NVIDIA\GLCache\`.
- **AMD:** `C:\Users\<user>\AppData\Local\AMD\DxCache\` and `\VkCache\`.
- **Steam:** Right-click game → Properties → Installed Files → tab has "Clear shader cache" for Vulkan games.

### File verification

For games that worked and now don't:

- **Steam:** Right-click → Properties → Installed Files → Verify integrity of game files. Re-downloads any changed or missing files.
- **Epic:** Library → game → three-dot menu → Verify.
- **Battle.net:** Click the game → gear icon → Scan and Repair.
- **GOG Galaxy:** Right-click → Manage installation → Verify / Repair.

### Proton issues on Linux

Steam on Linux uses Proton (Wine + additional libraries) to run Windows games.

- **Game won't launch.** Check the Steam Community forum for the specific title — most issues are documented with the Proton version that works. Right-click game → Properties → Compatibility → Force the use of a specific Steam Play compatibility tool.
- **Proton GE.** A community fork of Proton with additional patches and fixes. Install via ProtonUp-Qt (GUI) or manually. Then available in the same compatibility dropdown.
- **Missing libraries.** Native game launches may need specific 32-bit libraries installed — common error is "libvulkan.so.1 not found". Install the distro's Vulkan 32-bit package.

## Email client setup

Setting up email on any client requires server names, ports, and the right security settings. The quick reference:

### IMAP vs POP3 vs Exchange

- **IMAP.** Mail stays on the server; clients show the server's current state. Right choice for almost all users — multiple devices see the same mail.
- **POP3.** Mail downloads to the client and is (usually) deleted from server. Right choice when you want everything on one device and no server-side copy. Largely obsolete.
- **Exchange / MAPI / EAS.** Microsoft's own protocols. Used by Outlook against Microsoft 365 and Exchange servers. Superior to IMAP for corporate mail (calendar, contacts, rules sync).

### Common provider settings

| Provider | IMAP server | IMAP port | SMTP server | SMTP port |
|----------|-------------|-----------|-------------|-----------|
| Gmail | imap.gmail.com | 993 (SSL) | smtp.gmail.com | 465 (SSL) or 587 (STARTTLS) |
| Microsoft 365 | outlook.office365.com | 993 (SSL) | smtp.office365.com | 587 (STARTTLS) |
| iCloud | imap.mail.me.com | 993 (SSL) | smtp.mail.me.com | 587 (STARTTLS) |
| Yahoo | imap.mail.yahoo.com | 993 (SSL) | smtp.mail.yahoo.com | 465 (SSL) |

### App passwords

Gmail, Microsoft 365, iCloud, and Yahoo all require **app-specific passwords** for clients that don't support modern authentication. Generate one from the account's security settings. Use this app password, not the main account password.

### Security settings

- **SSL/TLS** (sometimes labelled "SSL" or "encrypted connection"). Encrypts the connection from the start. Used on ports 993 (IMAP), 465 (SMTP), 995 (POP3).
- **STARTTLS.** Starts unencrypted, then upgrades to encrypted. Used on ports 143 (IMAP), 587 (SMTP), 110 (POP3).
- **None.** Don't.

When setup fails, check that SSL / STARTTLS matches the port. Port 993 without SSL won't work; port 587 with implicit SSL usually won't either.

## Antivirus — built-in vs third-party

### Windows Defender (Microsoft Defender Antivirus)

Built into Windows 10 and 11. Continuously improved over the past decade. Now consistently in the top tier of AV-Test and AV-Comparatives results. Integrated with Windows Update, minimal performance impact, no license needed.

**Leave Defender on for the vast majority of customers.** Adding a third-party AV rarely improves protection and often causes problems.

### When third-party is justified

- **Regulatory or corporate requirements** specifying a specific vendor.
- **Specialist detection** for particular threat categories (corporate endpoint detection and response — EDR — platforms like CrowdStrike, SentinelOne, Microsoft Defender for Endpoint).
- **Cross-platform households** where the third-party covers Windows, macOS, and Android under one subscription.

### When third-party causes more problems than it solves

- **Two AVs running simultaneously.** Known-bad. They fight each other, slow the system, and create conflicts. Windows disables Defender automatically when it detects another active AV — don't disable it manually or run two in parallel.
- **Free versions bundled with browsers or toolbars.** Many popular free AVs install extras that slow the system more than they protect it.
- **Expired subscriptions.** A paid AV with an expired subscription continues running but doesn't update definitions. Defender re-activates when the third-party is removed or the subscription lapses.

### Removing a third-party AV cleanly

Most vendors provide removal tools because Windows' "Uninstall a program" often leaves drivers and registry entries behind. Examples:

- Norton Remove and Reinstall Tool
- McAfee Consumer Product Removal (MCPR)
- Avast / AVG Clear
- Bitdefender Uninstall Tool

Run the vendor's removal tool rather than the standard uninstaller. After removal and reboot, Defender re-activates automatically.
