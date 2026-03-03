# Privacy Policy

**QEP AI Solve — Privacy Policy**

*Last updated: `[DATE — Derek to insert before publishing]`*

*Draft for review — not final. Placeholders marked with `[PLACEHOLDER]` require Derek's input.*

---

## 1. About Us

QEP AI Solve is operated by:

- **Company Name:** `[PLACEHOLDER: Registered company name]` ("we", "us", "our")
- **Company Number:** `[PLACEHOLDER: Companies House number]`
- **Registered Address:** `[PLACEHOLDER: Registered office address]`
- **Data Protection Officer (DPO):** `[PLACEHOLDER: DPO name or role title]`
- **DPO Contact Email:** `[PLACEHOLDER: e.g. dpo@qep-aisolve.app]`

We are the data controller for the personal data processed through the QEP AI Solve service.

---

## 2. Overview

This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the QEP AI Solve platform. We are committed to protecting your privacy and handling your data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

---

## 3. What Data We Collect

### 3.1 Account Information

When you create an account, we collect:

- Email address
- Password (stored as a cryptographic hash by Supabase — we never see or store your plaintext password)
- Self-selected business segment (e.g. solopreneur, small business owner, senior manager, CEO/founder)

### 3.2 Business Problem Data

When you use the Service, we collect:

- Problem statements and descriptions you submit ("Decisions")
- Your responses to clarifying questions
- The 4-layer classification of your problem (symptoms, challenges, domains, intent)

### 3.3 Generated Documents

We store the strategic documents generated for you, including:

- SCQA strategic documents (situation, complication, question, answer)
- Implementation roadmaps
- Alchemy Layer outputs (counterintuitive options, perception play, small bets, hidden driver analysis)

### 3.4 Payment Information

When you subscribe, we collect:

- Your chosen monthly payment amount
- Payment tier classification (trial, below average, average, above average)
- Stripe customer and subscription identifiers

**We do not directly collect or store credit card numbers, CVVs, or bank account details.** All payment card data is handled exclusively by Stripe.

### 3.5 Usage Data

We automatically collect:

- Monthly query counts
- Decision history and status
- Timestamps of account creation and activity

### 3.6 Technical Data

We may collect standard technical data including:

- IP address
- Browser type and version
- Device information
- Pages visited and features used

---

## 4. How We Use Your Data

| Purpose | Lawful Basis (UK GDPR) |
|---------|----------------------|
| Provide and operate the Service | Performance of contract (Art. 6(1)(b)) |
| Process your business problems through AI analysis | Performance of contract (Art. 6(1)(b)) |
| Process payments and manage subscriptions | Performance of contract (Art. 6(1)(b)) |
| Send service-related notifications (billing, account changes) | Performance of contract (Art. 6(1)(b)) |
| Calculate aggregate payment statistics for PWYW anchoring | Legitimate interest (Art. 6(1)(f)) |
| Improve Service reliability and fix bugs | Legitimate interest (Art. 6(1)(f)) |
| Comply with legal obligations | Legal obligation (Art. 6(1)(c)) |

---

## 5. Customer Strategic Data and AI Training

**Your strategic business data is never used to train, fine-tune, or improve any AI model.**

When you submit a business problem, it is sent to the Anthropic Claude API solely to generate your requested strategic output. This data is:

- Processed in real time to produce your document
- Not used by us or Anthropic to train or improve AI models
- Not shared with other customers or any third party for training purposes
- Handled in accordance with Anthropic's data processing terms, which prohibit using API inputs for model training

This is a core commitment of our Service.

---

## 6. Sub-Processors

We use the following third-party sub-processors to deliver the Service:

| Sub-Processor | Purpose | Data Processed | Location |
|---------------|---------|---------------|----------|
| **Supabase** | Authentication, database hosting, data storage | Account data, decisions, documents, usage data | `[PLACEHOLDER: Confirm Supabase region — e.g. EU (Frankfurt) or US]` |
| **Anthropic (Claude API)** | AI processing — problem classification and strategic document generation | Problem statements, clarifying question responses, classification data | United States |
| **Stripe** | Payment processing and subscription management | Email, payment amounts, card details (handled directly by Stripe) | United States (with EU infrastructure) |
| **Vercel** | Application hosting and delivery | Technical/request data | `[PLACEHOLDER: Confirm Vercel region]` |

`[PLACEHOLDER: Derek — if Supabase and/or Vercel are hosted outside the UK/EEA, confirm that appropriate transfer mechanisms (e.g. Standard Contractual Clauses) are in place and reference them here.]`

---

## 7. International Data Transfers

Some of our sub-processors are based in or process data in the United States. Where personal data is transferred outside the UK, we ensure appropriate safeguards are in place, including:

- Standard Contractual Clauses (SCCs) approved by the UK Information Commissioner's Office
- The sub-processor's participation in relevant data protection frameworks

`[PLACEHOLDER: Derek — confirm specific transfer mechanisms for each US-based sub-processor.]`

---

## 8. Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| Account information | Retained while your account is active, deleted within 30 days of account deletion request |
| Decisions and documents | Retained while your account is active; you may delete individual decisions at any time |
| Payment records | Retained for 7 years after the transaction date to comply with UK tax and accounting obligations |
| Usage data | Retained for 12 months on a rolling basis |
| Technical/server logs | Retained for 90 days |

When data is deleted, it is permanently removed from our active systems. Backup copies may persist for up to 30 additional days before automatic purging.

---

## 9. Your Rights Under UK GDPR

You have the following rights regarding your personal data:

### 9.1 Right of Access

You may request a copy of the personal data we hold about you. We will respond within one month.

### 9.2 Right to Rectification

You may request correction of inaccurate or incomplete personal data.

### 9.3 Right to Erasure ("Right to Be Forgotten")

You may request deletion of your personal data. We will comply unless we have a lawful obligation to retain it (e.g. tax records).

### 9.4 Right to Data Portability

You may request your data in a structured, commonly used, machine-readable format (JSON or CSV). This includes your decisions, documents, and account data.

### 9.5 Right to Restrict Processing

You may request that we restrict processing of your data in certain circumstances (e.g. while a dispute is being resolved).

### 9.6 Right to Object

You may object to processing based on legitimate interests. We will cease processing unless we have compelling legitimate grounds.

### 9.7 Rights Related to Automated Decision-Making

The AI classification and document generation features of the Service involve automated processing. However, these outputs are decision-support tools provided for your consideration — no binding decisions are made about you solely by automated means.

### How to Exercise Your Rights

To exercise any of these rights, contact our Data Protection Officer:

**Email:** `[PLACEHOLDER: dpo@qep-aisolve.app]`

We will respond to all requests within one month. If a request is complex, we may extend this by a further two months, and we will inform you of any extension within the first month.

If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO):

- **Website:** https://ico.org.uk
- **Telephone:** 0303 123 1113

---

## 10. Data Security

We implement appropriate technical and organisational measures to protect your personal data, including:

- Encryption in transit (TLS/HTTPS) for all data
- Encryption at rest for stored data via Supabase
- Row-level security (RLS) policies ensuring users can only access their own data
- Secure authentication via Supabase Auth
- Regular review of access controls

No method of transmission or storage is 100% secure. If you become aware of a security vulnerability, please contact us immediately at `[PLACEHOLDER: security contact email]`.

---

## 11. Cookies

`[PLACEHOLDER: Derek — confirm cookie usage. At minimum, Supabase Auth uses essential session cookies. If analytics tools (e.g. Vercel Analytics, PostHog) are added, a cookie consent mechanism will be required. Specify which cookies are used and their purposes.]`

The Service uses essential cookies required for authentication and session management. These are strictly necessary and do not require consent.

---

## 12. Children's Data

The Service is designed for business professionals and is not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child, we will delete it promptly.

---

## 13. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service at least 30 days before they take effect. The "Last updated" date at the top of this policy will be revised accordingly.

---

## 14. Contact Us

For any questions about this Privacy Policy or how we handle your data:

**Data Protection Officer:** `[PLACEHOLDER: DPO name or role]`
**Email:** `[PLACEHOLDER: dpo@qep-aisolve.app]`

**General enquiries:**
**Email:** `[PLACEHOLDER: hello@qep-aisolve.app or similar]`

`[PLACEHOLDER: Registered company name]`
`[PLACEHOLDER: Registered office address]`
`[PLACEHOLDER: Company number]`
