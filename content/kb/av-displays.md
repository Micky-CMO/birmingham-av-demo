---
title: AV Displays — Monitors, Projectors, Lenses
category: av
updated: 2026-04-19
tags: [monitor, projector, oled, ips, mini-led, hdr, colour-accuracy, throw-ratio]
---

Displays are the component the user actually looks at for eight hours a day. Spec sheets are dense and marketing is loud; this file strips it back to what matters.

## Monitors

### Panel types

The panel technology sets most of the image quality ceiling — refresh rate, response time, contrast, viewing angle, colour volume, and price.

- **IPS.** In-plane switching. Wide viewing angles, accurate colour, moderate contrast (typically 1000:1 native). The default for professional work and general desktop use. Modern Fast IPS panels reach 1ms response time and 360Hz refresh.
- **VA.** Vertical alignment. Higher native contrast (3000:1–5000:1) and deeper blacks than IPS, at the cost of viewing angles. Good for games and film; weaker for colour-critical work because colours shift as you move your head.
- **OLED.** Organic light-emitting diode. Each pixel produces its own light, so blacks are genuinely black and contrast is effectively infinite. Instant response time. The trade-offs: lower full-screen brightness than mini-LED, text fringing on some panel subpixel layouts, and burn-in risk from static UI elements over years. QD-OLED (Samsung) and WOLED (LG) are the two technologies behind current monitors.
- **Mini-LED.** An LCD panel with thousands of individually-dimmable backlight zones. High peak brightness (1000–4000 nits), strong HDR, no burn-in risk. Blooming (halos around bright objects on dark backgrounds) is the main weakness and reduces with zone count.

### Resolutions in 2026

- **1080p (1920×1080).** The floor. Reasonable on 24" and smaller. Looks soft on 27"+.
- **1440p (2560×1440).** The gaming sweet spot on 27". Good balance of pixel density and GPU load.
- **4K (3840×2160).** The productivity sweet spot on 27–32". Demanding for gaming — a 5070 Ti or better.
- **5K (5120×2880).** 27" for studio work. Apple Studio Display, LG UltraFine. Very high pixel density, excellent for photo and typography.
- **8K (7680×4320).** Early days. Dell UP3224KB, Samsung Odyssey Neo G9 8K. Needs a 5080 or 5090 and rarely justified outside specialist video work.

### Ultrawide and super-ultrawide

- **21:9 ultrawide.** 3440×1440 at 34" or 3840×1600 at 38". A third again as wide as 16:9. Good for productivity (two documents side by side) and for sim racing, flight sims, strategy games.
- **32:9 super-ultrawide.** 5120×1440 or 5120×2160 at 49". Equivalent to two 27" 16:9 monitors joined. Desk-dominating, impressive for racing sims, oversized for office work.

Ultrawide resolutions aren't supported in every game and some older productivity apps. Check your key applications before buying.

### Refresh rate and response time

Refresh rate is how many frames per second the monitor can display — 60Hz, 144Hz, 240Hz, 360Hz, 500Hz. Higher is smoother, with diminishing returns past about 240Hz for most eyes. Response time is how fast a pixel can switch between colours — 1ms GtG is standard now, 0.03ms for OLED.

- **Office and general use.** 60Hz is fine.
- **Casual gaming.** 120–144Hz is the comfort level.
- **Competitive esports.** 240Hz and above. The difference between 144 and 240 is visible; between 240 and 360 is subtle.
- **OLED.** Response time is effectively instantaneous regardless of refresh rate, which is why OLED at 240Hz feels smoother than IPS at 360Hz.

### HDR standards

- **HDR10.** Baseline. Static metadata. Every HDR monitor supports this.
- **HDR10+.** Dynamic metadata — brightness adjusts scene by scene. Samsung-led.
- **Dolby Vision.** Also dynamic, more stringent, licensed. Common on TVs, rarer on monitors.
- **DisplayHDR certifications (VESA).** DisplayHDR 400 / 600 / 1000 / 1400 / True Black 400 / True Black 600. The number is the peak brightness. **HDR 400 is effectively not HDR** — the standard allows it without local dimming and with 8-bit panels. HDR 600 is borderline. HDR 1000 and above, or DisplayHDR True Black 400+, is where HDR starts to look like HDR.

### Colour accuracy — for creative work

- **sRGB.** The web and general consumer content colour space. Every monitor claims to cover it; quality panels cover 99%+.
- **DCI-P3.** Wider gamut used in film production. 95%+ DCI-P3 is the spec for photo and video work.
- **Adobe RGB.** Print work. Covers more green than sRGB. ~95% is good; ~99% is a professional-grade panel.
- **Rec. 2020.** The widest common gamut, used for HDR mastering. Typical panels cover 70–80% — it's a target, not a current standard.

For colour-critical work, factory-calibrated panels with a calibration report in the box (Eizo ColorEdge, BenQ SW / PD series, ASUS ProArt) are the right pick. Calibrating yourself with an X-Rite / Calibrite i1 Display Pro also works and matters more than the monitor brand — any decent IPS, properly calibrated, beats a premium panel running the factory profile.

### Connections

- **DisplayPort 1.4.** Up to 4K 120Hz with DSC, 8K 60Hz. Standard on most monitors.
- **DisplayPort 2.1.** 4K 240Hz without compression, 8K 120Hz. Required to get the most out of RTX 50 and RX 9000 cards.
- **HDMI 2.1.** 4K 120Hz, 8K 60Hz. Standard on gaming monitors and TVs.
- **USB-C with DisplayPort Alt Mode.** Carries video and can deliver 65–100W of power — one cable to a laptop for display, charging, and USB data. A huge quality-of-life improvement for mobile workstations.

### USB-C docking monitors and KVMs

A single USB-C cable from a laptop to a monitor can replace a dedicated dock: power delivery, display, USB hub, ethernet, audio. Saves desk clutter and lets a laptop dock with one plug. Look for 90W or 100W PD if the laptop is a 15" or 16" workstation; 65W is enough for a 13–14" machine. Some monitors also include a built-in KVM — plug two machines in (USB-C + HDMI, for example), share one keyboard and mouse across the USB hub, and switch between inputs with a button or a keyboard shortcut. Saves a dedicated KVM box on a desk with a personal and work laptop.

### VESA mounts and monitor arms

Every serious monitor supports VESA mounting — a standard screw pattern on the back, usually 100×100mm (some smaller displays use 75×75mm). This lets you replace the supplied stand with a monitor arm for better ergonomics, more desk space underneath, or multi-monitor setups. Ergotron LX, Herman Miller Ollin, and the Humanscale M2.1 are the reference arms. A good arm floats the monitor weightlessly and holds its position; cheap arms sag over weeks and need constant re-tightening. Check the arm's weight rating matches the monitor — a 32" mini-LED can weigh 8–10kg, which exceeds some budget arms' 6kg limit.

### What to look for when buying a monitor

1. **Match the resolution to the GPU and the desk distance.** 4K is magnificent at 32" from 80cm but pointless on a 24" monitor.
2. **Match refresh rate to the GPU.** A 240Hz monitor paired with a card that pushes 80 fps gains you nothing over 144Hz.
3. **Decide: OLED for contrast and motion, mini-LED for brightness and burn-in-free longevity, IPS for cost-effective colour-accurate work.**
4. **Stand quality.** A wobbly stand on a £1,500 monitor ruins the thing. VESA mounting (100×100 or 75×75) means you can replace a bad stand with a good arm.
5. **Text clarity.** QD-OLED uses a triangular subpixel layout that makes text slightly fringed on Windows. WOLED is cleaner for text. If the monitor is mostly for code or writing, this matters.

## Projectors

A projector makes sense when you want an image larger than about 85". Above that, the price of a screen plus a projector beats a large TV, and the image scales with the throw distance.

### Light source

- **Lamp (UHP bulb).** 2,000–5,000 hours of lamp life before replacement. Cheapest upfront, noticeable brightness decline as the bulb ages.
- **LED.** 20,000–30,000 hours. Lower peak brightness than lamp or laser. Silent, instant-on.
- **Laser (phosphor / tri-laser).** 20,000+ hours, high brightness, accurate colour. Most of the current quality range is laser.

### Brightness

Measured in ANSI lumens. Marketing "lumens" figures (LED spec) are inflated — ANSI is the honest measurement.

- **Home cinema in a dark room.** 2,000–3,000 ANSI lumens.
- **Living room with some ambient light.** 3,000–4,500 ANSI lumens.
- **Conference room or bright space.** 4,500–8,000 ANSI lumens.
- **Auditorium.** 10,000+ ANSI lumens, proper installation.

### Throw types

- **Standard throw.** Ceiling-mounted 3–5 metres from the screen. The default for dedicated cinema rooms.
- **Short throw.** 1–2 metres. Useful in smaller rooms.
- **Ultra-short throw (UST).** Sits on a cabinet right in front of the screen, projecting upward at 20–30cm distance. The "laser TV" category — Samsung Premiere, Hisense PX2-Pro, Epson LS800. Good for living rooms because nobody walks through the light path.

### Resolution

- **1080p.** Fine on screens up to ~100". Below the current standard for new purchases.
- **4K UHD (via pixel-shift).** 1920×1080 × 4 shifts = 4K equivalent. Most "4K" projectors under £4,000 work this way. Image quality is very close to native 4K for moving content.
- **Native 4K (3840×2160).** True 4K chips. JVC, Sony, Barco. £5,000+.
- **8K.** Early — few options, prices steep.

### HDR on projectors

Projectors are brightness-limited compared to TVs. HDR10 is supported across the range but the perceived effect is compressed — a 3,000-lumen projector cannot hit the same peak brightness as a 1,000-nit TV, let alone a 4,000-nit mini-LED. Laser projectors with tone mapping (JVC NZ series, Sony VPL-XW series) handle this best.

### Screens

A proper screen matters more than people think. A white painted wall works, but a dedicated screen with a correct gain (0.8–1.3 for typical home cinema) and black border gives a visibly sharper and higher-contrast image. Ambient-light-rejecting (ALR) screens are designed for UST projectors and living rooms — they reflect light from the projector's angle while absorbing light from room lighting.

### What to look for when buying a projector

1. **Match lumens to room brightness.** An underpowered projector in a bright room looks washed-out no matter the contrast spec.
2. **Throw ratio vs room size.** Measure the distance from mounting position to screen, and check the projector's throw ratio tells you the screen size it'll produce. Lens shift and zoom give flexibility; fixed-throw projectors require precise placement.
3. **Laser over lamp for anything long-term.** Lamp replacement adds £200–£400 every few thousand hours. Laser is maintenance-free for the life of the unit.
4. **Fan noise.** A loud projector in a living room is audible through quiet dialogue. Under 25 dB(A) is where decent home cinema projectors sit.

## Projector lenses

For higher-end installations, the lens is interchangeable — separated from the projector body so one projector serves rooms of different sizes.

### Throw ratio

Throw ratio = throw distance ÷ image width. A 1.5 throw ratio at 3m throw gives a 2m-wide image. Interchangeable lenses cover ranges like 0.8–1.2 (ultra-short throw), 1.25–1.9 (short throw), 1.9–3.0 (standard), 3.0–6.0 (long throw for large venues).

### Focal length

Short focal length = wide lens = short throw, larger image for a given distance. Long focal length = telephoto = long throw, narrower image but more reach. Most projector lenses quote both throw ratio and focal length range.

### When to pick each

- **Short-throw lens.** Small rooms where you can't move the projector back. Living rooms with cabinet placement.
- **Standard-throw lens.** The default for dedicated home cinema rooms.
- **Long-throw lens.** Auditoriums, large conference rooms, stadia, house of worship installations.

### Lens shift

Independent vertical and horizontal shift of the image without moving the projector. Lets you mount the projector off-axis (e.g. side-of-room ceiling mount) and still hit the screen square. More shift range = more flexibility in mounting position. Manual lens shift is common; motorised is a feature of higher-end installation projectors and allows memory presets for different aspect ratios.

### Keystone correction

Digital correction for an angled projector. Convenient, but every keystone correction throws away pixels — the image is resampled and softened. Proper lens shift is always preferable to keystone. Use keystone as a last resort.

### Anamorphic and scope aspect ratios

Cinema content is mastered in 2.40:1 (scope) — wider than the 16:9 of a standard screen. On a 16:9 projector showing scope content, you get black bars top and bottom. Three ways around this for a dedicated cinema:

- **Constant image height (CIH).** A 2.40:1 screen, with the projector zooming wider for scope and letterboxing for 16:9. The projector's lens memory stores both zoom and shift positions.
- **Anamorphic lens.** A secondary lens fitted in front of the projector, stretching the 16:9 image horizontally to fill a 2.40:1 screen. Uses every pixel — brighter and sharper than CIH for scope content, but adds cost and a second calibration step.
- **Projector with built-in anamorphic mode.** JVC, Sony, and Barco higher-end models scale internally and the anamorphic lens just spreads the result. Simplest installation where budget allows.

For 95% of home installations, the right answer is a 16:9 screen and letterboxing. Anamorphic setups are genuinely specialist.
