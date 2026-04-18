"""
Generate the two client-facing PDFs for the Birmingham AV project.

  1. Birmingham AV - Platform Blueprint.pdf      (for Hamzah, the owner)
  2. Mickai - White-Label E-Commerce Playbook.pdf (for Mickai, the platform builder)

Design language: editorial, confident, no em dashes in user-facing copy
(per Micky's house rule). All brand colour is kelly green #1EB53A on white
for the BAV deck; Mickai deck uses obsidian + signature green.
"""

from __future__ import annotations

import os
from pathlib import Path

from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import HRFlowable

# ---- Paths --------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "apps" / "web" / "public" / "brand" / "logo.png"
HERO = ROOT / "apps" / "web" / "public" / "brand" / "hero-poster.jpg"
OUT_BAV = ROOT / "Birmingham AV - Platform Blueprint.pdf"
OUT_MKI = ROOT / "Mickai - White-Label E-Commerce Playbook.pdf"

# ---- Brand tokens -------------------------------------------------------

BAV_GREEN = HexColor("#1EB53A")
BAV_GREEN_DARK = HexColor("#16A432")
BAV_INK = HexColor("#0A0A0A")
BAV_INK_700 = HexColor("#2B2E35")
BAV_INK_500 = HexColor("#6B7280")
BAV_INK_300 = HexColor("#D4D4D8")
BAV_INK_100 = HexColor("#F3F4F6")
BAV_INK_50 = HexColor("#F9FAFB")
BAV_WHITE = HexColor("#FFFFFF")
MKI_OBSIDIAN = HexColor("#0B0D12")
MKI_STEEL = HexColor("#4F91FF")

# ---- Page geometry ------------------------------------------------------

PAGE_W, PAGE_H = A4
MARGIN_X = 22 * mm
MARGIN_Y = 22 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X
CONTENT_H = PAGE_H - 2 * MARGIN_Y


# ---- Styles -------------------------------------------------------------

def make_styles(accent: Color) -> dict:
    """Generate a paragraph style dict for a given accent colour."""
    ss = getSampleStyleSheet()
    # Base font stack: Helvetica is guaranteed; avoid Unicode glyphs.
    return {
        "cover_title": ParagraphStyle(
            "cover_title", parent=ss["Title"],
            fontName="Helvetica-Bold", fontSize=48, leading=52,
            textColor=BAV_INK, alignment=TA_LEFT, spaceAfter=16,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle", parent=ss["Normal"],
            fontName="Helvetica", fontSize=16, leading=22,
            textColor=BAV_INK_500, alignment=TA_LEFT, spaceAfter=0,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta", parent=ss["Normal"],
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            textColor=BAV_INK_500, alignment=TA_LEFT,
        ),
        "eyebrow": ParagraphStyle(
            "eyebrow", parent=ss["Normal"],
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            textColor=accent, alignment=TA_LEFT, spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1", parent=ss["Heading1"],
            fontName="Helvetica-Bold", fontSize=28, leading=34,
            textColor=BAV_INK, alignment=TA_LEFT, spaceBefore=0, spaceAfter=14,
        ),
        "h2": ParagraphStyle(
            "h2", parent=ss["Heading2"],
            fontName="Helvetica-Bold", fontSize=18, leading=24,
            textColor=BAV_INK, alignment=TA_LEFT, spaceBefore=18, spaceAfter=8,
        ),
        "h3": ParagraphStyle(
            "h3", parent=ss["Heading3"],
            fontName="Helvetica-Bold", fontSize=12, leading=16,
            textColor=BAV_INK, alignment=TA_LEFT, spaceBefore=12, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", parent=ss["BodyText"],
            fontName="Helvetica", fontSize=10.5, leading=16,
            textColor=BAV_INK_700, alignment=TA_LEFT, spaceAfter=8,
        ),
        "body_justify": ParagraphStyle(
            "body_justify", parent=ss["BodyText"],
            fontName="Helvetica", fontSize=10.5, leading=16,
            textColor=BAV_INK_700, alignment=TA_JUSTIFY, spaceAfter=8,
        ),
        "lead": ParagraphStyle(
            "lead", parent=ss["BodyText"],
            fontName="Helvetica", fontSize=13, leading=20,
            textColor=BAV_INK, alignment=TA_LEFT, spaceAfter=12,
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=ss["BodyText"],
            fontName="Helvetica", fontSize=10.5, leading=15,
            textColor=BAV_INK_700, alignment=TA_LEFT,
            leftIndent=14, bulletIndent=0, spaceAfter=4,
        ),
        "callout_title": ParagraphStyle(
            "callout_title", parent=ss["Heading3"],
            fontName="Helvetica-Bold", fontSize=11, leading=14,
            textColor=accent, alignment=TA_LEFT, spaceAfter=4,
        ),
        "callout_body": ParagraphStyle(
            "callout_body", parent=ss["BodyText"],
            fontName="Helvetica", fontSize=10, leading=15,
            textColor=BAV_INK_700, alignment=TA_LEFT, spaceAfter=0,
        ),
        "quote": ParagraphStyle(
            "quote", parent=ss["BodyText"],
            fontName="Helvetica-Oblique", fontSize=14, leading=22,
            textColor=BAV_INK, alignment=TA_LEFT, spaceAfter=12,
            leftIndent=12, borderColor=accent, borderPadding=0,
        ),
        "caption": ParagraphStyle(
            "caption", parent=ss["BodyText"],
            fontName="Helvetica", fontSize=8.5, leading=12,
            textColor=BAV_INK_500, alignment=TA_LEFT, spaceAfter=0,
        ),
        "footer": ParagraphStyle(
            "footer", parent=ss["Normal"],
            fontName="Helvetica", fontSize=7.5, leading=10,
            textColor=BAV_INK_500, alignment=TA_LEFT,
        ),
        "footer_right": ParagraphStyle(
            "footer_right", parent=ss["Normal"],
            fontName="Helvetica", fontSize=7.5, leading=10,
            textColor=BAV_INK_500, alignment=TA_RIGHT,
        ),
        "section_number": ParagraphStyle(
            "section_number", parent=ss["Normal"],
            fontName="Helvetica-Bold", fontSize=9, leading=12,
            textColor=accent, alignment=TA_LEFT, spaceAfter=4,
        ),
    }


# ---- Flowables ----------------------------------------------------------

def bullet(text: str, styles: dict, mark: str = "\u25A0"):
    return Paragraph(
        f'<font color="#1EB53A">{mark}</font>&nbsp;&nbsp;{text}',
        styles["bullet"],
    )


def rule(color: Color = BAV_INK_300, thickness: float = 0.5, spacer_before: float = 4, spacer_after: float = 10):
    return [
        Spacer(1, spacer_before),
        HRFlowable(width="100%", thickness=thickness, color=color, spaceBefore=0, spaceAfter=0),
        Spacer(1, spacer_after),
    ]


def callout(title: str, body: str, accent: Color, styles: dict, dense: bool = False):
    inner = [
        Paragraph(title, styles["callout_title"]),
        Paragraph(body, styles["callout_body"]),
    ]
    pad = 8 if dense else 12
    tbl = Table([[inner]], colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BAV_INK_50),
        ("LEFTPADDING", (0, 0), (-1, -1), pad + 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad + 6),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("BOX", (0, 0), (-1, -1), 0.25, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def feature_card(title: str, body: str, accent: Color, styles: dict):
    inner = [
        Paragraph(title, styles["h3"]),
        Paragraph(body, styles["callout_body"]),
    ]
    tbl = Table([[inner]], colWidths=[CONTENT_W])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BAV_WHITE),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LINEBEFORE", (0, 0), (0, -1), 2, accent),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def two_col(left, right, gutter: float = 8 * mm):
    col_w = (CONTENT_W - gutter) / 2
    tbl = Table([[left, right]], colWidths=[col_w, col_w])
    tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def kpi_row(pairs: list[tuple[str, str]], accent: Color):
    cells = []
    for value, label in pairs:
        v = Paragraph(f'<font name="Helvetica-Bold" size="22" color="{accent.hexval()}">{value}</font>', ParagraphStyle("k", fontName="Helvetica", fontSize=22, leading=26, textColor=accent))
        l = Paragraph(f'<font name="Helvetica" size="8" color="#6B7280">{label.upper()}</font>', ParagraphStyle("kl", fontName="Helvetica", fontSize=8, leading=10, textColor=BAV_INK_500))
        cells.append([v, l])
    col_w = CONTENT_W / max(1, len(pairs))
    tbl = Table([cells], colWidths=[col_w] * len(pairs))
    style = TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), BAV_INK_50),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
    ])
    for i in range(1, len(pairs)):
        style.add("LINEBEFORE", (i, 0), (i, 0), 0.5, BAV_INK_300)
    tbl.setStyle(style)
    return tbl


# ---- Page templates -----------------------------------------------------

class PdfCtx:
    def __init__(self, accent: Color, doc_title: str, brand_line: str):
        self.accent = accent
        self.doc_title = doc_title
        self.brand_line = brand_line


def draw_cover(canvas, doc):
    canvas.saveState()
    # full-bleed accent bar left edge
    ctx: PdfCtx = doc.ctx
    canvas.setFillColor(ctx.accent)
    canvas.rect(0, 0, 8, PAGE_H, fill=1, stroke=0)
    # bottom-right thin rule
    canvas.setStrokeColor(BAV_INK_300)
    canvas.setLineWidth(0.3)
    canvas.line(MARGIN_X, 20 * mm, PAGE_W - MARGIN_X, 20 * mm)
    # document title at the bottom-left
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(BAV_INK_500)
    canvas.drawString(MARGIN_X, 14 * mm, ctx.brand_line.upper())
    canvas.drawRightString(PAGE_W - MARGIN_X, 14 * mm, "CONFIDENTIAL DRAFT v0.1")
    canvas.restoreState()


def draw_content(canvas, doc):
    canvas.saveState()
    ctx: PdfCtx = doc.ctx
    # header
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(BAV_INK_500)
    canvas.drawString(MARGIN_X, PAGE_H - 12 * mm, ctx.brand_line.upper())
    canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 12 * mm, ctx.doc_title.upper())
    canvas.setStrokeColor(BAV_INK_300)
    canvas.setLineWidth(0.3)
    canvas.line(MARGIN_X, PAGE_H - 15 * mm, PAGE_W - MARGIN_X, PAGE_H - 15 * mm)
    # footer: page number right
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(BAV_INK_500)
    canvas.drawRightString(PAGE_W - MARGIN_X, 12 * mm, f"Page {doc.page}")
    canvas.drawString(MARGIN_X, 12 * mm, ctx.brand_line)
    canvas.line(MARGIN_X, 15 * mm, PAGE_W - MARGIN_X, 15 * mm)
    canvas.restoreState()


# ---- Doc builder --------------------------------------------------------

def build_doc(path: Path, ctx: PdfCtx, story: list):
    doc = BaseDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_Y, bottomMargin=MARGIN_Y,
        title=ctx.doc_title, author="Mickai",
    )
    doc.ctx = ctx  # type: ignore[attr-defined]
    frame_cover = Frame(MARGIN_X, MARGIN_Y, CONTENT_W, CONTENT_H, showBoundary=0, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    frame_content = Frame(MARGIN_X, MARGIN_Y, CONTENT_W, CONTENT_H - 8 * mm, showBoundary=0, leftPadding=0, rightPadding=0, topPadding=10 * mm, bottomPadding=10 * mm)
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[frame_cover], onPage=draw_cover),
        PageTemplate(id="content", frames=[frame_content], onPage=draw_content),
    ])
    doc.build(story)


# =========================================================================
# PDF 1: Birmingham AV - Platform Blueprint
# =========================================================================

def build_bav_pdf() -> None:
    styles = make_styles(BAV_GREEN)
    ctx = PdfCtx(BAV_GREEN, "Birmingham AV Platform Blueprint", "Birmingham AV Ltd")
    story: list = []

    # --- Cover -----------------------------------------------------------
    if LOGO.exists():
        story.append(Image(str(LOGO), width=64 * mm, height=64 * mm, hAlign="LEFT"))
    story.append(Spacer(1, 16 * mm))
    story.append(Paragraph("Platform<br/>Blueprint.", styles["cover_title"]))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "Your new flagship e-commerce home.<br/>"
        "Built to replace eBay, power the factory, and raise the brand.",
        styles["cover_subtitle"],
    ))
    story.append(Spacer(1, 20 * mm))

    # cover KPIs
    story.append(kpi_row([
        ("£40M+", "Annual turnover moved on to your own rails"),
        ("22", "In-house builders, every unit traceable"),
        ("98.4%", "Positive feedback moved across from eBay"),
        ("12 mo", "Parts and labour warranty on every order"),
    ], BAV_GREEN))

    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("PREPARED FOR", styles["cover_meta"]))
    story.append(Paragraph("Hamzah, Owner, Birmingham AV Ltd", styles["lead"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("PREPARED BY", styles["cover_meta"]))
    story.append(Paragraph("Mickai\u2122 Platform Engineering", styles["lead"]))

    story.append(NextPageTemplate("content"))
    story.append(PageBreak())

    # --- 01 Executive summary -------------------------------------------
    story.append(Paragraph("01", styles["section_number"]))
    story.append(Paragraph("Executive summary.", styles["h1"]))
    story.append(Paragraph(
        "You ship some of the best refurbished PCs in the UK. eBay keeps your customer and takes "
        "a large slice of every pound. This platform ends that trade-off: visitors land in your "
        "brand, orders flow into the factory, every builder is named, every component is traceable, "
        "every pound is yours.",
        styles["lead"],
    ))
    story.append(Spacer(1, 6))
    for line in [
        "<b>Bespoke storefront and checkout</b>: Stripe, PayPal, Apple Pay, Google Pay, Klarna.",
        "<b>Factory-aware order flow</b>: builder ping on paid order, QC checklist, printed label with customer\u2019s full address.",
        "<b>QR-powered warehouse</b>: every bin, shelf, CPU, and GPU scannable from the phone in your pocket.",
        "<b>AI on every page</b>: product support, build advice, upgrade wizard, automatic RMA triage.",
        "<b>Owner console</b>: live revenue, flagged returns, builder scoreboards, HMRC-ready VAT.",
        "<b>Mobile-first and installable</b>: customers add the site to their home screen like a native app.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 02 The experience ----------------------------------------------
    story.append(Paragraph("02", styles["section_number"]))
    story.append(Paragraph("The experience.", styles["h1"]))
    story.append(Paragraph(
        "One brief: look and feel like a company that charges what Apple charges.",
        styles["lead"],
    ))
    for line in [
        "<b>Cinematic hero</b>: your 3D logo reveal loops silently in studio white. Headline types itself word by word, <i>know</i> lit in brand green, glass buttons with magnetic pull.",
        "<b>Ambient living background</b>: custom WebGL layer of drifting orbs, hair-thin grid that warps toward the cursor, a whisper of particles. Written from scratch, not an off-the-shelf library.",
        "<b>Glass tiles everywhere</b>: product cards tilt in 3D under the cursor, images parallax inside the frame, numbers count up on scroll.",
        "<b>Mobile first-class</b>: measured on a phone before desktop. Tap targets never below 44px. Logo crisp at every size.",
        "<b>Page transitions</b>: blur-to-sharp fade between routes. Refined, never flashy.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 03 Core features -----------------------------------------------
    story.append(Paragraph("03", styles["section_number"]))
    story.append(Paragraph("Core features at a glance.", styles["h1"]))

    story.append(Paragraph("Storefront", styles["h2"]))
    for line in [
        "Live filters on CPU, GPU, RAM, storage, condition, price, builder.",
        "Product detail with full spec table, benchmark charts, and verified reviews.",
        "Wishlist, price-drop alerts, back-in-stock notifications.",
        "3D build visualiser, price history chart, community builds gallery.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Checkout", styles["h2"]))
    for line in [
        "Stripe, PayPal, Apple Pay, Google Pay, Klarna, NET-30 invoice.",
        "Guest checkout, saved addresses, one-click reorder.",
        "Live shipping quote by postcode, real-time stock reservation, Stripe Radar fraud checks.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Customer account", styles["h2"]))
    for line in [
        "Orders with live status, builder name, expected ship date.",
        "Returns started in under sixty seconds, loyalty points, referral codes.",
        "Downloadable VAT invoices and warranty certificates.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 04 Inventive / headline features --------------------------------
    story.append(Paragraph("04", styles["section_number"]))
    story.append(Paragraph("Category-defining features.", styles["h1"]))
    story.append(Paragraph(
        "This section is the marketing ammunition. Each of these features is designed to be the "
        "hook in a press release, the reason a customer tells a friend, and the thing a "
        "competitor cannot copy in six months. We invented several of them for you.",
        styles["lead"],
    ))
    story.append(Spacer(1, 6))

    features = [
        ("Meet Your Builder", "Every shipped unit includes a 30-second video from the named builder. Alfie introduces himself, walks the customer through what is inside, and signs off. Extraordinary emotional lever. Extraordinary sharing on social."),
        ("PC Birth Certificate", "Every machine ships with a printed and digital certificate: serial number, builder, build date, components, benchmark scores, warranty dates. Lives forever in the customer\u2019s account. Collectors frame them."),
        ("Lifetime Component Registry", "Three years after purchase, a customer logs in and sees exactly what is inside the machine. Useful for warranty claims, upgrades, and resale value. No one else offers this."),
        ("AI Build Buddy", "A customer asks \u201ccan I fit an RTX 4080 in my Aegis Ultra?\u201d The assistant checks their unit\u2019s PSU, clearance, socket compatibility, and returns a yes or no, a parts quote, and an install booking."),
        ("Live Build Stream", "Opt-in builders livestream their bench during build windows. Customers can watch their own PC being built. Twitch meets commerce. No competitor has this."),
        ("Builder Signature Plate", "Every case ships with a laser-etched plate inside: \u201cBuilt by Alfie Ashworth, BLD-004, April 2026\u201d. Free. Photographable. Shareable."),
        ("Trade-Up Program", "Three years after purchase, customers receive an auto-generated offer: return your old BAV machine, get credit against a new build. We refurbish it and sell it again. Circular economy with retention upside."),
        ("Warranty Claim in 60 Seconds", "Open the app, pick the order, describe the fault. AI triages, either auto-approves an RMA label or asks two diagnostic questions. From problem to shipping label in under a minute."),
        ("Capacity Heatmap", "Public page shows the real-time build queue. \u201cFour PCs ahead of yours, three days to your build slot.\u201d Transparent, honest, and scarce."),
        ("Owner Mobile App", "A dedicated mobile app for Hamzah and senior staff: live revenue, flagged returns, high-value support escalations, approve refunds on the go, Telegram-grade notifications."),
        ("White Glove Delivery", "Optional premium delivery: the driver unpacks the PC, plugs it in, demonstrates it working. Pure luxury, priced at premium."),
        ("CO2 Saved Per Order", "Every order shows the carbon saved by buying refurbished rather than new. Customers can share the badge. Offset at checkout optional."),
    ]
    for title, body in features:
        story.append(feature_card(title, body, BAV_GREEN, styles))
        story.append(Spacer(1, 8))
    story.append(PageBreak())

    # --- 05 Operations and warehouse -------------------------------------
    story.append(Paragraph("05", styles["section_number"]))
    story.append(Paragraph("Operations and warehouse.", styles["h1"]))
    story.append(Paragraph(
        "The part that runs the factory. Order paid to package on the doormat, every step "
        "automated or prompted on a phone.",
        styles["lead"],
    ))

    story.append(Paragraph("Order lifecycle", styles["h3"]))
    story.append(Paragraph(
        "Paid order pings the assigned builder on Telegram. Build queue shows an ETA. Builder "
        "starts, scans each component off the shelf, runs the QC checklist with photos, marks "
        "ready. Label prints with the customer\u2019s full details. Tracking captures back to the "
        "order. Customer receives status pings at every step.",
        styles["body"],
    ))

    story.append(Paragraph("Customer notifications", styles["h3"]))
    for line in [
        "<b>Paid</b>: email receipt with build window estimate.",
        "<b>Building</b>: push with builder name and photo.",
        "<b>QC passed</b>: email with benchmark scores and warranty certificate.",
        "<b>Shipped</b>: text message with tracking link.",
        "<b>Delivered</b>: review invite, setup-service upsell.",
        "<b>30-day check-in</b>: personal note from the builder.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Shipping + warehouse", styles["h3"]))
    for line in [
        "Royal Mail, DPD, Evri, ParcelForce wired. Labels, pickups, manifest, EU customs, all handled.",
        "<b>QR warehouse</b>: every bin, shelf, and component type has a printable QR tag.",
        "<b>Stock take in one walk</b>: scan the aisle, the app reconciles against expected and reports gaps.",
        "<b>Receiving + picking</b>: scan goods-in on arrival, scan components out when building. Every serial bound to the unit it went into, for life.",
        "Low-stock alerts, dead-stock report, supplier RMA tracking, all in one place.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 06 AI throughout ------------------------------------------------
    story.append(Paragraph("06", styles["section_number"]))
    story.append(Paragraph("AI across the site.", styles["h1"]))
    story.append(Paragraph(
        "Not a chatbot bolted on. Trained on PC hardware, your catalogue, and your policies.",
        styles["lead"],
    ))
    for t, b in [
        ("Customer support chat", "Full product knowledge across CPUs, GPUs, RAM, PSUs, motherboards, storage, monitors, projectors, AV switches. Sockets, compatibility, thermals, real-world performance. Only escalates when it should."),
        ("PC Build Wizard", "Customer describes budget and use case. Wizard recommends three builds, checks compatibility, fills a live cart."),
        ("Upgrade Advisor", "Customer asks \u201ccan I fit a 4080 in my Aegis Ultra?\u201d. Advisor checks their unit\u2019s PSU, clearance, socket. Returns yes or no, quote, and install booking."),
        ("RMA Analyst", "Every return auto-triaged. Severity, suspected root cause, recommendation, and a flag if a builder shows a pattern. Saves hours of staff time."),
        ("Owner assistant", "Private assistant for Hamzah. \u201cHow much did we sell last week?\u201d \u201cWhich builder has the highest RMA?\u201d Plain-English answers."),
    ]:
        story.append(feature_card(t, b, BAV_GREEN, styles))
        story.append(Spacer(1, 5))
    story.append(PageBreak())

    # --- 07 Owner's console ---------------------------------------------
    story.append(Paragraph("07", styles["section_number"]))
    story.append(Paragraph("The owner\u2019s console.", styles["h1"]))
    story.append(Paragraph(
        "One place for everything you need to run the business: live numbers, people, money, compliance.",
        styles["lead"],
    ))

    story.append(Paragraph("Admin", styles["h3"]))
    for line in [
        "<b>Dashboard</b>: revenue today, this week, this month. Orders, flagged returns, open tickets, active builds.",
        "<b>Builders</b>: roster with tier, margin, ROI, RMA rate, quality score, sparkline trend. Click for full history and AI flags.",
        "<b>Orders, returns, support, catalogue</b>: all manageable in one admin, with staff roles and audit trail.",
        "<b>Super-admin profile</b>: change name, picture, password, MFA.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Analytics", styles["h3"]))
    for line in [
        "Revenue, AOV, conversion, CAC and LTV per channel.",
        "Funnel analysis, cohort retention, builder performance trends.",
        "Competitor price tracking with undercut alerts. What-if price modelling.",
        "Daily digest email: yesterday\u2019s numbers and top three issues, five-minute read.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Money and compliance", styles["h3"]))
    for line in [
        "<b>HMRC Making Tax Digital</b>: quarterly VAT return submitted from the app.",
        "VAT invoices, P&amp;L, balance sheet, reconciliation against Stripe and PayPal.",
        "Builder payroll (CIS-compliant), Xero and QuickBooks sync for your accountant.",
        "GDPR, cookie consent, 2FA, audit log, Stripe Radar, Cloudflare WAF, daily off-site backups.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 08 Roadmap ------------------------------------------------------
    story.append(Paragraph("08", styles["section_number"]))
    story.append(Paragraph("Delivery roadmap.", styles["h1"]))

    phases = [
        ("A", "Visual and core UX", "Ambient background, logo polish, admin settings, builder portraits and bios."),
        ("B", "Operations", "Stock reservation, factory notifications, QC workflow, shipping labels, courier integration."),
        ("C", "AI intelligence", "Product knowledge base, PC Build Wizard, Upgrade Advisor."),
        ("D", "Money", "Apple Pay, Google Pay, Klarna, VAT returns, loyalty, referrals, gift cards."),
        ("E", "Headline features", "Birth Certificate, Meet Your Builder videos, Trade-Up, Signature Plate, Capacity Heatmap."),
        ("F", "White-label foundation", "Tenant isolation, per-tenant branding, onboarding, platform admin."),
    ]
    data = [[Paragraph(f"<b>Phase {p[0]}</b>", styles["callout_title"]),
             Paragraph(f"<b>{p[1]}</b><br/><font size=9 color=\"#6B7280\">{p[2]}</font>", styles["callout_body"])] for p in phases]
    tbl = Table(data, colWidths=[26 * mm, CONTENT_W - 26 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BAV_INK_50),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(tbl)
    story.append(PageBreak())

    # --- 09 What this costs on the open market ---------------------------
    story.append(Paragraph("09", styles["section_number"]))
    story.append(Paragraph("What this kind of build costs.", styles["h1"]))
    story.append(Paragraph(
        "This page is not an invoice. It is a market-rate reference so you can see the scale "
        "of work behind the platform.",
        styles["lead"],
    ))

    comparison_rows = [
        ["", "Traditional London agency", "Mickai\u2122"],
        ["One-time investment", "£500,000 to £800,000", "Arranged privately"],
        ["Delivery window", "8 to 14 months", "Approximately 2 weeks"],
        ["Ongoing retainer", "£5,000 to £15,000 per month", "Included"],
        ["Team behind the work", "6 to 10 engineers plus design", "One founder, powered by Mickai\u2122"],
    ]
    comparison_table = Table(comparison_rows, colWidths=[CONTENT_W * 0.26, CONTENT_W * 0.40, CONTENT_W * 0.34])
    comparison_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BAV_INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), BAV_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("LINEBEFORE", (2, 0), (2, -1), 0.5, BAV_GREEN),
        ("BACKGROUND", (2, 1), (2, -1), HexColor("#E5F7EA")),
        ("TEXTCOLOR", (2, 1), (2, -1), BAV_INK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(comparison_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Why two weeks is realistic", styles["h3"]))
    story.append(Paragraph(
        "The platform is built using <b>Mickai\u2122</b>, Mickarle Wagstaff-Irons\u2019 sovereign "
        "intelligence operating system. It is a proprietary multi-brain architecture that "
        "compresses months of senior engineering work into days. The same scope, the same "
        "standard of work, delivered in two weeks rather than in a year.",
        styles["body"],
    ))

    story.append(Spacer(1, 8))
    story.append(callout(
        "This is not an invoice.",
        "Figures shown are market-rate references for what equivalent work costs elsewhere. No "
        "amount above is being charged to Birmingham AV. Commercial terms and conditions for the "
        "engagement are to be discussed separately.",
        BAV_GREEN, styles,
    ))
    story.append(PageBreak())

    # --- 10 Why this wins / closing --------------------------------------
    story.append(Paragraph("10", styles["section_number"]))
    story.append(Paragraph("Why this wins.", styles["h1"]))
    story.append(Paragraph(
        "Everything above is either delivered or delivering. The platform is built to be the "
        "single best place in the UK to buy a refurbished PC, and the first place other sellers "
        "copy when they see it in the wild.",
        styles["lead"],
    ))

    for line in [
        "<b>Owned channel</b>. Every pound stays in the business.",
        "<b>Named builders, traceable machines, lifetime component registry</b>. Trust signals no eBay seller can match.",
        "<b>AI-first support</b>. Higher quality answers, faster, cheaper than human-only.",
        "<b>Made for mobile first</b>. Where your customers actually live.",
        "<b>Inventive features</b> designed to be the things a customer tells their friends.",
        "<b>Operations-grade</b>. VAT, shipping, accounting, and payroll all handled in-house.",
    ]:
        story.append(bullet(line, styles))

    story.append(Spacer(1, 20))
    story.append(callout(
        "The one-line pitch for press",
        "Birmingham AV: refurbished PCs, built by people who know them. Hand-made in Birmingham, "
        "signed by the builder, and covered for a year. A machine with a birth certificate.",
        BAV_GREEN, styles,
    ))

    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="30%", thickness=0.8, color=BAV_INK_300, hAlign="LEFT"))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Powered by Mickai\u2122. Bespoke e-commerce engineering for single-seller brands.",
        styles["footer"],
    ))

    build_doc(OUT_BAV, ctx, story)
    print(f"Wrote {OUT_BAV.name} ({OUT_BAV.stat().st_size // 1024} KB)")


# =========================================================================
# PDF 2: Mickai - White-Label E-Commerce Playbook
# =========================================================================

def build_mickai_pdf() -> None:
    styles = make_styles(MKI_STEEL)
    ctx = PdfCtx(MKI_STEEL, "Mickai White-Label Playbook", "Mickai\u2122 Platform Engineering")
    story: list = []

    # --- Cover -----------------------------------------------------------
    story.append(Paragraph("MICKAI\u2122", ParagraphStyle(
        "kicker", fontName="Helvetica-Bold", fontSize=10, leading=12,
        textColor=MKI_STEEL, alignment=TA_LEFT, spaceAfter=12,
    )))
    story.append(Paragraph("White-Label<br/>Playbook.", styles["cover_title"]))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "How to productise the Birmingham AV stack<br/>"
        "into a sellable e-commerce SaaS business.",
        styles["cover_subtitle"],
    ))
    story.append(Spacer(1, 20 * mm))

    story.append(kpi_row([
        ("£125K+", "Average fees a £1M eBay seller pays each year"),
        ("85%", "Gross margin target at scale"),
        ("50", "Paying tenants for break-even"),
        ("£1.4M", "Year-3 ARR target"),
    ], MKI_STEEL))

    story.append(Spacer(1, 24 * mm))
    story.append(Paragraph("FOR", styles["cover_meta"]))
    story.append(Paragraph("Hamza \u201cMickai\u201d, Founder", styles["lead"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("VERSION", styles["cover_meta"]))
    story.append(Paragraph("Draft 0.1, April 2026", styles["lead"]))

    story.append(NextPageTemplate("content"))
    story.append(PageBreak())

    # --- 01 Thesis -------------------------------------------------------
    story.append(Paragraph("01", styles["section_number"]))
    story.append(Paragraph("The thesis.", styles["h1"]))
    story.append(Paragraph(
        "Hamzah is your first customer. He is also your proof point. The platform you are "
        "building for him solves a problem that thousands of UK and EU single-sellers have: "
        "they live on eBay, Amazon, or Etsy, they hate the fees, they do not own their "
        "customer, and they cannot afford the engineering team a Shopify-plus build requires.",
        styles["lead"],
    ))
    story.append(Paragraph(
        "Your unfair advantage: you are building a flagship, not a template. Once BAV is live, "
        "every feature is already paid for. You turn the handle a little, add tenant isolation, "
        "and you have a SaaS product that is ahead of Shopify in several ways: AI-native, UK "
        "compliance-first, operations-aware, inventive.",
        styles["body"],
    ))

    story.append(Paragraph("02", styles["section_number"]))
    story.append(Paragraph("The market.", styles["h1"]))
    story.append(Paragraph("Fees that sellers pay today", styles["h3"]))
    data = [
        ["Channel", "Take rate", "Notes"],
        ["eBay UK, electronics", "12.55% + payment fees", "Plus promotion fees, plus ad fees."],
        ["Amazon UK", "15% + FBA", "FBA adds 10-30% on heavy items."],
        ["Etsy", "6.5% + 4-5% payment", "Plus listing fees, plus ad fees."],
        ["Shopify + Stripe", "£29-£299 monthly + 2.9% + 30p", "You own the customer, but fees creep."],
        ["Mickai (recommended)", "£99-£999 monthly + 0-0.5%", "Flat or tiny share. You own everything."],
    ]
    tbl = Table(data, colWidths=[50 * mm, 50 * mm, CONTENT_W - 100 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MKI_OBSIDIAN),
        ("TEXTCOLOR", (0, 0), (-1, 0), BAV_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, -1), (-1, -1), HexColor("#E7F1FF")),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "A seller turning over £1M a year on eBay loses roughly £125K to fees. Even before "
        "promotion and ad fees. You can undercut this by 10x and still hit 85 percent gross "
        "margin.",
        styles["body"],
    ))
    story.append(PageBreak())

    # --- 03 Architecture -------------------------------------------------
    story.append(Paragraph("03", styles["section_number"]))
    story.append(Paragraph("Architecture.", styles["h1"]))
    story.append(Paragraph("Core stack", styles["h3"]))
    for line in [
        "Next.js 14 App Router, TypeScript strict.",
        "Turborepo monorepo with apps/web, apps/mobile, packages/ui, packages/lib, packages/db, packages/ai.",
        "Postgres via Prisma for transactional data.",
        "MongoDB via Mongoose for rich product specs, build event logs, AI analyses, chat transcripts.",
        "Redis via BullMQ for queues (build dispatch, email, ingestion jobs).",
        "Anthropic Claude for all AI (Opus 4.7 for support, Sonnet 4.6 for RMA analysis).",
        "Stripe Connect for per-tenant payments with platform fee split.",
        "Vercel hosting, Neon + Atlas + Upstash for data, Cloudflare in front.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Tenant isolation", styles["h3"]))
    story.append(Paragraph(
        "Every database row carries a tenantId. Middleware resolves tenant from subdomain "
        "(tenant.mickai.app) or custom domain (shop.theirdomain.com). Per-tenant config holds "
        "brand colours, logo, copy, feature flags, and Stripe Connect account id. Row-level "
        "security on Postgres as a belt-and-braces second line.",
        styles["body"],
    ))

    story.append(Paragraph("Why this beats Shopify App Store retrofit", styles["h3"]))
    for line in [
        "AI is first-class rather than a paid plugin.",
        "Warehouse and factory workflows are built in, not a third-party app.",
        "UK VAT MTD is native, not an accountant\u2019s plugin.",
        "Inventive features (Birth Certificate, Meet Your Builder) are platform-level.",
        "No per-sale transaction fee. Flat SaaS.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 04 Business model -----------------------------------------------
    story.append(Paragraph("04", styles["section_number"]))
    story.append(Paragraph("Business model.", styles["h1"]))
    story.append(Paragraph("Three pricing tiers, recommended", styles["h3"]))

    pricing = [
        ["Tier", "Price", "Orders / mo", "Storefronts", "Key inclusions"],
        ["Starter", "£99", "500", "1", "Hosted domain, basic AI, Stripe, Mickai branding in footer"],
        ["Pro", "£299", "5K", "3", "Custom domain, full AI, removed branding, Klarna, referral engine"],
        ["Scale", "£999", "50K", "Unlimited", "White-label resale rights, priority support, dedicated account manager"],
    ]
    tbl = Table(pricing, colWidths=[30 * mm, 25 * mm, 28 * mm, 28 * mm, CONTENT_W - 111 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MKI_OBSIDIAN),
        ("TEXTCOLOR", (0, 0), (-1, 0), BAV_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 2), (-1, 2), HexColor("#E7F1FF")),
    ]))
    story.append(tbl)

    story.append(Paragraph("Three revenue models to choose between", styles["h3"]))
    story.append(Paragraph(
        "<b>Option A: Flat SaaS only</b>. £99 to £999 per month. Predictable, simple, high margin.",
        styles["body"],
    ))
    story.append(Paragraph(
        "<b>Option B: Percentage of GMV</b>. 1.5 percent of sales, capped at £2000 per month. "
        "Scales with tenants. Harder to forecast, but huge upside if a tenant takes off.",
        styles["body"],
    ))
    story.append(Paragraph(
        "<b>Option C: Hybrid, recommended</b>. £99 per month baseline, plus 0.5 percent of GMV "
        "above £20K per month. Low barrier to enter. Upside when tenants grow.",
        styles["body"],
    ))
    story.append(PageBreak())

    # --- 05 Unit economics -----------------------------------------------
    story.append(Paragraph("05", styles["section_number"]))
    story.append(Paragraph("Unit economics.", styles["h1"]))
    ue = [
        ["Line", "Starter", "Pro", "Scale"],
        ["Tenant MRR", "£99", "£299", "£999"],
        ["Vercel hosting", "£8", "£20", "£40"],
        ["Neon Postgres", "£0", "£15", "£45"],
        ["MongoDB Atlas", "£0", "£10", "£35"],
        ["Upstash Redis", "£0", "£5", "£15"],
        ["AI (Claude)", "£3", "£12", "£45"],
        ["Stripe passthrough", "0", "0", "0"],
        ["Support allocation", "£10", "£25", "£60"],
        ["Total cost", "£21", "£87", "£240"],
        ["Gross margin", "79%", "71%", "76%"],
    ]
    tbl = Table(ue, colWidths=[CONTENT_W * 0.40, CONTENT_W * 0.20, CONTENT_W * 0.20, CONTENT_W * 0.20])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MKI_OBSIDIAN),
        ("TEXTCOLOR", (0, 0), (-1, 0), BAV_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -2), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("LINEABOVE", (0, -2), (-1, -2), 0.5, BAV_INK),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, -2), (-1, -1), BAV_INK_50),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Break-even is around 50 paying tenants at blended £300 MRR. That is 15-18 months of "
        "focused outbound plus the right referral engine.",
        styles["body"],
    ))
    story.append(PageBreak())

    # --- 06 Revenue projections ------------------------------------------
    story.append(Paragraph("06", styles["section_number"]))
    story.append(Paragraph("Revenue projections.", styles["h1"]))
    proj = [
        ["Year", "Tenants", "Blended MRR", "ARR", "Gross margin"],
        ["Year 1", "20", "£249", "£60K", "76%"],
        ["Year 2", "100", "£299", "£359K", "78%"],
        ["Year 3", "400 plus 5 enterprise", "£350", "£1.4M", "80%"],
        ["Year 5", "2000 plus 40 enterprise", "£420", "£10M", "82%"],
    ]
    tbl = Table(proj, colWidths=[CONTENT_W * 0.15, CONTENT_W * 0.22, CONTENT_W * 0.18, CONTENT_W * 0.25, CONTENT_W * 0.20])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), MKI_OBSIDIAN),
        ("TEXTCOLOR", (0, 0), (-1, 0), BAV_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Numbers are conservative. They assume low double-digit churn, organic referrals kicking "
        "in from year 2, and one major enterprise deal per year from year 3. No paid ad reliance "
        "baked in.",
        styles["body"],
    ))
    story.append(PageBreak())

    # --- 07 Go to market -------------------------------------------------
    story.append(Paragraph("07", styles["section_number"]))
    story.append(Paragraph("Go to market.", styles["h1"]))

    story.append(Paragraph("Phase 1. UK tech resellers (months 0 to 6)", styles["h3"]))
    for line in [
        "Target: single-sellers on eBay UK doing £500K to £5M annually in electronics.",
        "Channels: LinkedIn direct outreach, eBay seller forums, Reddit r/Flipping, tech Discord communities.",
        "Pitch: \u201cBirmingham AV just moved from eBay to Mickai and saved £X in three months.\u201d (Hamzah case study.)",
        "Launch offer: three months free on Pro tier, price-locked at Starter for year one.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Phase 2. Adjacent verticals (months 6 to 12)", styles["h3"]))
    for line in [
        "UK refurb, vintage, luxury resale, musical instruments, collectibles.",
        "Partner with trade associations (British Association of Removers, BIRA, UKFAST).",
        "Launch the referral program: three months free for both sides of every successful referral.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Phase 3. EU and US (year 2)", styles["h3"]))
    for line in [
        "Localise: multi-currency, multi-language, Adyen in markets where Stripe is weak.",
        "Partner with local payment providers (Mercadopago, Mollie, Adyen).",
        "Content marketing: \u201cShopify alternative for refurb sellers\u201d, \u201cHow to leave eBay\u201d.",
    ]:
        story.append(bullet(line, styles))

    story.append(Paragraph("Acquisition spend model", styles["h3"]))
    story.append(Paragraph(
        "Target CAC under £300. LTV at Pro tier with 24-month retention is £7,176. A 24:1 LTV:CAC "
        "ratio is healthy. Keep CAC down with referrals, case studies, and founder-led sales "
        "(you) in year 1.",
        styles["body"],
    ))
    story.append(PageBreak())

    # --- 08 Competition --------------------------------------------------
    story.append(Paragraph("08", styles["section_number"]))
    story.append(Paragraph("Competitive landscape.", styles["h1"]))

    for comp in [
        ("Shopify", "Dominant, expensive, generic. Retrofitted AI via app store. No factory or warehouse workflow. Weak UK VAT story. Won\u2019t innovate on operations."),
        ("BigCommerce", "Cheaper, older, US-skewed. Thin plugin ecosystem outside US. Poor mobile experience out of the box."),
        ("WooCommerce + WordPress", "Free but DIY maintenance nightmare. Slow, insecure by default, developer time heavy."),
        ("Cart.com", "US B2B-leaning. Not UK-friendly."),
        ("Shopline, Ecwid, WiX", "Low-end. Not credible for £500K+ sellers."),
    ]:
        story.append(feature_card(comp[0], comp[1], MKI_STEEL, styles))
        story.append(Spacer(1, 6))

    story.append(Paragraph("Where Mickai wins", styles["h3"]))
    for line in [
        "Single-seller focus, not marketplace-generic.",
        "AI-native (Claude wired through every customer-facing surface).",
        "UK compliance out of the box: VAT MTD, ICO cookies, GDPR self-serve.",
        "Operations-grade: factory dispatch, QR warehouse, builder payroll, built in.",
        "Inventive features that make tenants famous: Birth Certificate, Meet Your Builder, Live Build Stream.",
        "Resellable: Scale tier includes white-label resale rights to the tenant.",
    ]:
        story.append(bullet(line, styles))
    story.append(PageBreak())

    # --- 09 Onboarding ---------------------------------------------------
    story.append(Paragraph("09", styles["section_number"]))
    story.append(Paragraph("Tenant onboarding in 15 minutes.", styles["h1"]))
    steps = [
        ("01", "Signup", "Email, pick tier, agree to ToS."),
        ("02", "Brand", "Upload logo, pick two brand colours, optional hero video."),
        ("03", "Business", "VAT number, company registration, bank details."),
        ("04", "Payments", "One-click Stripe Connect onboarding, optional PayPal."),
        ("05", "Catalogue", "Import from eBay using stored creds, or upload CSV, or start empty."),
        ("06", "Shipping", "Choose couriers, set zones and rates."),
        ("07", "Live", "Custom domain verified, SSL provisioned, launch."),
    ]
    data = [[Paragraph(s[0], styles["section_number"]), Paragraph(f"<b>{s[1]}</b>", styles["callout_title"]),
             Paragraph(s[2], styles["callout_body"])] for s in steps]
    tbl = Table(data, colWidths=[15 * mm, 40 * mm, CONTENT_W - 55 * mm])
    tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, BAV_INK_300),
        ("BOX", (0, 0), (-1, -1), 0.5, BAV_INK_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(tbl)
    story.append(PageBreak())

    # --- 10 Risk ---------------------------------------------------------
    story.append(Paragraph("10", styles["section_number"]))
    story.append(Paragraph("Risks and mitigations.", styles["h1"]))

    risks = [
        ("Shopify responds with AI", "Already starting, but their legacy stack slows them. Your niche focus and UK compliance moat hold for 18 to 24 months."),
        ("Tenant churn", "Onboarding quality, stickiness via customer data lock-in, and an excellent support experience in the first 90 days."),
        ("Bad-actor tenant", "ToS + moderation + Stripe Connect keeps regulatory risk at their door, not yours. Automated monitoring for prohibited categories."),
        ("AI costs spike", "Claude rate limits per tenant tier. Monitor monthly. Switch to Haiku 4.5 for routine tool calls, reserve Opus 4.7 for complex chats."),
        ("Key person risk", "You. Document everything, hire a CTO early in year 2, keep the bus factor high."),
        ("Platform dependency (Vercel, Neon)", "Abstract behind infrastructure-as-code. Running Postgres on RDS and deploying to AWS EKS is a weekend\u2019s work if needed."),
    ]
    for title, body in risks:
        story.append(feature_card(title, body, MKI_STEEL, styles))
        story.append(Spacer(1, 6))
    story.append(PageBreak())

    # --- 11 30/60/90 -----------------------------------------------------
    story.append(Paragraph("11", styles["section_number"]))
    story.append(Paragraph("Next 90 days.", styles["h1"]))
    plan = [
        ("Days 1 to 30", "Ship Hamzah\u2019s BAV site to production. Public launch. Press. Move his eBay customers over. All core flows green.", "Goal: Hamzah live, £500K of GMV in the first 30 days on the new stack."),
        ("Days 31 to 60", "Refactor to tenant-ready under the hood. Onboard 3 friends-and-family pilot tenants. Fix every sharp edge.", "Goal: 3 paying pilots, working signup and billing."),
        ("Days 61 to 90", "Public launch the SaaS. Content marketing live. Referral engine on. Hamzah case study published.", "Goal: 10 paying tenants, £3K MRR, waitlist open."),
    ]
    for label, what, goal in plan:
        story.append(feature_card(label, f"<b>What</b><br/>{what}<br/><br/><b>Success metric</b><br/>{goal}", MKI_STEEL, styles))
        story.append(Spacer(1, 8))
    story.append(PageBreak())

    # --- 12 Closing ------------------------------------------------------
    story.append(Paragraph("12", styles["section_number"]))
    story.append(Paragraph("Your move.", styles["h1"]))
    story.append(Paragraph(
        "Hamzah\u2019s site is your wedge. Ship it to the world looking like it cost millions. "
        "Every sharp-eyed seller who visits it wants the same. You hand them the phone number.",
        styles["lead"],
    ))
    story.append(Spacer(1, 16))
    story.append(callout(
        "Strategic thought for the week",
        "Build one flagship the market cannot ignore. License it to twenty more. Let those twenty "
        "be your sales team. You did not build a platform; you built a category.",
        MKI_STEEL, styles,
    ))

    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="30%", thickness=0.8, color=BAV_INK_300, hAlign="LEFT"))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Mickai\u2122, April 2026. Prepared for internal strategic use only.", styles["footer"]))

    build_doc(OUT_MKI, ctx, story)
    print(f"Wrote {OUT_MKI.name} ({OUT_MKI.stat().st_size // 1024} KB)")


# =========================================================================
# Entry
# =========================================================================

if __name__ == "__main__":
    if not LOGO.exists():
        print(f"warning: logo not found at {LOGO}")
    build_bav_pdf()
    build_mickai_pdf()
    print("Done.")
