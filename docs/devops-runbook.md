# CareEquity — DevOps Runbook

## Staging Environment & Mobile App Release

**Audience:** DevOps / Platform Engineering
**Scope:** Staging server provisioning, environment variables, EAS build pipeline, iOS & Android artifact production and store submission
**Last updated:** 2026-02-28

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Staging Environment](#2-staging-environment)
   - 2.1 [Server Provisioning](#21-server-provisioning)
   - 2.2 [Environment Variables](#22-environment-variables)
   - 2.3 [GitHub Secrets & Environments](#23-github-secrets--environments)
   - 2.4 [First-Time Deployment](#24-first-time-deployment)
   - 2.5 [Automated Deploys](#25-automated-deploys)
   - 2.6 [Running Migrations](#26-running-migrations)
   - 2.7 [Verifying Staging Health](#27-verifying-staging-health)
3. [Mobile: Accounts & Credentials Setup](#3-mobile-accounts--credentials-setup)
   - 3.1 [Expo / EAS Account](#31-expo--eas-account)
   - 3.2 [Apple Developer Program](#32-apple-developer-program)
   - 3.3 [Google Play Console](#33-google-play-console)
4. [EAS Project Initialisation](#4-eas-project-initialisation)
5. [App Assets](#5-app-assets)
6. [iOS Build Pipeline](#6-ios-build-pipeline)
   - 6.1 [Signing Credentials](#61-signing-credentials)
   - 6.2 [Build Commands](#62-build-commands)
   - 6.3 [TestFlight Distribution](#63-testflight-distribution)
7. [Android Build Pipeline](#7-android-build-pipeline)
   - 7.1 [Signing Credentials](#71-signing-credentials)
   - 7.2 [Build Commands](#72-build-commands)
   - 7.3 [Internal Testing Distribution](#73-internal-testing-distribution)
8. [CI/CD — GitHub Actions EAS Workflow](#8-cicd--github-actions-eas-workflow)
9. [Production Submission](#9-production-submission)
   - 9.1 [iOS — App Store Connect](#91-ios--app-store-connect)
   - 9.2 [Android — Google Play](#92-android--google-play)
10. [Environment Variable Reference](#10-environment-variable-reference)
11. [Runbook Checklist](#11-runbook-checklist)

---

## 1. Prerequisites

### Required tools (install on CI runner and local workstation)

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | `nvm install 20` |
| npm | ≥ 10 | bundled with Node 20 |
| EAS CLI | ≥ 12.0.0 | `npm install -g eas-cli` |
| Docker + Docker Compose | v25+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| GitHub CLI | ≥ 2.40 | `brew install gh` |
| Git | ≥ 2.40 | system package manager |

### Required accounts

| Account | Purpose | Who creates it |
|---------|---------|----------------|
| [expo.dev](https://expo.dev) | EAS Build & Submit | DevOps lead |
| [Apple Developer Program](https://developer.apple.com/programs/) | iOS distribution ($99/yr) | iOS lead |
| [App Store Connect](https://appstoreconnect.apple.com) | App listing + TestFlight | iOS lead |
| [Google Play Console](https://play.google.com/console) | Android listing ($25 one-time) | Android lead |
| SMTP provider (e.g. SendGrid, Postmark) | Transactional email | DevOps |
| Twilio (optional) | SMS reminders | DevOps |
| Sentry (optional) | Error tracking | DevOps |

---

## 2. Staging Environment

### 2.1 Server Provisioning

Staging runs on a single Linux server (Ubuntu 22.04 LTS recommended, 4 vCPU / 8 GB RAM minimum) using `docker-compose.staging.yml`.

**Ports exposed by the staging stack:**

| Service | Internal | External |
|---------|----------|----------|
| API (NestJS) | 3001 | **3011** |
| Web (Next.js) | 3000 | **3010** |
| PostgreSQL | 5432 | **5442** |
| Elasticsearch | 9200 | **9210** |

```bash
# 1. Create the deploy user on the staging server
sudo adduser deploy
sudo usermod -aG docker deploy

# 2. Add your CI SSH public key to the deploy user
sudo mkdir -p /home/deploy/.ssh
echo "<CI_PUBLIC_KEY>" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Create the deploy directory
sudo mkdir -p /opt/careequity-staging
sudo chown deploy:deploy /opt/careequity-staging

# 4. Clone the repo as the deploy user
sudo -u deploy bash -c "
  cd /opt/careequity-staging
  git clone https://github.com/z3r0fidev/has-cares-pro .
"

# 5. Install Docker if not present
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
```

### 2.2 Environment Variables

Copy the staging template and fill in all required values:

```bash
cp .env.staging.example /opt/careequity-staging/.env.staging
nano /opt/careequity-staging/.env.staging
```

**Minimum required values for staging to boot:**

```ini
# --- REQUIRED (staging will not start without these) ---

POSTGRES_USER=admin
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=careequity_staging

ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=<strong-random-password>

JWT_SECRET=<min-32-char-random-string>

NODE_ENV=staging

# URL of the staging API as seen by the staging web container
NEXT_PUBLIC_API_URL=http://<STAGING_HOST>:3011

# Comma-separated list of allowed CORS origins
CORS_ORIGIN=http://<STAGING_HOST>:3010

# --- OPTIONAL (features degrade gracefully if absent) ---

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

SENTRY_DSN=

DB_POOL_MAX=20
DB_POOL_MIN=2

# EHR / Insurance integrations (mock adapter used if blank)
AVAILITY_CLIENT_ID=
AVAILITY_CLIENT_SECRET=
AVAILITY_API_URL=https://api.availity.com

EPIC_CLIENT_ID=
EPIC_CLIENT_SECRET=
EPIC_FHIR_BASE_URL=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4

ATHENA_CLIENT_ID=
ATHENA_CLIENT_SECRET=
ATHENA_API_URL=https://api.athenahealth.com/v1
```

> **Security note:** `JWT_SECRET` must be at least 32 random characters. Generate with:
> `openssl rand -hex 32`

### 2.3 GitHub Secrets & Environments

In the GitHub repository go to **Settings → Environments** and create a `staging` environment. Add the following secrets to that environment:

| Secret name | Value |
|-------------|-------|
| `STAGING_HOST` | Hostname or IP of the staging server (e.g. `staging.careequity.org`) |
| `STAGING_USER` | `deploy` |
| `STAGING_SSH_KEY` | Contents of the private SSH key whose public key was added to the server in §2.1 |
| `STAGING_PATH` | `/opt/careequity-staging` |

The `deploy-staging.yml` workflow uses the `staging` environment; the secrets above are only available to jobs that reference it.

### 2.4 First-Time Deployment

```bash
# On the staging server as the deploy user
cd /opt/careequity-staging

# Bring up all services (builds images from source)
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

# Run all pending migrations
docker compose -f docker-compose.staging.yml exec api \
  npx typeorm migration:run -d dist/data-source.js

# Confirm health
curl http://localhost:3011/health
# Expected: {"status":"ok","db":"ok","es":"ok"}
```

### 2.5 Automated Deploys

Every push to `main` automatically triggers `.github/workflows/deploy-staging.yml`, which:

1. Builds fresh `careequity-api:staging` and `careequity-web:staging` Docker images using GitHub Actions layer cache
2. SSH-deploys to the staging server
3. Pulls the latest code (`git pull`)
4. Restarts containers (`docker compose up -d --build`)
5. Runs pending migrations
6. Performs a smoke test against `GET /health`

To trigger a manual deploy without pushing code:

```bash
gh workflow run deploy-staging.yml
```

### 2.6 Running Migrations

Migrations are TypeORM files in `packages/db/src/migrations/`. They run automatically on every staging deploy. To run them manually:

```bash
# On staging server
docker compose -f docker-compose.staging.yml exec api \
  npx typeorm migration:run -d dist/data-source.js

# Revert the last migration if needed
docker compose -f docker-compose.staging.yml exec api \
  npx typeorm migration:revert -d dist/data-source.js
```

Current migrations (in order):

| Timestamp | Name |
|-----------|------|
| 1708123456789 | EnablePostgis |
| 1771305873546 | InitialSchema |
| 1771309638358 | AddProfileImage |
| 1771310009395 | AddUserEntity |
| 1771312111331 | AddInsuranceField |
| 1771313396329 | AddAnalytics |
| 1771317961154 | AddBookingAndCareTeam |
| 1771320035486 | AddCareHistory |
| 1771325000000 | AddInsuranceNotifiedAt |
| 1771330000000 | AddProviderBio |
| 1771331000000 | AddProviderInvitation |
| 1771332000000 | AddUserPhone |
| 1771333000000 | AddReviewVerifiedPatient |
| 1771334000000 | CreateProviderReferral |
| 1771335000000 | CreateMessage |

### 2.7 Verifying Staging Health

```bash
# API health (from outside the server)
curl http://<STAGING_HOST>:3011/health
# {"status":"ok","db":"ok","es":"ok"}

# Web (should return HTTP 200)
curl -I http://<STAGING_HOST>:3010

# Container status
docker compose -f docker-compose.staging.yml ps

# API logs (last 100 lines)
docker compose -f docker-compose.staging.yml logs --tail=100 api

# Follow live logs
docker compose -f docker-compose.staging.yml logs -f api web
```

---

## 3. Mobile: Accounts & Credentials Setup

### 3.1 Expo / EAS Account

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
eas login
# → Enter your expo.dev email and password

# Verify login
eas whoami
```

### 3.2 Apple Developer Program

1. Enroll at [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/) ($99/yr)
2. Wait for enrollment approval (1–7 business days for organisations)
3. In App Store Connect, create a new App:
   - Platform: iOS
   - Name: **CareEquity**
   - Bundle ID: `org.careequity.app`
   - Primary Language: English (U.S.)
   - SKU: `careequity-ios-001`
4. Note down:
   - **Apple ID** (your developer account email)
   - **App Store Connect App ID** (numeric, from the app's URL in ASC)
   - **Apple Team ID** (from Membership in developer.apple.com)

### 3.3 Google Play Console

1. Register at [play.google.com/console](https://play.google.com/console) ($25 one-time)
2. Create a new app:
   - App name: **CareEquity**
   - Default language: English (United States)
   - App or Game: App
   - Free or Paid: Free
3. Under **Setup → API access**, link to a Google Cloud project and create a service account with **Release Manager** role
4. Download the service account JSON key → save as `google-play-key.json`

> **Security:** `google-play-key.json` must never be committed. It is referenced in `eas.json` at `submit.production.android.serviceAccountKeyPath` and should be stored as a GitHub Actions secret or Expo secret.

---

## 4. EAS Project Initialisation

These steps are one-time and must be completed before any build can succeed.

```bash
cd apps/mobile

# Link the project to your Expo account
eas init
# → Select "Create a new project" → name it "careequity"
# → EAS assigns a projectId (UUID) — copy it

# Update app.json with the real projectId
# Replace "REPLACE_WITH_EAS_PROJECT_ID" in extra.eas.projectId
```

Then in `apps/mobile/app.json`, fill in the three Apple placeholders in `eas.json`:

```json
// eas.json — submit.production.ios
{
  "appleId": "you@careequity.org",
  "ascAppId": "1234567890",
  "appleTeamId": "ABCDE12345"
}
```

Commit these changes:

```bash
git add apps/mobile/app.json apps/mobile/eas.json
git commit -m "chore(mobile): wire EAS project ID and Apple identifiers"
```

---

## 5. App Assets

The `apps/mobile/assets/` directory is **not committed** — create it locally and on CI before building. See `apps/mobile/ASSETS.md` for full pixel specs.

| File | Dimensions | Notes |
|------|-----------|-------|
| `assets/icon.png` | 1024 × 1024 px | No alpha. Gold bg (#F5BE00) + white CE monogram |
| `assets/splash.png` | 1284 × 2778 px | White bg + gold wordmark. 320 px safe zone all edges |
| `assets/adaptive-icon.png` | 1024 × 1024 px | Alpha channel. Transparent bg — foreground only |
| `assets/notification-icon.png` | 96 × 96 px | White silhouette on transparent bg (Android) |

Validate assets before building:

```bash
cd apps/mobile
npx expo-doctor
# All checks must pass before triggering an EAS build
```

To make assets available to GitHub Actions, either:

**Option A — Store in a private S3 bucket and download in CI:**
```yaml
# Add to eas-build.yml before the EAS build step
- name: Download assets
  run: |
    aws s3 cp s3://careequity-assets/mobile/ apps/mobile/assets/ --recursive
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**Option B — Commit as git LFS tracked files** (simpler for small teams):
```bash
git lfs install
git lfs track "apps/mobile/assets/*.png"
git add .gitattributes apps/mobile/assets/
git commit -m "chore(mobile): add app store assets via git LFS"
```

---

## 6. iOS Build Pipeline

### 6.1 Signing Credentials

EAS manages signing credentials automatically. On first build, EAS will:

1. Create an iOS Distribution Certificate in your Apple Developer account
2. Create an App Store Provisioning Profile for `org.careequity.app`
3. Store both securely in Expo's credential storage

```bash
cd apps/mobile

# Verify credentials are configured (or set them up)
eas credentials --platform ios

# Expected output:
# Distribution Certificate: ✓ (managed by EAS)
# Provisioning Profile:    ✓ (managed by EAS)
```

To use your own existing certificates instead:
```bash
eas credentials --platform ios
# Select "Use existing certificate" and follow prompts
```

### 6.2 Build Commands

```bash
cd apps/mobile

# Development build (runs on iOS Simulator — no real device signing needed)
eas build --platform ios --profile development

# Preview build (internal distribution — IPA delivered via URL to registered devices)
eas build --platform ios --profile preview

# Production build (App Store distribution — signed .IPA ready for TestFlight/submission)
eas build --platform ios --profile production
```

Or via npm scripts:
```bash
npm run build:preview --workspace=apps/mobile
npm run build:production --workspace=apps/mobile
```

Build progress is visible at [expo.dev/accounts/<username>/projects/careequity/builds](https://expo.dev).

### 6.3 TestFlight Distribution

After a `production` build completes:

```bash
# Submit the latest iOS build to TestFlight automatically
eas submit --platform ios --profile production --latest
```

Or submit a specific build:
```bash
eas submit --platform ios --id <build-id>
```

In App Store Connect:
1. Go to **TestFlight** → your build appears after processing (10–30 min)
2. Add internal testers (up to 100, no review required)
3. Add external testers (up to 10,000, requires brief App Store review)
4. Distribute to testers

---

## 7. Android Build Pipeline

### 7.1 Signing Credentials

```bash
cd apps/mobile

# Option A — Let EAS generate and manage a keystore (recommended for new apps)
eas credentials --platform android
# Select "Generate new keystore"
# EAS stores it securely; you can download a backup at any time

# Option B — Use your own keystore
eas credentials --platform android
# Select "Use existing keystore" and provide the .jks file
```

> **Critical:** Download and securely store a backup of the Android keystore. If it is lost, you cannot update the app on Google Play. EAS keystore backups are available at expo.dev → Project → Credentials.

**Google Play Service Account (for automated submission):**

```bash
# Place the Google Play service account JSON at the path referenced in eas.json
cp ~/Downloads/google-play-key.json apps/mobile/google-play-key.json
# This file is in .gitignore — never commit it
```

To store it as an Expo secret instead (for CI):
```bash
eas secret:create --scope project --name GOOGLE_PLAY_KEY_JSON \
  --value "$(cat google-play-key.json)"
```

### 7.2 Build Commands

```bash
cd apps/mobile

# Development build (APK for local device testing)
eas build --platform android --profile development

# Preview build (APK for internal distribution)
eas build --platform android --profile preview

# Production build (AAB — App Bundle for Play Store submission)
eas build --platform android --profile production
```

The `production` profile produces a `.aab` (Android App Bundle) with `autoIncrement: true`, which automatically bumps `versionCode` on each build.

### 7.3 Internal Testing Distribution

After a `preview` APK build:

```bash
# Download the APK URL from the build output, then share with testers
eas build:list --platform android --limit 1
# → Copy the artifact URL and distribute via email/Slack
```

Or submit directly to the **Internal Testing** track on Google Play:
```bash
eas submit --platform android --profile production --latest
# Submits to the 'internal' track as configured in eas.json
```

---

## 8. CI/CD — GitHub Actions EAS Workflow

The workflow file is at `.github/workflows/eas-build.yml`.

### Required GitHub repository secret

| Secret | Value |
|--------|-------|
| `EXPO_TOKEN` | Personal access token from expo.dev → Account Settings → Access Tokens |

To create the token:
```
expo.dev → Account Settings → Access Tokens → Create Token
Name: "GitHub Actions CI"
Permissions: Build read+write, Submit read+write
```

Add it to the repository:
```
GitHub repo → Settings → Secrets and variables → Actions → New secret
Name: EXPO_TOKEN
Value: <token>
```

### Trigger conditions

| Event | Trigger | Profile |
|-------|---------|---------|
| Push to `main` with changes in `apps/mobile/**` | Automatic | `preview` |
| Manual `workflow_dispatch` | On demand | Selectable: `development`, `preview`, `production` |

### Manually trigger a production build from GitHub

```bash
gh workflow run eas-build.yml -f profile=production
```

Or from the GitHub UI: **Actions → EAS Build → Run workflow → Select profile → Run**.

### Adding the Google Play key to CI

If automated Android submission is needed from CI, store the service account JSON as a GitHub secret and reference it in the workflow:

```yaml
# Add to eas-build.yml before the EAS build step
- name: Write Google Play key
  run: echo '${{ secrets.GOOGLE_PLAY_KEY_JSON }}' > apps/mobile/google-play-key.json
```

---

## 9. Production Submission

### 9.1 iOS — App Store Connect

**Prerequisites:** A `production` EAS build is complete and has been submitted to TestFlight (§6.3). Internal testing has been completed with no critical issues.

**Step-by-step:**

1. In App Store Connect, open the CareEquity app → **App Store** tab
2. Click **+** next to iOS App to create a new version (1.0.0)
3. Fill in version information using `apps/mobile/store-listing.md`:
   - **What's New:** Version 1.0.0 release notes
   - **Description:** Full description (4,000 char limit)
   - **Keywords:** `minority doctor,black physician,cultural care,find doctor,physician locator,health equity,diverse doctor` (100 char limit, comma-separated)
   - **Support URL:** `https://careequity.org/support`
   - **Marketing URL:** `https://careequity.org`
   - **Privacy Policy URL:** `https://careequity.org/privacy`
4. Upload screenshots (captured from a real device or simulator):
   - iPhone 6.9" (1320 × 2868 px) — minimum 3, up to 10
   - See `apps/mobile/store-listing.md` for recommended screenshot subjects
5. Under **Build**, select the TestFlight build to submit
6. Complete the **App Review Information**:
   - Demo account credentials (use a pre-seeded staging patient account)
   - Contact info for the review team
7. Set **Age Rating** to 4+
8. Submit for Review — typical review time: 24–48 hours

### 9.2 Android — Google Play

**Prerequisites:** A `production` `.aab` build is complete and has passed internal testing.

**Step-by-step:**

1. In Google Play Console, open CareEquity → **Production** track → **Create new release**
2. Upload the `.aab` from the EAS build (download from expo.dev or use `eas submit`)
3. Fill in store listing from `apps/mobile/store-listing.md`:
   - **Short description:** "Locate minority and culturally competent physicians in your neighborhood." (≤80 chars)
   - **Full description:** Full description text
   - **App icon:** 512 × 512 px PNG (same artwork as `icon.png`, cropped to square)
   - **Feature graphic:** 1024 × 500 px (required for Play Store)
   - **Screenshots:** Phone — 1080 × 1920 px minimum, at least 2
4. Complete **Content rating** questionnaire (select "Medical" category → Everyone)
5. Complete **Target audience** (Adults 18+)
6. Complete **Data safety** form (location used during use, not shared with third parties)
7. Set **App category:** Health & Fitness
8. Roll out to **Internal testing** → confirm → promote to **Production** when ready

**Automated submission via EAS:**
```bash
cd apps/mobile
eas submit --platform android --profile production --latest
# Submits to the 'internal' track; promote manually in Play Console
```

---

## 10. Environment Variable Reference

### API (`apps/api`) — complete list

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_HOST` | ✅ | `localhost` | PostgreSQL hostname |
| `POSTGRES_PORT` | | `5432` | PostgreSQL port |
| `POSTGRES_USER` | ✅ | `admin` | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ | — | PostgreSQL password |
| `POSTGRES_DB` | ✅ | `careequity` | PostgreSQL database name |
| `ELASTICSEARCH_NODE` | ✅ | `http://localhost:9200` | Elasticsearch URL |
| `ELASTICSEARCH_USERNAME` | | `elastic` | Elasticsearch username |
| `ELASTICSEARCH_PASSWORD` | | `changeme` | Elasticsearch password |
| `JWT_SECRET` | ✅ | — | Min 32-char secret for JWT signing |
| `PORT` | | `3001` | API server port |
| `NODE_ENV` | | `development` | Runtime environment |
| `LOG_LEVEL` | | `info` | Logging verbosity |
| `CORS_ORIGIN` | | `http://localhost:3000` | Allowed CORS origin(s), comma-separated |
| `SMTP_HOST` | | — | SMTP hostname (email features no-op if absent) |
| `SMTP_PORT` | | `587` | SMTP port (465 = implicit TLS) |
| `SMTP_USER` | | — | SMTP username |
| `SMTP_PASSWORD` | | — | SMTP password |
| `SMTP_FROM` | | — | From address for notification emails |
| `DB_POOL_MAX` | | `20` | Max DB connection pool size |
| `DB_POOL_MIN` | | `2` | Min DB connection pool size |
| `TWILIO_ACCOUNT_SID` | | — | Twilio SID (SMS no-ops if absent) |
| `TWILIO_AUTH_TOKEN` | | — | Twilio auth token |
| `TWILIO_FROM_NUMBER` | | — | Twilio sender phone number (E.164) |
| `SENTRY_DSN` | | — | Sentry project DSN (disabled if blank) |
| `AVAILITY_CLIENT_ID` | | — | Availity OAuth2 client ID (mock adapter used if blank) |
| `AVAILITY_CLIENT_SECRET` | | — | Availity OAuth2 client secret |
| `AVAILITY_API_URL` | | `https://api.availity.com` | Availity base URL |
| `EPIC_CLIENT_ID` | | — | Epic SMART on FHIR client ID |
| `EPIC_CLIENT_SECRET` | | — | Epic SMART on FHIR client secret |
| `EPIC_FHIR_BASE_URL` | | `https://fhir.epic.com/...` | Epic FHIR R4 base URL |
| `ATHENA_CLIENT_ID` | | — | Athenahealth OAuth2 client ID |
| `ATHENA_CLIENT_SECRET` | | — | Athenahealth OAuth2 client secret |
| `ATHENA_API_URL` | | `https://api.athenahealth.com/v1` | Athenahealth API base URL |

### Web (`apps/web`) — complete list

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Full URL to the API as seen from the browser |
| `SENTRY_DSN` | | Sentry project DSN for Next.js (disabled if blank) |

### Mobile (`apps/mobile`) — runtime variables

Mobile uses Expo's `EXPO_PUBLIC_*` convention for variables baked into the bundle at build time.

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | | API base URL override (defaults to `http://10.0.2.2:3001` for Android emulator) |

Set EAS build-time env vars in `eas.json` under each profile's `env` key, or via Expo secrets:

```bash
# Set a secret for all EAS builds in this project
eas secret:create --scope project --name EXPO_PUBLIC_API_URL \
  --value "https://api.careequity.org"
```

### GitHub Actions secrets — complete list

| Secret | Used by | Description |
|--------|---------|-------------|
| `STAGING_HOST` | `deploy-staging.yml` | Staging server hostname/IP |
| `STAGING_USER` | `deploy-staging.yml` | SSH deploy username |
| `STAGING_SSH_KEY` | `deploy-staging.yml` | PEM private SSH key |
| `STAGING_PATH` | `deploy-staging.yml` | Server path (default `/opt/careequity-staging`) |
| `EXPO_TOKEN` | `eas-build.yml` | Expo personal access token |
| `GOOGLE_PLAY_KEY_JSON` | `eas-build.yml` (optional) | Google Play service account JSON contents |

---

## 11. Runbook Checklist

Use this checklist when preparing a production release.

### Staging

- [ ] Staging server provisioned and SSH key added
- [ ] `.env.staging` created with all required values
- [ ] GitHub `staging` environment created with `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, `STAGING_PATH`
- [ ] `docker compose -f docker-compose.staging.yml up -d` succeeds
- [ ] `GET /health` returns `{"status":"ok","db":"ok","es":"ok"}`
- [ ] All TypeORM migrations ran successfully
- [ ] Web app loads at `http://<STAGING_HOST>:3010`
- [ ] Login, search, booking flow tested end-to-end on staging

### Mobile — pre-build

- [ ] Apple Developer Program enrollment approved
- [ ] App Store Connect app record created (bundle ID: `org.careequity.app`)
- [ ] Google Play Console app record created (package: `org.careequity.app`)
- [ ] `eas.json` updated: `appleId`, `ascAppId`, `appleTeamId`
- [ ] `app.json` updated: `extra.eas.projectId` (from `eas init`)
- [ ] All assets in `apps/mobile/assets/`: `icon.png`, `splash.png`, `adaptive-icon.png`, `notification-icon.png`
- [ ] `npx expo-doctor` passes all checks
- [ ] `EXPO_TOKEN` GitHub secret set

### iOS build & submission

- [ ] `eas build --platform ios --profile production` completes successfully
- [ ] Build submitted to TestFlight (`eas submit --platform ios --latest`)
- [ ] Internal testers tested the build in TestFlight
- [ ] App Store Connect version record created
- [ ] Screenshots uploaded (iPhone 6.9": 1320 × 2868 px, ≥3 images)
- [ ] Store listing copy filled in (from `apps/mobile/store-listing.md`)
- [ ] Privacy policy URL reachable: `https://careequity.org/privacy`
- [ ] Demo account credentials added to App Review notes
- [ ] Submitted for App Store review

### Android build & submission

- [ ] `eas build --platform android --profile production` completes successfully
- [ ] Android keystore backup downloaded and stored securely
- [ ] Google Play service account JSON stored (not committed)
- [ ] AAB submitted to internal testing track
- [ ] Internal testers approved the build
- [ ] Store listing filled in: short desc, full desc, feature graphic (1024 × 500), screenshots
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
- [ ] Promoted to production rollout

### Post-release

- [ ] Version tags created in git: `git tag v1.0.0 && git push --tags`
- [ ] Sentry release created (if Sentry is enabled)
- [ ] App store URLs added to `apps/mobile/store-listing.md`
- [ ] ROADMAP.md updated to mark milestone as shipped
