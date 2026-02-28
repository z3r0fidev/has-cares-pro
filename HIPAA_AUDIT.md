# HIPAA Readiness Audit Report
Date: 2026-02-28
Auditor: CareEquity Security Review (Claude claude-sonnet-4-6)

---

## Executive Summary

**Overall Assessment: Partially Ready — Not suitable for handling real PHI without addressing Critical and High findings first.**

CareEquity has a solid architectural foundation (TypeORM parameterized queries, bcrypt password hashing, JWT authentication with expiry, rate limiting on auth endpoints, a global exception filter that avoids stack-trace leakage, and a PHI Redactor applied to review content). However, five exploitable vulnerabilities were found and fixed in this audit, and a number of additional organizational and technical safeguards required by HIPAA must be implemented before the platform handles real patient data.

Critical findings: **2** (fixed in this audit)
High findings: **4** (2 fixed, 2 require human/infrastructure action)
Medium findings: **5**
Low / Informational: **5**

---

## Findings

### Critical (must fix before handling real patient data)

---

#### CRIT-1: Unauthenticated Review Submission — PHI Linkage Risk
- **Location:** `apps/api/src/controllers/provider.controller.ts`, `POST /providers/:id/reviews`
- **Risk:** Any unauthenticated actor could submit reviews without any identity attached. While the Redactor strips recognised PHI patterns from review text, a patient writing a review like "I was treated for depression" would have that text stored with no `patient_id`, making de-identification or right-to-erasure requests impossible to fulfill. Additionally, unauthenticated submissions offer no accountability trail required under HIPAA §164.312(b).
- **Fix Applied:** Added `@UseGuards(JwtAuthGuard)` and injected `req.user.sub` as `patient_id` on every review, ensuring every review is traceable to an authenticated account.

---

#### CRIT-2: Privilege Escalation via Self-Assigned Admin Role at Registration
- **Location:** `apps/api/src/dto/auth.dto.ts`, `POST /auth/register`
- **Risk:** The `role` field in `RegisterDto` previously accepted `'admin'` as a valid value via `@IsIn(['patient', 'provider', 'admin'])`. Any user could call `POST /auth/register` with `{"role": "admin"}` and receive a JWT with `role: admin`, gaining immediate access to all admin endpoints including patient appointment data, provider verification, and review moderation. This is a critical privilege escalation with direct impact on PHI access controls (HIPAA §164.312(a)(1)).
- **Fix Applied:** Removed `'admin'` from the allowed values in `RegisterDto`. The `AuthService.register` method signature was updated to accept only `'patient' | 'provider'`. Admin accounts must be seeded directly in the database or promoted by an existing admin via a separate, audited mechanism.

---

### High (fix before production launch)

---

#### HIGH-1: Broken Access Control on Appointment Status Updates
- **Location:** `apps/api/src/controllers/booking.controller.ts`, `PATCH /booking/appointment/:id/status`
- **Risk:** `BookingController` applies `@UseGuards(JwtAuthGuard)` at the class level (correct), but the `updateStatus` handler had no ownership check. Any authenticated user — including a patient — could change any appointment's status to any value (e.g., marking a cancelled appointment as `completed`). A patient could also change another patient's appointment status, which is an IDOR (Insecure Direct Object Reference) and a HIPAA access control violation under §164.312(a)(1).
- **Fix Applied:** The handler now passes the caller's identity and role to `BookingService.updateStatus`. The service enforces that only the treating provider (matched by `providerId`) or an admin may update appointment status. Any other caller receives HTTP 403.

---

#### HIGH-2: Mass Assignment — Provider Can Overwrite Privilege-Sensitive Fields
- **Location:** `apps/api/src/controllers/provider.controller.ts`, `PATCH /providers/:id`
- **Risk:** The `PATCH /providers/:id` handler accepted `Partial<Provider>` and called `Object.assign(provider, updateData)` directly. A provider could send `{"verification_tier": 3, "is_claimed": false}` in the request body to self-promote their verification tier or unclaim their own profile. Verification tier is a trust signal used to surface providers to patients — inflating it fraudulently directly harms patients making care decisions.
- **Fix Applied:** Before `Object.assign`, non-admin callers now have `verification_tier` and `is_claimed` deleted from `updateData`, preventing providers from modifying these fields.

---

#### HIGH-3: Wildcard CORS Policy
- **Location:** `apps/api/src/main.ts`, `app.enableCors()`
- **Risk:** `app.enableCors()` with no options defaults to `Access-Control-Allow-Origin: *`. This means any website on the internet can make credentialed cross-origin requests to the API from a user's browser. Combined with JWT tokens stored in `localStorage` on the web client (a common pattern), a malicious page could silently exfiltrate patient appointment data. HIPAA §164.312(e)(1) requires protection of ePHI in transit.
- **Fix Applied:** CORS is now restricted to origins listed in the `CORS_ORIGIN` environment variable (defaults to `http://localhost:3000`). The variable is comma-delimited to allow multiple origins (e.g., staging + production). `CORS_ORIGIN` has been added to `.env.example`.

---

#### HIGH-4: SMTP Transport May Send Credentials in Plain Text
- **Location:** `apps/api/src/services/invitation.service.ts`, `apps/api/src/services/notification.service.ts`
- **Risk:** Both services hard-coded `secure: false`, meaning the SMTP transport always uses STARTTLS (opportunistic upgrade) rather than implicit TLS. On port 465, the correct setting is `secure: true`. If an operator configures `SMTP_PORT=465` expecting implicit TLS, the connection would still start in plain text and might succeed without encryption, potentially exposing PHI-adjacent data (provider names, patient email addresses) in transit.
- **Fix Applied:** Both services now compute `secure: port === 465`, enabling implicit TLS on the standard TLS port and STARTTLS on all others.

---

### Medium (fix within 30 days of launch)

---

#### MED-1: CareHistory Entity Has No Controller or Access Guard — Currently Dead Code With Significant PHI
- **Location:** `packages/db/src/entities/CareHistory.ts`
- **Risk:** The `CareHistory` entity stores `diagnosis`, `prescriptions`, `summary`, and `follow_up_instructions` — this is highly sensitive PHI by any definition (HIPAA §160.103). No controller currently exposes this table, but it exists in the TypeORM entity list, migrations, and will be created in the database. When a developer adds a controller, the absence of a pre-existing access-control design significantly increases the chance of a security oversight. Additionally, the data should be encrypted at rest at the application layer (column-level encryption) given its clinical sensitivity.
- **Recommendation:** If this feature is not being built imminently, remove `CareHistory` from the entity list and migrations to reduce the attack surface. If it will be built, design and document the access control model (who can write, who can read, is it limited to the treating provider?) before implementation, and evaluate AES-256 column-level encryption for `diagnosis`, `prescriptions`, and `summary`.

---

#### MED-2: Appointment `reason` Field Stored Unencrypted, With No Length Guard Against PHI Dumps
- **Location:** `packages/db/src/entities/Appointment.ts` (column `reason`), `apps/api/src/dto/booking.dto.ts`
- **Risk:** `reason` is a free-text field capped at 500 characters by the DTO. Patients routinely enter medically sensitive content in appointment reason fields (e.g., "follow-up for HIV treatment"). This is PHI stored as plain text in PostgreSQL with no column-level encryption. HIPAA §164.312(a)(2)(iv) (encryption and decryption) recommends encryption of ePHI at rest.
- **Recommendation:** Apply AES-256 encryption to the `reason` and `notes` columns using TypeORM column transformers. The decryption key should come from a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault), not from environment variables stored alongside the database.

---

#### MED-3: Review `patient_id` Field Is Not Stripped From Public API Responses
- **Location:** `apps/api/src/services/review.service.ts`, `findByProvider()`, and `GET /providers/:id/reviews`
- **Risk:** `findByProvider()` returns all `published` reviews including the `patient_id` column. This is the UUID of the patient account. While it is not a name or email, it is a persistent identifier that could be correlated across requests (e.g., a provider seeing that the same patient ID wrote multiple reviews). Under HIPAA, indirect identifiers can still constitute PHI when combined. The public review endpoint `GET /providers/:id/reviews` should not return `patient_id` to unauthenticated callers.
- **Recommendation:** Use a TypeORM `select` projection or a DTO/mapper to exclude `patient_id` from the public `GET /providers/:id/reviews` response. Only admins and the originating patient should be able to see the author identifier.

---

#### MED-4: `Redactor.hasPHI` Uses Stateful Regex — Bug Causes Intermittent Misses
- **Location:** `packages/core/src/utils/redactor.ts`, `hasPHI()` method
- **Risk:** JavaScript `RegExp` objects with the `g` flag are stateful — they maintain a `lastIndex` cursor. When `hasPHI()` calls `.test()` on a class-level static regex, it advances `lastIndex`. If called twice in a row with the same text, the second call starts scanning from where the first left off and may return `false` even if PHI is present. The `ReviewService` calls `Redactor.hasPHI(content)` and then `Redactor.redact(content)` on the same text — but because `redact()` uses `.replace()` (which resets `lastIndex`), this particular call sequence is currently safe. The hazard is real if `hasPHI` is ever called twice consecutively, which any future developer could do inadvertently.
- **Recommendation:** Change `hasPHI()` to use regex literals created fresh inside the method body, or call `regex.lastIndex = 0` before each `.test()`. Alternatively, use `regex.source` to construct a one-shot `new RegExp(...)` test without the `g` flag. Add a unit test that calls `hasPHI()` twice in a row on a string containing a phone number to catch regressions.

---

#### MED-5: No Audit Trail for PHI Data Access
- **Location:** All controllers accessing patient data (booking, reviews, analytics)
- **Risk:** HIPAA §164.312(b) requires activity logs that record when ePHI is accessed, by whom, and what action was taken. The current `LoggingInterceptor` logs only HTTP method, URL, and status code. It does not record the authenticated user's ID, the patient record ID being accessed, or the action type. Without this, a breach investigation cannot answer "who accessed patient X's appointments between date A and date B."
- **Recommendation:** Extend `LoggingInterceptor` (or add a dedicated audit interceptor) to log: `user_id` (from `req.user?.sub`), `action` (method + route), `resource_id` (path param `:id` where present), and `timestamp`. Write these audit events to an append-only store (separate database table or a write-only log stream). Consider using the existing `AnalyticsEvent` infrastructure as a model, but to a separate `AuditLog` table that is never deleted.

---

### Low / Informational

---

#### LOW-1: JWT Expiry Is 7 Days — Acceptable But Higher Than Recommended
- **Location:** `packages/core/src/utils/auth.ts`, `signToken()`, `expiresIn: '7d'`
- **Risk:** A 7-day JWT means a stolen token is valid for up to a week. There is no token revocation mechanism (no blacklist, no refresh-token flow). For a healthcare application, NIST SP 800-63B recommends short session timeouts for sensitive operations (15-30 minutes idle timeout). HIPAA §164.312(a)(2)(iii) requires automatic log-off.
- **Recommendation:** Implement a refresh-token pattern with a short-lived access token (15-60 minutes) and a longer-lived refresh token stored `HttpOnly` in a secure cookie. Add a token revocation table for logout. At minimum, document the 7-day expiry as a known risk and add it to the pre-launch checklist.

---

#### LOW-2: Invitation Token Is a UUID — Adequate But No Rate Limit on Guessing
- **Location:** `apps/api/src/services/invitation.service.ts`, `GET /invitations/preview/:token`
- **Risk:** The invitation token is a UUID v4, which provides 122 bits of entropy — sufficient to resist brute-force. However, `GET /invitations/preview/:token` is a public unauthenticated endpoint with no per-IP rate limit beyond the global throttler (60 req/min at the app level). An attacker with high throughput could enumerate tokens. This is a low-probability risk given UUID entropy but worth noting.
- **Recommendation:** Apply a tighter `@Throttle` decorator on `GET /invitations/preview/:token` (e.g., 10 requests per minute per IP). Also consider switching to a cryptographically random 32-byte hex token (`crypto.randomBytes(32).toString('hex')`) instead of UUID for slightly stronger guarantees and a less recognisable format.

---

#### LOW-3: SSRF Risk in Website Scraper
- **Location:** `packages/core/src/utils/scraper.ts`, `ScraperUtils.findProfileImage()`
- **Risk:** The scraper makes an outbound HTTP request to `website_url` from the provider profile update. A provider could set `website_url` to an internal network address (e.g., `http://169.254.169.254/latest/meta-data/` on AWS) and use the scraper as an SSRF vector to reach cloud metadata services, internal databases, or other private endpoints. The impact is currently limited because only the HTML content is parsed for image tags — but the connection itself is established, and error messages from `console.error` could leak internal topology.
- **Recommendation:** Before calling `axios.get(url)`, validate that the URL resolves to a public IP (block RFC-1918 and link-local ranges: `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, `::1`, `fd00::/8`). Use a DNS pre-resolution step and check the resolved IP. Alternatively, run the scraper in an isolated network namespace with no access to internal services.

---

#### LOW-4: Hardcoded Default Credentials in Development Config
- **Location:** `packages/db/src/data-source.ts` (fallback `password`), `packages/core/src/search/client.ts` (fallback `changeme`), `packages/core/src/utils/auth.ts` (fallback `careequity-dev-secret`), `apps/api/src/main.ts` (env validation blocks start without `JWT_SECRET`)
- **Risk:** The fallback defaults (`password`, `changeme`, `careequity-dev-secret`) exist for developer convenience. The `main.ts` `validateEnv()` function correctly blocks startup if `JWT_SECRET` is absent in production — this is good. However, `ELASTICSEARCH_PASSWORD` defaulting to `changeme` and `POSTGRES_PASSWORD` to `password` are not validated the same way. If a deployment environment variable is misconfigured, the app will start with the default weak credential.
- **Recommendation:** Add `ELASTICSEARCH_PASSWORD` and `POSTGRES_PASSWORD` to the `REQUIRED_ENV` array in `main.ts` so the app refuses to start without them being explicitly set. Document that the defaults in source code are development-only and that the CI/CD pipeline should fail if these values appear in a production deploy manifest.

---

#### LOW-5: Provider Profile Image URL Is Stored Externally Without Validation
- **Location:** `packages/core/src/utils/scraper.ts`, `resolveUrl()` — stored in `Provider.profile_image_url`
- **Risk:** The scraped image URL is stored as-is and later served to clients (web and mobile). If a malicious provider sets a URL that the scraper resolves to a redirect chain ending at a `javascript:` URI or a `data:` URI, an XSS payload could be delivered via `<img src="...">` to patients viewing the provider profile. Additionally, a provider could point their website at content that changes after scraping, resulting in an inappropriate image being surfaced.
- **Recommendation:** After scraping, validate that `profile_image_url` matches `^https://` (HTTPS only), has an image-like extension or Content-Type, and is not on an internal IP range. The Next.js `next.config.ts` `images.remotePatterns` provides some protection for the web client, but the stored URL itself should be validated at write time.

---

## Applied Fixes

The following code changes were made directly during this audit:

| # | File | Change |
|---|------|--------|
| 1 | `apps/api/src/controllers/provider.controller.ts` | Added `@UseGuards(JwtAuthGuard)` to `POST /providers/:id/reviews`; injected `req.user.sub` as `patient_id` |
| 2 | `apps/api/src/controllers/provider.controller.ts` | `PATCH /providers/:id` — strip `verification_tier` and `is_claimed` from `updateData` for non-admin callers |
| 3 | `apps/api/src/controllers/booking.controller.ts` | `PATCH /booking/appointment/:id/status` — pass caller identity to service for ownership check |
| 4 | `apps/api/src/services/booking.service.ts` | `updateStatus()` — enforce provider/admin ownership before allowing status change |
| 5 | `apps/api/src/dto/auth.dto.ts` | Removed `'admin'` from `RegisterDto.role` allowed values |
| 6 | `apps/api/src/services/auth.service.ts` | Updated `register()` signature to exclude `'admin'` role |
| 7 | `apps/api/src/services/invitation.service.ts` | SMTP `secure` now computed from port (implicit TLS on 465) |
| 8 | `apps/api/src/services/notification.service.ts` | SMTP `secure` now computed from port (implicit TLS on 465) |
| 9 | `apps/api/src/main.ts` | Replaced `app.enableCors()` with origin-allowlist CORS using `CORS_ORIGIN` env var |
| 10 | `.env.example` | Added `CORS_ORIGIN=http://localhost:3000` with documentation comment |

---

## Remaining Action Items

Prioritised by HIPAA impact. Items marked [HUMAN] require decisions or infrastructure work beyond code changes.

### Must-Do Before Handling Real Patient Data

| Priority | Item | Owner |
|----------|------|-------|
| P0 | [HUMAN] Execute a Business Associate Agreement (BAA) with every vendor that may process ePHI: AWS/cloud provider, Sentry (crash reporting), SMTP provider, Elasticsearch Cloud (if used), any future analytics SaaS | Legal / Executive |
| P0 | Implement column-level encryption for `Appointment.reason`, `Appointment.notes`, `CareHistory.diagnosis`, `CareHistory.prescriptions`, `CareHistory.summary` using AES-256 with keys from a secrets manager | Engineering |
| P0 | [HUMAN] Engage a HIPAA security officer and document the formal Risk Assessment (required by §164.308(a)(1)) | Compliance |
| P1 | Add an AuditLog table and extend the `LoggingInterceptor` to record `user_id`, `action`, `resource_id`, `timestamp` for every request that touches patient data | Engineering |
| P1 | Strip `patient_id` from `GET /providers/:id/reviews` public response | Engineering |
| P1 | Fix the stateful regex bug in `Redactor.hasPHI()` and add a regression test | Engineering |

### Fix Before Production Launch

| Priority | Item | Owner |
|----------|------|-------|
| P2 | Implement refresh-token flow; reduce access-token lifetime to 15-60 minutes; add logout token revocation | Engineering |
| P2 | [HUMAN] Enable encryption at rest for PostgreSQL (Transparent Data Encryption or encrypted EBS/disk volumes) and Elasticsearch indices | Infrastructure |
| P2 | [HUMAN] Configure HTTPS termination in all environments (TLS 1.2 minimum, TLS 1.3 preferred) with HSTS headers; update `ELASTICSEARCH_NODE` default to `https://` | Infrastructure |
| P2 | Add SSRF protection to `ScraperUtils.findProfileImage()` — block RFC-1918 and link-local IPs | Engineering |
| P2 | Add `ELASTICSEARCH_PASSWORD` and `POSTGRES_PASSWORD` to `REQUIRED_ENV` check in `main.ts` | Engineering |
| P2 | Evaluate whether `CareHistory` entity should be removed or given a full access-control design before any controller is added | Engineering / Product |

### Fix Within 30 Days of Launch

| Priority | Item | Owner |
|----------|------|-------|
| P3 | [HUMAN] Establish and document a data retention and deletion policy; implement `DELETE /users/me` (right-to-erasure) endpoint | Engineering / Legal |
| P3 | Rate-limit `GET /invitations/preview/:token` more aggressively (separate from global throttle) | Engineering |
| P3 | Validate scraped `profile_image_url` is HTTPS and not an internal IP before storage | Engineering |
| P3 | [HUMAN] Evaluate whether `AnalyticsEvent.metadata` (search filter JSON) can contain any patient-identifiable search patterns and implement a retention window (e.g., 90-day TTL) | Compliance / Engineering |
| P3 | [HUMAN] Implement a formal employee HIPAA training program for all team members with system access | HR / Compliance |
| P3 | [HUMAN] Establish an Incident Response Plan (required by §164.308(a)(6)) | Compliance |

---

## HIPAA Technical Safeguard Checklist

(45 CFR §164.312 — Technical Safeguards)

| Safeguard | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| §164.312(a)(1) | Unique user identification | PARTIAL | JWT `sub` is UUID; no shared accounts. No MFA. |
| §164.312(a)(2)(i) | Emergency access procedure | NOT IMPLEMENTED | No documented break-glass procedure |
| §164.312(a)(2)(ii) | Automatic logoff | NOT IMPLEMENTED | 7-day JWT with no idle timeout; no server-side session |
| §164.312(a)(2)(iii) | Encryption and decryption | PARTIAL | Passwords bcrypt-hashed; PHI fields (reason, notes, diagnosis) stored in plain text |
| §164.312(a)(2)(iv) | Access control | PARTIAL | Role-based guards in place; IDOR on status update fixed this audit; admin self-registration fixed this audit |
| §164.312(b) | Audit controls | NOT IMPLEMENTED | HTTP request logs exist; no user+resource audit trail |
| §164.312(c)(1) | Integrity controls | PARTIAL | TypeORM schema enforces types; no cryptographic integrity checking on stored data |
| §164.312(c)(2) | Transmission integrity | PARTIAL | HTTPS not yet enforced at app level; SMTP TLS fixed this audit |
| §164.312(d) | Person or entity authentication | PARTIAL | JWT auth guard on all sensitive endpoints; no MFA; no session revocation |
| §164.312(e)(1) | Transmission security | PARTIAL | No HSTS headers; no HTTPS enforcement in `main.ts`; ES node defaults to `http://`; CORS restricted this audit |
| §164.312(e)(2)(i) | Encryption in transit | PARTIAL | Depends on deployment (TLS termination at load balancer); not enforced at application layer |
| §164.312(e)(2)(ii) | Encryption at rest | NOT IMPLEMENTED | PostgreSQL and Elasticsearch data unencrypted at application layer; depends on infrastructure |
