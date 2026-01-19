# Amazon SP-API Data Sharing Policy
**Company:** MENTOREIS LLC
**Platform:** SellerGenix
**Website:** https://www.sellergenix.io
**Date:** January 2025
**Policy Version:** 1.0

---

## Executive Summary
This document outlines SellerGenix's data sharing practices in full compliance with Amazon's Acceptable Use Policy (AUP) Section 4.6. We are committed to protecting Amazon seller data and maintaining the highest standards of data security and privacy.

---

## AUP 4.6 Compliance Statement

**Question:** List all outside parties with whom your organization shares Amazon Information and describe how your organization shares this information.

**Answer:**

### Complete List of Outside Parties with Whom SellerGenix Shares Data

SellerGenix shares Amazon Information **ONLY** with the following service providers, strictly for the purpose of delivering our analytics platform services to authorized Amazon sellers:

---

### 1. Supabase Inc. (Database Infrastructure)

**Location:** United States (AWS infrastructure)
**Purpose:** Secure database hosting, encrypted data storage, backup and disaster recovery

**Amazon Information Shared:**
- Seller performance data (sales revenue, units sold, orders)
- Product information (ASIN, SKU, titles, pricing)
- Inventory levels and FBA stock data
- PPC campaign performance metrics
- Financial transaction data (fees, payouts, refunds)
- User account information (seller email, company name)

**How Information is Shared:**
- Data transmitted via encrypted HTTPS connections (TLS 1.3)
- Stored with AES-256 encryption at rest
- Access restricted to authorized SellerGenix backend services only
- No direct human access to raw Amazon data by Supabase employees
- Governed by Data Processing Agreement (DPA) requiring GDPR/CCPA compliance

**Security Standards:**
- SOC 2 Type II certified
- ISO 27001 compliant
- Regular third-party security audits
- Automated backup with point-in-time recovery

---

### 2. Stripe Inc. (Payment Processing)

**Location:** United States
**Purpose:** Process subscription payments, manage invoices, handle refunds

**Amazon Information Shared:**
- **NONE** - Stripe does NOT receive any Amazon seller data, business metrics, or Amazon Information
- Only receives standard billing information (customer name, email, payment details for SellerGenix subscription)

**How Information is Shared:**
- Payment details tokenized through Stripe.js (never touches our servers)
- Subscription billing handled via Stripe API
- No Amazon sales data, product information, or business metrics transmitted

**Security Standards:**
- PCI DSS Level 1 certified
- Bank-level encryption and fraud detection
- Tokenized payment processing

---

### 3. Twilio Inc. (WhatsApp Business API)

**Location:** United States
**Purpose:** Deliver real-time notifications and performance alerts to sellers via WhatsApp

**Amazon Information Shared:**
- **Limited and anonymized data only:**
  - Seller phone numbers (for notification delivery)
  - Performance summaries (e.g., "Daily sales: $X", "Low stock alert: Product ABC")
  - Alert messages (e.g., "Your ACOS increased by X%")

**What is NOT Shared:**
- Raw Amazon API data
- Detailed product listings
- Customer information (PII)
- Comprehensive sales reports
- Competitor data or market insights

**How Information is Shared:**
- Messages transmitted via Twilio WhatsApp Business API
- End-to-end encrypted messaging (WhatsApp encryption)
- No data retention by Twilio beyond message delivery logs
- Governed by Business Associate Agreement (BAA)

**Security Standards:**
- ISO 27001 certified
- GDPR and CCPA compliant
- End-to-end message encryption
- Regular security assessments

---

### 4. Vercel Inc. (Web Application Hosting)

**Location:** United States (AWS/Google Cloud infrastructure)
**Purpose:** Host SellerGenix web application frontend, CDN distribution

**Amazon Information Shared:**
- **NONE** - Vercel does NOT receive any Amazon data or seller information
- Only hosts frontend code (HTML, CSS, JavaScript) and static assets
- Application logic runs server-side, not exposed to hosting provider

**How Information is Shared:**
- Frontend code deployed to Vercel Edge Network
- No database access, no API keys, no sensitive data
- Server-side API calls handled by Supabase backend (not Vercel)

**Security Standards:**
- SOC 2 compliant
- DDoS protection
- SSL/TLS encryption for all traffic
- Global CDN with edge caching

---

## Data Sharing Principles

### What We DO NOT Do (AUP Compliance)

In strict adherence to Amazon AUP Sections 4.4, 4.5, and 4.6:

❌ **We DO NOT aggregate data across sellers** - Each seller's data remains isolated and is never combined with other sellers' data for benchmarking or analytics.

❌ **We DO NOT sell or share data with third parties** - Amazon Information is never sold, rented, or shared with marketing agencies, data brokers, or external analytics services.

❌ **We DO NOT target Amazon customers** - Customer PII from orders is used ONLY for order fulfillment and tax compliance, never for marketing.

❌ **We DO NOT share Amazon business insights** - We do not aggregate, publish, or share insights about Amazon's platform, policies, or business operations.

❌ **We DO NOT use external data services** - We do not integrate with or use external (non-Amazon) data services that vend Amazon-derived information.

✅ **We ONLY use Amazon Information to serve the individual seller** - Data is displayed exclusively to the authorized seller who owns it, for their own business analytics and optimization.

---

## Data Security Measures

### Encryption
- **In Transit:** TLS 1.3 for all data transfers
- **At Rest:** AES-256 encryption for database storage
- **API Security:** OAuth 2.0 authentication with Amazon SP-API

### Access Controls
- **Principle of Least Privilege:** Only essential personnel have access to production systems
- **No Direct Data Access:** Third-party providers cannot directly access raw Amazon data
- **Multi-Factor Authentication:** Required for all administrative accounts
- **Regular Access Audits:** Quarterly reviews of access permissions

### Monitoring & Compliance
- **Real-time Security Monitoring:** 24/7 intrusion detection
- **Regular Penetration Testing:** Annual third-party security assessments
- **Compliance Audits:** GDPR Article 28 compliance for all data processors
- **Incident Response Plan:** Documented procedures for data breach scenarios

---

## Seller Transparency

### How We Inform Sellers

We are completely transparent with sellers about our data practices:

1. **Privacy Policy:** Detailed disclosure of all data sharing practices
   URL: https://www.sellergenix.io/privacy

2. **Terms of Service:** Clear explanation of Amazon API usage
   URL: https://www.sellergenix.io/terms

3. **Onboarding Process:** Explicit consent required for Amazon SP-API authorization

4. **Dashboard Notifications:** Sellers can view which third parties have access to infrastructure

### Seller Rights

Sellers have full control over their data:
- **Right to Access:** View all data we've collected
- **Right to Deletion:** Request complete data removal (GDPR/CCPA)
- **Right to Portability:** Export data in machine-readable format
- **Right to Revoke Access:** Disconnect Amazon SP-API authorization at any time

---

## Contact Information

**Data Protection Officer:**
MENTOREIS LLC
2501 Chatham Road, STE 5143
Springfield, IL 62704
United States

**Email:** media@mentoreis.com
**Phone:** +1 (206) 312-8915
**Website:** https://www.sellergenix.io

For Amazon SP-API compliance inquiries, please contact us using the information above.

---

## Legal Compliance

This data sharing policy complies with:
- Amazon Acceptable Use Policy (AUP) - Sections 4.4, 4.5, 4.6
- Amazon Data Protection Policy (DPP)
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Illinois Personal Information Protection Act

**Document ID:** SG-DPP-AMAZON-2025-001
**Last Updated:** January 2025
**Next Review:** July 2025

---

## Certification

I, on behalf of MENTOREIS LLC, certify that the information provided in this document is accurate and complete. We commit to notifying Amazon SP-API Developer Support within 30 days of any changes to our data sharing practices, organizational structure, or third-party service providers.

**Company:** MENTOREIS LLC
**Platform:** SellerGenix
**Authorized Representative:** [To be signed during application]
**Date:** January 2025
