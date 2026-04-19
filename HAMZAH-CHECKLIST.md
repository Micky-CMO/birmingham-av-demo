# Hamzah checklist — external process gates

This is the list of things the *human side* needs to do for Birmingham AV to launch properly. Each item has a clock that doesn't care about how fast the code ships. Start as many as possible **in parallel, now**, because DNS propagation and KYC approvals take days. Nothing in this list needs technical skill — it's paperwork, DNS records, and form filling.

## 1. Stripe KYC (2-5 business days)

**Why:** Required to take real card payments. Without it, the site is stuck in test mode and can only accept Stripe test cards.

**Steps:**
1. Go to https://dashboard.stripe.com/register
2. Sign up with business email, company details: *Birmingham AV Ltd · Reg. 12383651*
3. In the dashboard, go to **Settings → Business details**.
4. Fill in: legal business name, registered address, VAT number, company registration number, business description (write: "Online retailer of new and refurbished computers, laptops, and peripherals, with in-house build and warranty services").
5. Go to **Settings → Identity verification**. Upload: director's passport or driving licence (Hamzah), proof of address (utility bill < 3 months), company incorporation document.
6. Go to **Settings → Bank accounts**. Add the Birmingham AV Ltd business bank account (sort code + account number).
7. Go to **Developers → API keys**. Copy the **publishable key** (`pk_live_...`) and the **secret key** (`sk_live_...`). **Paste both into the Vercel environment variables** for the `@bav/web` project:
   - `STRIPE_PUBLISHABLE_KEY` = pk_live_...
   - `STRIPE_SECRET_KEY` = sk_live_...
8. Go to **Developers → Webhooks** → **Add endpoint**. URL: `https://birmingham-av.vercel.app/api/webhooks/stripe`. Events to send: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`. Copy the **signing secret** (`whsec_...`) and paste into Vercel env as `STRIPE_WEBHOOK_SECRET`.
9. Once identity verification is approved (Stripe emails you), the account flips from test to live. The site starts taking real card payments automatically on the next deploy.

**Done when:** you receive the "Your Stripe account is active" email and the env vars are in Vercel.

---

## 2. Resend sender domain (DNS propagation 1-48h)

**Why:** Every email sent from the site (order confirmation, password reset, AV Care claim updates, etc.) needs a verified sender domain or it goes to spam. Without this, the site cannot reliably send real emails — only `@resend.dev` from Resend's shared domain, which flags as spam.

**Steps:**
1. Go to https://resend.com/domains
2. Click **Add Domain**. Enter: `birmingham-av.com` (or whatever the live domain will be).
3. Resend will show **3 DNS records to add**:
   - **SPF** (TXT) — tells receivers which servers can send for your domain
   - **DKIM** (TXT, 2 records) — cryptographic signing
   - **DMARC** (TXT) — policy for failed SPF/DKIM
4. Log into the domain registrar (GoDaddy / Namecheap / Cloudflare / wherever birmingham-av.com is registered).
5. Add the three TXT records exactly as Resend shows. Host names usually look like `@` or `_dmarc` or `resend._domainkey`.
6. Wait 30 minutes. Go back to Resend domain page and click **Verify**. If it says "propagating", wait another hour. DNS propagation can take up to 48h but is usually under 4h.
7. Once verified, in Resend go to **API Keys** → **Create**. Name it "Birmingham AV production". Copy the key (starts with `re_`).
8. Paste into Vercel env as `RESEND_API_KEY`.
9. Also set `RESEND_FROM_EMAIL` to `orders@birmingham-av.com` (or whatever sender address you want).

**Done when:** Resend domain page shows "Verified ✓" for birmingham-av.com and the API key is in Vercel.

---

## 3. Courier integration — Royal Mail Click & Drop (1-2 weeks)

**Why:** So dispatch label printing is automated from the admin dashboard. Without this, staff have to manually copy addresses into the Royal Mail website every time.

**Steps:**
1. Go to https://www.royalmail.com/business/shipping/tariff-quote
2. Apply for a **Royal Mail business account**. You'll need: Birmingham AV Ltd Companies House reg, VAT number, estimated monthly parcel volume, typical weight/size.
3. Once approved (~1 week), Royal Mail will issue an **account number** and credentials for their **Click & Drop API**.
4. Go to https://developer.royalmail.com/. Register as a developer. Request API access for your account number.
5. Once approved, they'll issue an API key.
6. Paste into Vercel env as:
   - `ROYAL_MAIL_ACCOUNT_NUMBER`
   - `ROYAL_MAIL_API_KEY`
7. **Alternative / supplement:** if you also use DPD, sign up at https://www.dpd.co.uk/apply/ and get DPD API credentials. Paste as `DPD_USERNAME`, `DPD_PASSWORD`, `DPD_ACCOUNT_NUMBER`.

**Done when:** Vercel env has Royal Mail (and optionally DPD) credentials.

**Until done:** the admin "Dispatch" button will fall back to a manual-entry modal where staff paste the tracking number from the Royal Mail website manually. Not beautiful but works.

---

## 4. HMRC Making Tax Digital (2-4 weeks)

**Why:** UK VAT-registered businesses must file VAT returns digitally via MTD-compliant software. Without this, quarterly VAT returns have to be done manually via an accountant or separate software.

**Steps:**
1. Check VAT registration status — go to https://www.gov.uk/log-in-register-hmrc-online-services. Confirm Birmingham AV Ltd is VAT-registered and note the VAT number.
2. Go to https://developer.service.hmrc.uk/. Register as a developer (this is a separate login from the main HMRC portal).
3. Create an application called "Birmingham AV". Subscribe to the **VAT (MTD)** API — you'll need **sandbox** first for testing.
4. HMRC will ask for: agent reference number (if using an accountant), production access justification. Production access is a separate application and takes 2-4 weeks of review.
5. While waiting for production, I can wire the sandbox integration. Paste these into Vercel env as they arrive:
   - `HMRC_CLIENT_ID`
   - `HMRC_CLIENT_SECRET`
   - `HMRC_SERVER_TOKEN`
6. When production approval lands, replace sandbox creds with production.

**Done when:** Vercel env has production HMRC creds and the admin "Submit VAT return" button works.

**Until done:** VAT is calculated per order (20% standard) and invoices include VAT. The quarterly submission to HMRC is done manually by the accountant, same as today.

---

## 5. Legal copy (lawyer-gated, ~1 week)

**Why:** The legal pages (`/terms`, `/privacy`, `/cookies`, `/modern-slavery`, `/warranty`, `/shipping`, `/returns-policy`, `/accessibility`) need real legal text. I've shipped placeholders marked `// LEGAL COPY PENDING`.

**Steps:**
1. Brief Hamzah's solicitor with: company details, what the site sells, customer jurisdictions (UK + EU + rest of world), refund/returns policy we want to offer (30 days, 12-month warranty, parts & labour), AV Care subscription terms (monthly, £100 excess), data retention for registered accounts.
2. Ask specifically for:
   - **Terms & Conditions** (general)
   - **Privacy Policy** (GDPR-compliant)
   - **Cookie Policy**
   - **Modern Slavery Statement** (UK-mandatory if >£36M turnover, still good practice below)
   - **Warranty Terms** (what's covered, what's not, how to claim, AV Care add-on)
   - **Shipping Terms** (cutoff times, delivery estimates, international surcharges)
   - **Returns Policy** (30 days, condition expectations, refund timeline)
   - **Accessibility Statement** (WCAG 2.1 AA commitment)
3. When content arrives, paste each into the corresponding page in `apps/web/app/(storefront)/{terms,privacy,cookies,...}/page.tsx` — the legal template is already set up, just needs the clause array populated.
4. Ask the solicitor to review again in 6 months (data laws change).

**Done when:** every legal page has real content and the solicitor has signed off.

---

## 6. Real product photography (physical shoot, ~1 week + post-production)

**Why:** The №buildNumber placeholder device looks great editorially but customers buying £4,500 gaming PCs want to see the actual unit they're getting. For flagship products (Aegis Ultra, Monolith Pro) this is especially important.

**Steps:**
1. Pick 10-15 flagship product lines to photograph first. Priority: the 3 most expensive gaming builds, the 3 most-ordered refurb laptops, the 3 most expensive workstations.
2. Commission a product photographer. Brief: paper (#F7F5F2) backdrop, soft natural light, 3 angles per product (3/4 front, side profile, interior if PC with glass), 4K resolution, JPG + lossless. Reference aesthetic: Apple product page, Teenage Engineering product shots.
3. Budget: £500-1,500 for the first shoot depending on photographer + post-production.
4. Once photos arrive: upload to Cloudinary or equivalent CDN. Update each product in the admin at `/admin/products` — add the image URLs to `Product.imageUrls`.
5. For all other products (the ~200 from eBay): I've run the eBay ingest which pulls Hamzah's existing eBay listing photos automatically. Those populate `Product.imageUrls` and are shown immediately. They're not as polished as studio shots but they're real.

**Done when:** flagship products have proper studio photography and the rest have at least the eBay-scraped images.

---

## 7. Domain + hosting (if not already set up)

**Why:** The site needs a production domain pointing to Vercel.

**Steps:**
1. If `birmingham-av.com` is already owned: log into the registrar, add a CNAME record pointing `www` and a root A record pointing `@` to Vercel (Vercel gives exact records in the Domains tab of the project settings).
2. If the domain isn't owned yet: buy it from Cloudflare Registrar (cheapest, no markup) or Namecheap.
3. In Vercel → project → **Settings → Domains** → **Add** → enter the domain → follow Vercel's DNS instructions.
4. Once the records propagate (usually minutes), Vercel auto-issues an SSL certificate.

**Done when:** https://birmingham-av.com loads the site and shows a valid HTTPS padlock.

---

## 8. Analytics account (Plausible or Vercel Analytics — free tier OK)

**Why:** Know which products convert, where traffic comes from, mobile-vs-desktop share.

**Steps:**
1. Go to https://plausible.io/register (or use Vercel Analytics if you prefer — it's built in to the Vercel project).
2. Add the site `birmingham-av.com`.
3. Copy the tracking script snippet.
4. Paste into Vercel env as `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = `birmingham-av.com`. I'll wire it into the layout.

**Done when:** the Plausible (or Vercel Analytics) dashboard shows first visitors.

---

## Priority order if short on time

Do these **first** because they have the longest external clocks:
1. **Stripe KYC** (blocks real payments)
2. **Resend DNS** (blocks real emails — can do in parallel)
3. **Royal Mail business account application** (blocks auto-dispatch — application clock)
4. **Legal briefing** (blocks proper legal pages — solicitor clock)

These can wait a few days:
5. HMRC MTD
6. Product photography
7. Domain (if already owned, 15 minutes)
8. Analytics

---

*Birmingham AV · Hamzah handoff doc · 2026-04-19*
